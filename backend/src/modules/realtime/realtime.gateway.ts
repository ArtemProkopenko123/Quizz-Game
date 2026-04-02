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

  private error(code: RealtimeError['code'], message: string): RealtimeError {
    return { code, message };
  }
}
