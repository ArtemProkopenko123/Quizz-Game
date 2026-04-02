export const REALTIME_ERROR_CODES = [
  'SESSION_NOT_FOUND',
  'PLAYER_NOT_FOUND',
  'RECONNECT_TOKEN_INVALID',
  'FORBIDDEN',
  'INVALID_PHASE',
  'ROUND_NOT_ACTIVE',
  'ANSWER_ALREADY_SUBMITTED',
  'ANSWER_DEADLINE_EXPIRED',
  'QUESTION_MISMATCH',
  'VALIDATION_ERROR',
] as const;

export type RealtimeErrorCode = (typeof REALTIME_ERROR_CODES)[number];

export interface RealtimeError {
  code: RealtimeErrorCode;
  message: string;
}
