import { SessionPhase } from '../../common/enums/session-phase.enum';

// ── Client → Server ──────────────────────────────────────────────

export interface ConnectToSessionPayload {
  sessionId: string;
  playerId: string;
  reconnectToken: string;
}

export interface PlayerReadyPayload {
  sessionId: string;
  playerId: string;
}

export interface GameStartPayload {
  sessionId: string;
  playerId: string;
}

export interface AnswerSubmitPayload {
  sessionId: string;
  playerId: string;
  questionId: string;
  answerIndex: number;
}

// ── Server → Client ──────────────────────────────────────────────

export interface PlayerSnapshot {
  playerId: string;
  name: string;
  color: string;
  avatarUrl: string | null;
  isConnected: boolean;
  isReady: boolean;
  score: number;
}

export interface CurrentRoundSnapshot {
  index: number;
  total: number;
  deadlineAt: string | null;
  questionId: string | null;
  hasAnswered: boolean;
}

export interface SessionSnapshot {
  sessionId: string;
  code: string;
  phase: SessionPhase;
  hostPlayerId: string | null;
  selfPlayerId: string;
  players: PlayerSnapshot[];
  currentRound: CurrentRoundSnapshot | null;
}

export interface RealtimeError {
  code:
    | 'SESSION_NOT_FOUND'
    | 'PLAYER_NOT_FOUND'
    | 'RECONNECT_TOKEN_INVALID'
    | 'FORBIDDEN'
    | 'INVALID_PHASE'
    | 'ROUND_NOT_ACTIVE'
    | 'ANSWER_ALREADY_SUBMITTED'
    | 'ANSWER_DEADLINE_EXPIRED'
    | 'QUESTION_MISMATCH'
    | 'VALIDATION_ERROR';
  message: string;
}
