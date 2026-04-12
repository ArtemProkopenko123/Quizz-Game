export const SESSION_PHASES = [
  'lobby',
  'countdown',
  'question_open',
  'question_closed',
  'round_result',
  'game_result',
  'terminated',
] as const;

export type SessionPhase = (typeof SESSION_PHASES)[number];

export interface PlayerSnapshot {
  playerId: string;
  name: string;
  color: string;
  avatarUrl: string | null;
  isConnected: boolean;
  isReady: boolean;
  score: number;
}

export interface RoundSnapshot {
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
  currentRound: RoundSnapshot | null;
}

/** Credentials returned by REST and persisted in sessionStorage */
export interface SessionCredentials {
  sessionId: string;
  code: string;
  playerId: string;
  reconnectToken: string;
}

// ── Server → Client event payloads ───────────────────────────────

export interface CountdownStartedPayload {
  deadlineAt: string;
}

export interface QuestionStartedPayload {
  questionId: string;
  prompt: string;
  options: string[];
  roundIndex: number;
  totalRounds: number;
  deadlineAt: string;
}

export interface AnswerAcceptedPayload {
  scoreDelta: number;
}

export interface AnswerRejectedPayload {
  code: string;
  message: string;
}

export interface RoundScore {
  playerId: string;
  roundScore: number;
  totalScore: number;
}

export interface RoundResultPayload {
  questionId: string;
  correctAnswerIndex: number;
  scores: RoundScore[];
  leaderboard: Array<{ playerId: string; name: string; score: number }>;
}

export interface GameResultEntry {
  rank: number;
  playerId: string;
  name: string;
  score: number;
}

export interface GameResultPayload {
  sessionId: string;
  leaderboard: GameResultEntry[];
}

export interface AllAnsweredPayload {
  newDeadlineAt: string;
}

export interface PresenceChangedPayload {
  playerId: string;
  isConnected: boolean;
}
