import { Injectable } from '@nestjs/common';

interface ScoreInput {
  isCorrect: boolean;
  submittedAtMs: number;
  deadlineAtMs: number;
  roundStartMs: number;
}

@Injectable()
export class ScoringService {
  static readonly MAX_POINTS = 1000;
  static readonly MIN_POINTS = 100;

  /**
   * Time-based scoring: correct answers earn between MIN_POINTS and MAX_POINTS
   * depending on how quickly they were submitted within the round window.
   * Wrong answers always earn 0.
   */
  calculateScore(input: ScoreInput): number {
    if (!input.isCorrect) return 0;

    const windowMs = input.deadlineAtMs - input.roundStartMs;
    const elapsedMs = input.submittedAtMs - input.roundStartMs;

    const ratio = windowMs > 0 ? Math.max(0, Math.min(1, elapsedMs / windowMs)) : 1;

    const range = ScoringService.MAX_POINTS - ScoringService.MIN_POINTS;
    const points = ScoringService.MAX_POINTS - Math.floor(range * ratio);

    return Math.max(ScoringService.MIN_POINTS, points);
  }
}
