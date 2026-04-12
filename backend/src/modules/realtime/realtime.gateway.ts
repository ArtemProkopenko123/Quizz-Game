import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../sessions/session.entity';
import { Player } from '../players/player.entity';
import { Round } from '../gameplay/round.entity';
import { Answer } from '../gameplay/answer.entity';
import { QuestionsService } from '../questions/questions.service';
import { SessionPhase } from '../../common/enums/session-phase.enum';
import { buildSessionSnapshot } from './session-snapshot.builder';
import type { RealtimeError } from './realtime.types';
import { ConnectToSessionDto } from './dto/connect-to-session.dto';
import { PlayerReadyDto } from './dto/player-ready.dto';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  /** socketId → playerId */
  private readonly socketToPlayer = new Map<string, string>();

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
  ) {}

  // ── session:connect ──────────────────────────────────────────

  @SubscribeMessage('session:connect')
  async handleConnect(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToSessionDto,
  ) {
    const { sessionId, playerId, reconnectToken } = payload;

    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) return this.error('SESSION_NOT_FOUND', 'Session not found');

    if (session.phase === SessionPhase.TERMINATED) {
      return this.error('INVALID_PHASE', 'Session is terminated');
    }

    const player = await this.playerRepo.findOneBy({ id: playerId, sessionId });
    if (!player) return this.error('PLAYER_NOT_FOUND', 'Player not found');

    if (player.reconnectToken !== reconnectToken) {
      return this.error('RECONNECT_TOKEN_INVALID', 'Invalid reconnect token');
    }

    // Bind socket to player
    this.socketToPlayer.set(socket.id, playerId);
    await socket.join(sessionId);

    player.isConnected = true;
    await this.playerRepo.save(player);

    const players = await this.playerRepo.findBy({ sessionId });
    const snapshot = buildSessionSnapshot(session, players, playerId);

    socket.emit('session:snapshot', snapshot);

    // Restore mid-game state for reconnecting player
    await this.emitMidGameState(socket, session, playerId);

    socket.to(sessionId).emit('lobby:updated', snapshot);

    this.logger.log(`Player ${player.name} connected to session ${session.code}`);
    return { ok: true };
  }

  // ── player:ready ──────────────────────────────────────────────

  @SubscribeMessage('player:ready')
  async handlePlayerReady(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: PlayerReadyDto,
  ) {
    const result = await this.setReadiness(socket, payload, true);
    return result;
  }

  @SubscribeMessage('player:not_ready')
  async handlePlayerNotReady(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: PlayerReadyDto,
  ) {
    const result = await this.setReadiness(socket, payload, false);
    return result;
  }

  // ── disconnect ────────────────────────────────────────────────

  async handleDisconnect(socket: Socket) {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) return;

    this.socketToPlayer.delete(socket.id);

    const player = await this.playerRepo.findOneBy({ id: playerId });
    if (!player) return;

    player.isConnected = false;
    await this.playerRepo.save(player);

    const session = await this.sessionRepo.findOneBy({ id: player.sessionId });
    if (!session || session.phase === SessionPhase.TERMINATED) return;

    this.server.to(player.sessionId).emit('player:presence_changed', {
      playerId: player.id,
      isConnected: false,
    });

    this.logger.log(`Player ${player.name} disconnected from session ${session.code}`);
  }

  // ── helpers ───────────────────────────────────────────────────

  private async setReadiness(
    socket: Socket,
    payload: PlayerReadyDto,
    ready: boolean,
  ) {
    const { sessionId, playerId } = payload;

    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) return this.error('SESSION_NOT_FOUND', 'Session not found');

    if (session.phase !== SessionPhase.LOBBY) {
      return this.error('INVALID_PHASE', 'Readiness can only be changed in lobby');
    }

    const player = await this.playerRepo.findOneBy({ id: playerId, sessionId });
    if (!player) return this.error('PLAYER_NOT_FOUND', 'Player not found');

    player.isReady = ready;
    await this.playerRepo.save(player);

    const players = await this.playerRepo.findBy({ sessionId });
    const snapshot = buildSessionSnapshot(session, players, playerId);

    this.server.to(sessionId).emit('lobby:updated', snapshot);
    return { ok: true };
  }

  private async emitMidGameState(
    socket: Socket,
    session: Session,
    playerId: string,
  ): Promise<void> {
    const { phase } = session;

    const isQuestion =
      phase === SessionPhase.QUESTION_OPEN ||
      phase === SessionPhase.QUESTION_CLOSED ||
      phase === SessionPhase.ROUND_RESULT;

    if (!isQuestion) return;

    // Find the round that corresponds to the current round index
    const round = await this.roundRepo.findOne({
      where: { sessionId: session.id, roundIndex: session.currentRoundIndex - (phase === SessionPhase.ROUND_RESULT ? 1 : 0) },
    });

    if (!round) return;

    let pack: ReturnType<QuestionsService['findPackById']>;
    try {
      pack = this.questionsService.findPackById(session.questionPackId);
    } catch {
      return;
    }

    const question = pack.questions.find((q) => q.id === round.questionId);
    if (!question) return;

    // Always emit question:started so the client has activeQuestion in store
    socket.emit('question:started', {
      roundIndex: round.roundIndex,
      totalRounds: pack.questions.length,
      questionId: round.questionId,
      prompt: question.prompt,
      options: question.options,
      deadlineAt: round.deadlineAt.toISOString(),
    });

    if (phase === SessionPhase.QUESTION_CLOSED) {
      socket.emit('question:closed', {});
      return;
    }

    if (phase === SessionPhase.ROUND_RESULT) {
      const [players, answers] = await Promise.all([
        this.playerRepo.findBy({ sessionId: session.id }),
        this.answerRepo.findBy({ roundId: round.id }),
      ]);

      const answerMap = new Map(answers.map((a) => [a.playerId, a.scoreDelta]));
      const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

      socket.emit('round:result', {
        questionId: round.questionId,
        correctAnswerIndex: question.correctAnswerIndex,
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
    }
  }

  private error(code: RealtimeError['code'], message: string): RealtimeError {
    return { code, message };
  }
}
