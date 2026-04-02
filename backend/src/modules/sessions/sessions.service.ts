import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Session } from './session.entity';
import { Player } from '../players/player.entity';
import { SessionPhase } from '../../common/enums/session-phase.enum';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';

const JOIN_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0 or I/1 confusion
const JOIN_CODE_LENGTH = 6;
const MAX_CODE_RETRIES = 10;

export interface SessionCredentials {
  sessionId: string;
  code: string;
  playerId: string;
  reconnectToken: string;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,

    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
  ) {}

  async createSession(dto: CreateSessionDto): Promise<SessionCredentials> {
    const code = await this.generateJoinCode();

    const session = this.sessionRepo.create({
      code,
      phase: SessionPhase.LOBBY,
      questionPackId: dto.questionPackId,
      hostPlayerId: null,
    });
    await this.sessionRepo.save(session);

    const player = this.playerRepo.create({
      name: dto.hostName,
      color: dto.hostColor,
      sessionId: session.id,
      reconnectToken: randomUUID(),
      avatarUrl: null,
    });
    await this.playerRepo.save(player);

    session.hostPlayerId = player.id;
    await this.sessionRepo.save(session);

    return {
      sessionId: session.id,
      code: session.code,
      playerId: player.id,
      reconnectToken: player.reconnectToken,
    };
  }

  async joinSession(code: string, dto: JoinSessionDto): Promise<SessionCredentials> {
    const session = await this.sessionRepo.findOneBy({ code: code.toUpperCase() });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.phase !== SessionPhase.LOBBY) {
      throw new BadRequestException('Session is no longer accepting players');
    }

    const player = this.playerRepo.create({
      name: dto.playerName,
      color: dto.playerColor,
      sessionId: session.id,
      reconnectToken: randomUUID(),
      avatarUrl: null,
    });
    await this.playerRepo.save(player);

    return {
      sessionId: session.id,
      code: session.code,
      playerId: player.id,
      reconnectToken: player.reconnectToken,
    };
  }

  async generateJoinCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      const code = Array.from(
        { length: JOIN_CODE_LENGTH },
        () => JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)],
      ).join('');

      const existing = await this.sessionRepo.findOneBy({ code });
      if (!existing) return code;
    }

    throw new ConflictException('Failed to generate unique join code, please retry');
  }
}
