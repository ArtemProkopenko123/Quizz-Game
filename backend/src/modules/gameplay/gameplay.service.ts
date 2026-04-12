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

const ROUND_DURATION_MS = 20_000;
const COUNTDOWN_MS = 3_000;
const ALL_ANSWERED_DELAY_MS = 5_000;

export interface AnswerResult {
  accepted: boolean;
  scoreDelta: number;
  error?: string;
}

@Injectable()
export class GameplayService {
  /** sessionId → active round close timer */
  private readonly roundTimers = new Map<string, ReturnType<typeof setTimeout>>();

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

  async startGame(sessionId: string, requestingPlayerId: string): Promise<void> {
    const session = await this.getSessionOrThrow(sessionId);

    if (session.hostPlayerId !== requestingPlayerId) {
      throw new ForbiddenException('Only the host can start the game');
    }
    if (session.phase !== SessionPhase.LOBBY) {
      throw new BadRequestException('Game can only be started from lobby');
    }

    session.phase = SessionPhase.COUNTDOWN;
    await this.sessionRepo.save(session);

    this.emitter.emitToSession(sessionId, 'game:countdown_started', {
      deadlineAt: new Date(Date.now() + COUNTDOWN_MS).toISOString(),
    });

    setTimeout(() => {
      void this.openNextRound(sessionId);
    }, COUNTDOWN_MS);
  }

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
      // Only update the chosen option — score is locked at first-submission time
      existing.answerIndex = answerIndex;
      existing.isCorrect   = isCorrect;
      await this.answerRepo.save(existing);
      // player.score already reflects the first submission; no adjustment needed
      return { accepted: true, scoreDelta: existing.scoreDelta };
    }

    await this.answerRepo.save(
      this.answerRepo.create({ roundId: round.id, playerId, answerIndex, isCorrect, scoreDelta }),
    );

    if (isCorrect) {
      await this.playerRepo.increment({ id: playerId }, 'score', scoreDelta);
    }

    // Check if all connected players have now answered
    await this.checkAllAnswered(sessionId, round.id);

    return { accepted: true, scoreDelta };
  }

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
    const pack = this.questionsService.findPackById(session.questionPackId);

    if (session.currentRoundIndex >= pack.questions.length) {
      await this.finishGame(session);
      return;
    }

    const question = pack.questions[session.currentRoundIndex];
    if (!question) {
      await this.finishGame(session);
      return;
    }

    const deadlineAt = new Date(Date.now() + ROUND_DURATION_MS);

    const round = this.roundRepo.create({
      sessionId,
      roundIndex: session.currentRoundIndex,
      questionId: question.id,
      deadlineAt,
    });
    await this.roundRepo.save(round);

    session.phase = SessionPhase.QUESTION_OPEN;
    await this.sessionRepo.save(session);

    this.emitter.emitToSession(sessionId, 'question:started', {
      roundIndex: session.currentRoundIndex,
      totalRounds: pack.questions.length,
      questionId: question.id,
      prompt: question.prompt,
      options: question.options,
      deadlineAt: deadlineAt.toISOString(),
    });

    this.scheduleCloseRound(sessionId, round.id, ROUND_DURATION_MS);
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
    }, 5_000);
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

  private async getSessionOrThrow(sessionId: string): Promise<Session> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
