import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SessionsService } from './sessions.service';
import { Session } from './session.entity';
import { Player } from '../players/player.entity';
import { SessionPhase } from '../../common/enums/session-phase.enum';

const makeSession = (overrides: Partial<Session> = {}): Session =>
  ({
    id: 'session-uuid',
    code: 'ABC123',
    phase: SessionPhase.LOBBY,
    hostPlayerId: 'host-player-uuid',
    questionPackId: 'mvp-general-knowledge',
    currentRoundIndex: 0,
    players: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Session;

const makePlayer = (overrides: Partial<Player> = {}): Player =>
  ({
    id: 'host-player-uuid',
    name: 'Alice',
    color: '#FF0000',
    avatarUrl: null,
    sessionId: 'session-uuid',
    reconnectToken: 'reconnect-token-uuid',
    isConnected: false,
    isReady: false,
    score: 0,
    createdAt: new Date(),
    ...overrides,
  }) as Player;

describe('SessionsService', () => {
  let service: SessionsService;
  let sessionRepo: jest.Mocked<Repository<Session>>;
  let playerRepo: jest.Mocked<Repository<Player>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Player),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SessionsService);
    sessionRepo = module.get(getRepositoryToken(Session));
    playerRepo = module.get(getRepositoryToken(Player));
  });

  describe('createSession', () => {
    it('should create a session in LOBBY phase', async () => {
      const session = makeSession();
      const player = makePlayer();

      sessionRepo.findOneBy.mockResolvedValue(null); // no code collision
      sessionRepo.create.mockReturnValue(session);
      sessionRepo.save.mockResolvedValue(session);
      playerRepo.create.mockReturnValue(player);
      playerRepo.save.mockResolvedValue(player);

      const result = await service.createSession({
        hostName: 'Alice',
        hostColor: '#FF0000',
        questionPackId: 'mvp-general-knowledge',
      });

      expect(result.sessionId).toBe(session.id);
      expect(result.code).toBe(session.code);
      expect(result.playerId).toBe(player.id);
      expect(result.reconnectToken).toBe(player.reconnectToken);
    });

    it('should persist the session with LOBBY phase', async () => {
      const session = makeSession();
      const player = makePlayer();

      sessionRepo.findOneBy.mockResolvedValue(null);
      sessionRepo.create.mockReturnValue(session);
      sessionRepo.save.mockResolvedValue(session);
      playerRepo.create.mockReturnValue(player);
      playerRepo.save.mockResolvedValue(player);

      await service.createSession({
        hostName: 'Alice',
        hostColor: '#FF0000',
        questionPackId: 'mvp-general-knowledge',
      });

      expect(sessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ phase: SessionPhase.LOBBY }),
      );
    });

    it('should set hostPlayerId after creating the host player', async () => {
      const session = makeSession({ hostPlayerId: null });
      const savedSession = makeSession();
      const player = makePlayer();

      sessionRepo.findOneBy.mockResolvedValue(null);
      sessionRepo.create.mockReturnValue(session);
      sessionRepo.save
        .mockResolvedValueOnce(session)   // first save: session without host
        .mockResolvedValueOnce(savedSession); // second save: session with hostPlayerId
      playerRepo.create.mockReturnValue(player);
      playerRepo.save.mockResolvedValue(player);

      await service.createSession({
        hostName: 'Alice',
        hostColor: '#FF0000',
        questionPackId: 'mvp-general-knowledge',
      });

      expect(sessionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ hostPlayerId: player.id }),
      );
    });
  });

  describe('joinSession', () => {
    it('should add a player and return credentials', async () => {
      const session = makeSession();
      const newPlayer = makePlayer({ id: 'new-player-uuid', name: 'Bob' });

      sessionRepo.findOneBy.mockResolvedValue(session);
      playerRepo.create.mockReturnValue(newPlayer);
      playerRepo.save.mockResolvedValue(newPlayer);

      const result = await service.joinSession('ABC123', {
        playerName: 'Bob',
        playerColor: '#00FF00',
      });

      expect(result.sessionId).toBe(session.id);
      expect(result.playerId).toBe(newPlayer.id);
      expect(result.reconnectToken).toBe(newPlayer.reconnectToken);
    });

    it('should throw NotFoundException when code does not exist', async () => {
      sessionRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.joinSession('ZZZZZZ', { playerName: 'Bob', playerColor: '#00FF00' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when session is not in LOBBY phase', async () => {
      const activeSession = makeSession({ phase: SessionPhase.QUESTION_OPEN });
      sessionRepo.findOneBy.mockResolvedValue(activeSession);

      await expect(
        service.joinSession('ABC123', { playerName: 'Bob', playerColor: '#00FF00' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateJoinCode', () => {
    it('should return a 6-character uppercase alphanumeric code', async () => {
      sessionRepo.findOneBy.mockResolvedValue(null);

      const code = await service.generateJoinCode();

      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should retry and return a different code on collision', async () => {
      sessionRepo.findOneBy
        .mockResolvedValueOnce(makeSession()) // first code collides
        .mockResolvedValueOnce(null);          // second code is free

      const code = await service.generateJoinCode();

      expect(code).toMatch(/^[A-Z0-9]{6}$/);
      expect(sessionRepo.findOneBy).toHaveBeenCalledTimes(2);
    });

    it('should throw ConflictException after too many collisions', async () => {
      sessionRepo.findOneBy.mockResolvedValue(makeSession()); // always collides

      await expect(service.generateJoinCode()).rejects.toThrow(ConflictException);
    });
  });
});
