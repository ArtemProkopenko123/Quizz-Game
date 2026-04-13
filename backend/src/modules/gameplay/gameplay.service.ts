import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../sessions/session.entity';
import { Player } from '../players/player.entity';
import { Round } from './round.entity';
import { Answer } from './answer.entity';
import { QuestionsService } from '../questions/questions.service';
import { ScoringService } from './scoring.service';
import { GameplayEmitterService } from './gameplay-emitter.service';
import { SessionPhase } from '../../common/enums/session-phase.enum';

const COUNTDOWN_MS = 3_000;
const ALL_ANSWERED_DELAY_MS = 5_000;
const ROUND_RESULT_DELAY_MS = 5_000;
const CATEGORY_VOTE_MS = 30_000;
const ALL_VOTED_DELAY_MS = 5_000;

export interface AnswerResult {
  accepted: boolean;
  scoreDelta: number;
  error?: string;
}

@Injectable()
export class GameplayService {
  /** sessionId → round close timer */
  private readonly roundTimers = new Map<string, ReturnType<typeof setTimeout>>();
  /** sessionId → category vote resolution timer */
  private readonly voteTimers = new Map<string, ReturnType<typeof setTimeout>>();
  /** sessionId → Map<playerId, packId> */
  private readonly categoryVotes = new Map<string, Map<string, string>>();

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,

    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,

    @InjectRepository(Round)
    private readonly roundRepo: Repository<Round>,

    @InjectRepository(Answer)
    private readonly answerRepo: Repository<Answer>,

    private readonly questionsService: QuestionsService,
    private readonly scoringService: ScoringService,
    private readonly emitter: GameplayEmitterService,
  ) {}

  // ── Public: host actions ────────────────────────────────────────

  async startGame(sessionId: string, requestingPlayerId: string): Promise<void> {
    const session = await this.getSessionOrThrow(sessionId);

    if (session.hostPlayerId !== requestingPlayerId) {
      throw new ForbiddenException('Only the host can start the game');
    }
    if (session.phase !== SessionPhase.LOBBY) {
      throw new BadRequestException('Game can only be started from lobby');
    }

    await this.startCategoryVote(session);
  }

  async updateSettings(
    sessionId: string,
    requestingPlayerId: string,
    roundCount?: number,
    questionsPerRound?: number,
    questionDuration?: number,
  ): Promise<void> {
    const session = await this.getSessionOrThrow(sessionId);

    if (session.hostPlayerId !== requestingPlayerId) {
      throw new ForbiddenException('Only the host can change settings');
    }
    if (session.phase !== SessionPhase.LOBBY) {
      throw new BadRequestException('Settings can only be changed in lobby');
    }

    const allPacks = this.questionsService.listPacks();
    const maxRounds = allPacks.length; // can't have more rounds than packs

    if (roundCount !== undefined) {
      session.roundCount = Math.min(roundCount, maxRounds);
    }
    if (questionsPerRound !== undefined) {
      session.questionsPerRound = questionsPerRound;
    }
    if (questionDuration !== undefined) {
      session.questionDuration = questionDuration;
    }

    await this.sessionRepo.save(session);

    this.emitter.emitToSession(sessionId, 'session:settings_updated', {
      roundCount: session.roundCount,
      questionsPerRound: session.questionsPerRound,
      questionDuration: session.questionDuration,
    });
  }

  // ── Public: category vote ───────────────────────────────────────

  async submitCategoryVote(
    sessionId: string,
    playerId: string,
    packId: string,
  ): Promise<void> {
    const session = await this.getSessionOrThrow(sessionId);

    if (session.phase !== SessionPhase.CATEGORY_VOTE) {
      throw new BadRequestException('Not in category vote phase');
    }

    // Validate pack is available
    const usedPackIds = this.parseUsedPackIds(session);
    const allPacks = this.questionsService.listPacks();
    const available = allPacks.filter((p) => !usedPackIds.includes(p.id));
    const validPack = available.find((p) => p.id === packId);
    if (!validPack) {
      throw new BadRequestException('Pack not available for voting');
    }

    let votes = this.categoryVotes.get(sessionId);
    if (!votes) {
      votes = new Map();
      this.categoryVotes.set(sessionId, votes);
    }
    votes.set(playerId, packId);

    // Broadcast updated votes
    this.emitter.emitToSession(sessionId, 'category:vote_updated', {
      votes: Object.fromEntries(votes),
    });

    // Check if all connected players have voted → shorten timer to 5s
    const connectedPlayers = await this.playerRepo.findBy({ sessionId, isConnected: true });
    if (connectedPlayers.length > 0 && votes.size >= connectedPlayers.length) {
      const newDeadlineAt = new Date(Date.now() + ALL_VOTED_DELAY_MS).toISOString();
      this.emitter.emitToSession(sessionId, 'category:all_voted', { newDeadlineAt });
      this.cancelVoteTimer(sessionId);
      const timer = setTimeout(() => void this.resolveCategoryVote(sessionId), ALL_VOTED_DELAY_MS);
      this.voteTimers.set(sessionId, timer);
    }
  }

  // ── Public: answers ─────────────────────────────────────────────

  async submitAnswer(
    sessionId: string,
    playerId: string,
    questionId: string,
    answerIndex: number,
  ): Promise<AnswerResult> {
    const session = await this.getSessionOrThrow(sessionId);

    if (session.phase !== SessionPhase.QUESTION_OPEN) {
      return { accepted: false, scoreDelta: 0, error: 'INVALID_PHASE' };
    }

    const round = await this.roundRepo.findOne({
      where: { sessionId, roundIndex: session.currentRoundIndex, isClosed: false },
    });

    if (!round) {
      return { accepted: false, scoreDelta: 0, error: 'ROUND_NOT_ACTIVE' };
    }

    if (round.questionId !== questionId) {
      return { accepted: false, scoreDelta: 0, error: 'QUESTION_MISMATCH' };
    }

    const now = new Date();
    if (now > round.deadlineAt) {
      return { accepted: false, scoreDelta: 0, error: 'ANSWER_DEADLINE_EXPIRED' };
    }

    if (!session.questionPackId) {
      return { accepted: false, scoreDelta: 0, error: 'INVALID_PHASE' };
    }

    const pack = this.questionsService.findPackById(session.questionPackId);
    const question = pack.questions.find((q) => q.id === questionId);
    if (!question) {
      return { accepted: false, scoreDelta: 0, error: 'QUESTION_MISMATCH' };
    }

    const isCorrect = answerIndex === question.correctAnswerIndex;
    const scoreDelta = this.scoringService.calculateScore({
      isCorrect,
      submittedAtMs: now.getTime(),
      deadlineAtMs: round.deadlineAt.getTime(),
      roundStartMs: round.createdAt.getTime(),
    });

    const existing = await this.answerRepo.findOneBy({ roundId: round.id, playerId });
    if (existing) {
      existing.answerIndex = answerIndex;
      existing.isCorrect = isCorrect;
      await this.answerRepo.save(existing);
      return { accepted: true, scoreDelta: existing.scoreDelta };
    }

    await this.answerRepo.save(
      this.answerRepo.create({ roundId: round.id, playerId, answerIndex, isCorrect, scoreDelta }),
    );

    if (isCorrect) {
      await this.playerRepo.increment({ id: playerId }, 'score', scoreDelta);
    }

    await this.checkAllAnswered(sessionId, round.id);

    return { accepted: true, scoreDelta };
  }

  // ── Category vote internals ─────────────────────────────────────

  private async startCategoryVote(session: Session): Promise<void> {
    const usedPackIds = this.parseUsedPackIds(session);
    const allPacks = this.questionsService.listPacks();
    const available = allPacks.filter((p) => !usedPackIds.includes(p.id));

    if (available.length === 0) {
      // All packs exhausted — finish the game
      await this.finishGame(session);
      return;
    }

    // Reset vote map for this session
    this.categoryVotes.set(session.id, new Map());

    session.phase = SessionPhase.CATEGORY_VOTE;
    await this.sessionRepo.save(session);

    const deadlineAt = new Date(Date.now() + CATEGORY_VOTE_MS).toISOString();

    this.emitter.emitToSession(session.id, 'category:vote_started', {
      deadlineAt,
      availablePacks: available,
      stageIndex: session.currentStageIndex,
      totalStages: session.roundCount,
    });

    // Schedule auto-resolve
    const timer = setTimeout(() => {
      void this.resolveCategoryVote(session.id);
    }, CATEGORY_VOTE_MS);
    this.voteTimers.set(session.id, timer);
  }

  private async resolveCategoryVote(sessionId: string): Promise<void> {
    this.cancelVoteTimer(sessionId);

    const session = await this.getSessionOrThrow(sessionId);
    if (session.phase !== SessionPhase.CATEGORY_VOTE) return; // already resolved

    const votes = this.categoryVotes.get(sessionId) ?? new Map<string, string>();
    const usedPackIds = this.parseUsedPackIds(session);
    const allPacks = this.questionsService.listPacks();
    const available = allPacks.filter((p) => !usedPackIds.includes(p.id));

    if (available.length === 0) {
      await this.finishGame(session);
      return;
    }

    // Tally votes
    const tally = new Map<string, number>();
    for (const packId of votes.values()) {
      if (available.find((p) => p.id === packId)) {
        tally.set(packId, (tally.get(packId) ?? 0) + 1);
      }
    }

    let winner: string;
    if (tally.size === 0) {
      // No votes cast — pick random from available
      winner = available[Math.floor(Math.random() * available.length)]!.id;
    } else {
      const maxVotes = Math.max(...tally.values());
      const tied = [...tally.entries()]
        .filter(([, count]) => count === maxVotes)
        .map(([packId]) => packId);
      winner = tied[Math.floor(Math.random() * tied.length)]!;
    }

    const winnerPack = allPacks.find((p) => p.id === winner)!;

    // Update session
    session.questionPackId = winner;
    session.usedPackIds = JSON.stringify([...usedPackIds, winner]);
    session.currentRoundIndex = 0;
    session.phase = SessionPhase.COUNTDOWN;
    await this.sessionRepo.save(session);

    const countdownDeadlineAt = new Date(Date.now() + COUNTDOWN_MS).toISOString();

    this.emitter.emitToSession(sessionId, 'category:selected', {
      packId: winner,
      packTitle: winnerPack.title,
      packEmoji: winnerPack.emoji,
      countdownDeadlineAt,
    });

    this.emitter.emitToSession(sessionId, 'game:countdown_started', {
      deadlineAt: countdownDeadlineAt,
    });

    setTimeout(() => {
      void this.openNextRound(sessionId);
    }, COUNTDOWN_MS);
  }

  private cancelVoteTimer(sessionId: string): void {
    const timer = this.voteTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.voteTimers.delete(sessionId);
    }
  }

  // ── Round internals ─────────────────────────────────────────────

  private async checkAllAnswered(sessionId: string, roundId: string): Promise<void> {
    const [connectedPlayers, answers] = await Promise.all([
      this.playerRepo.findBy({ sessionId, isConnected: true }),
      this.answerRepo.findBy({ roundId }),
    ]);

    if (connectedPlayers.length === 0) return;
    if (answers.length < connectedPlayers.length) return;

    const newDeadlineAt = new Date(Date.now() + ALL_ANSWERED_DELAY_MS);

    this.emitter.emitToSession(sessionId, 'round:all_answered', {
      newDeadlineAt: newDeadlineAt.toISOString(),
    });

    this.scheduleCloseRound(sessionId, roundId, ALL_ANSWERED_DELAY_MS);
  }

  private async openNextRound(sessionId: string): Promise<void> {
    const session = await this.getSessionOrThrow(sessionId);

    if (!session.questionPackId) {
      await this.finishGame(session);
      return;
    }

    // Check if stage is complete
    if (session.currentRoundIndex >= session.questionsPerRound) {
      await this.advanceStage(session);
      return;
    }

    const pack = this.questionsService.findPackById(session.questionPackId);

    // Also check if pack has run out of questions
    if (session.currentRoundIndex >= pack.questions.length) {
      await this.advanceStage(session);
      return;
    }

    const question = pack.questions[session.currentRoundIndex]!;
    const roundDurationMs = session.questionDuration * 1_000;
    const deadlineAt = new Date(Date.now() + roundDurationMs);

    const round = this.roundRepo.create({
      sessionId,
      roundIndex: session.currentRoundIndex,
      questionId: question.id,
      deadlineAt,
    });
    await this.roundRepo.save(round);

    session.phase = SessionPhase.QUESTION_OPEN;
    await this.sessionRepo.save(session);

    // Total questions shown as min(questionsPerRound, pack.questions.length)
    const totalInStage = Math.min(session.questionsPerRound, pack.questions.length);

    this.emitter.emitToSession(sessionId, 'question:started', {
      roundIndex: session.currentRoundIndex,
      totalRounds: totalInStage,
      questionId: question.id,
      prompt: question.prompt,
      options: question.options,
      deadlineAt: deadlineAt.toISOString(),
    });

    this.scheduleCloseRound(sessionId, round.id, roundDurationMs);
  }

  private async advanceStage(session: Session): Promise<void> {
    session.currentStageIndex += 1;

    if (session.currentStageIndex >= session.roundCount) {
      await this.finishGame(session);
      return;
    }

    await this.sessionRepo.save(session);
    await this.startCategoryVote(session);
  }

  private scheduleCloseRound(sessionId: string, roundId: string, delayMs: number): void {
    const existing = this.roundTimers.get(sessionId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      void this.closeRound(sessionId, roundId);
    }, delayMs);
    this.roundTimers.set(sessionId, timer);
  }

  private async closeRound(sessionId: string, roundId: string): Promise<void> {
    this.roundTimers.delete(sessionId);
    const session = await this.getSessionOrThrow(sessionId);

    const round = await this.roundRepo.findOneBy({ id: roundId });
    if (!round || round.isClosed) return;

    round.isClosed = true;
    await this.roundRepo.save(round);

    session.phase = SessionPhase.QUESTION_CLOSED;
    await this.sessionRepo.save(session);

    if (!session.questionPackId) return;
    const pack = this.questionsService.findPackById(session.questionPackId);
    const question = pack.questions.find((q) => q.id === round.questionId);
    const [players, answers] = await Promise.all([
      this.playerRepo.findBy({ sessionId }),
      this.answerRepo.findBy({ roundId }),
    ]);

    const answerMap = new Map(answers.map((a) => [a.playerId, a.scoreDelta]));
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    this.emitter.emitToSession(sessionId, 'round:result', {
      questionId: round.questionId,
      correctAnswerIndex: question?.correctAnswerIndex ?? -1,
      scores: players.map((p) => ({
        playerId: p.id,
        roundScore: answerMap.get(p.id) ?? 0,
        totalScore: p.score,
      })),
      leaderboard: sortedPlayers.map((p) => ({
        playerId: p.id,
        name: p.name,
        score: p.score,
      })),
    });

    session.phase = SessionPhase.ROUND_RESULT;
    session.currentRoundIndex += 1;
    await this.sessionRepo.save(session);

    setTimeout(() => {
      void this.openNextRound(sessionId);
    }, ROUND_RESULT_DELAY_MS);
  }

  private async finishGame(session: Session): Promise<void> {
    const players = await this.playerRepo.findBy({ sessionId: session.id });

    session.phase = SessionPhase.GAME_RESULT;
    await this.sessionRepo.save(session);

    const sorted = [...players].sort((a, b) => b.score - a.score);

    this.emitter.emitToSession(session.id, 'game:result', {
      sessionId: session.id,
      leaderboard: sorted.map((p, i) => ({
        rank: i + 1,
        playerId: p.id,
        name: p.name,
        score: p.score,
      })),
    });
  }

  private parseUsedPackIds(session: Session): string[] {
    try {
      return JSON.parse(session.usedPackIds ?? '[]') as string[];
    } catch {
      return [];
    }
  }

  private async getSessionOrThrow(sessionId: string): Promise<Session> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
