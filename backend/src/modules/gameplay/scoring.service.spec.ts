import { ScoringService } from './scoring.service';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  describe('calculateScore', () => {
    const ROUND_DURATION_MS = 20_000;

    it('should return 0 for a wrong answer', () => {
      const score = service.calculateScore({
        isCorrect: false,
        submittedAtMs: 5_000,
        deadlineAtMs: ROUND_DURATION_MS,
        roundStartMs: 0,
      });

      expect(score).toBe(0);
    });

    it('should return maximum points for an instant correct answer', () => {
      const score = service.calculateScore({
        isCorrect: true,
        submittedAtMs: 0,
        deadlineAtMs: ROUND_DURATION_MS,
        roundStartMs: 0,
      });

      expect(score).toBe(ScoringService.MAX_POINTS);
    });

    it('should return minimum points for a correct answer just before deadline', () => {
      const score = service.calculateScore({
        isCorrect: true,
        submittedAtMs: ROUND_DURATION_MS - 1,
        deadlineAtMs: ROUND_DURATION_MS,
        roundStartMs: 0,
      });

      expect(score).toBeGreaterThanOrEqual(ScoringService.MIN_POINTS);
      expect(score).toBeLessThan(ScoringService.MAX_POINTS);
    });

    it('should award more points for faster correct answers', () => {
      const fast = service.calculateScore({
        isCorrect: true,
        submittedAtMs: 2_000,
        deadlineAtMs: ROUND_DURATION_MS,
        roundStartMs: 0,
      });

      const slow = service.calculateScore({
        isCorrect: true,
        submittedAtMs: 15_000,
        deadlineAtMs: ROUND_DURATION_MS,
        roundStartMs: 0,
      });

      expect(fast).toBeGreaterThan(slow);
    });

    it('should never return less than MIN_POINTS for a correct answer', () => {
      const score = service.calculateScore({
        isCorrect: true,
        submittedAtMs: ROUND_DURATION_MS,
        deadlineAtMs: ROUND_DURATION_MS,
        roundStartMs: 0,
      });

      expect(score).toBeGreaterThanOrEqual(ScoringService.MIN_POINTS);
    });

    it('should return whole integer points', () => {
      const score = service.calculateScore({
        isCorrect: true,
        submittedAtMs: 7_500,
        deadlineAtMs: ROUND_DURATION_MS,
        roundStartMs: 0,
      });

      expect(Number.isInteger(score)).toBe(true);
    });
  });
});
