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

export interface CategoryVotePayload {
  sessionId: string;
  playerId: string;
  packId: string;
}

export interface UpdateSettingsPayload {
  sessionId: string;
  playerId: string;
  roundCount?: number;
  questionsPerRound?: number;
  questionDuration?: number;
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

export interface SessionSettings {
  roundCount: number;
  questionsPerRound: number;
  questionDuration: number;
}

export interface PackOption {
  id: string;
  title: string;
  emoji: string;
  questionCount: number;
}

export interface SessionSnapshot {
  sessionId: string;
  code: string;
  phase: SessionPhase;
  hostPlayerId: string | null;
  selfPlayerId: string;
  players: PlayerSnapshot[];
  currentRound: CurrentRoundSnapshot | null;
  settings: SessionSettings;
  /** Current stage progress, present during CATEGORY_VOTE and game phases */
  stageIndex: number;
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

// ── New event payloads ───────────────────────────────────────────

export interface CategoryVoteStartedPayload {
  deadlineAt: string;
  availablePacks: PackOption[];
  stageIndex: number;
  totalStages: number;
}

export interface CategoryVoteUpdatedPayload {
  /** playerId → packId */
  votes: Record<string, string>;
}

export interface CategorySelectedPayload {
  packId: string;
  packTitle: string;
  packEmoji: string;
  /** When the game countdown will start */
  countdownDeadlineAt: string;
}

export interface SessionSettingsUpdatedPayload extends SessionSettings {}
