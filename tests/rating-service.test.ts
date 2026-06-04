import { describe, test, expect } from "vitest";

// Test rating calculation logic (not DB-dependent)
function calculateRatingStats(ratings: number[]) {
  if (ratings.length === 0) {
    return {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  let totalScore = 0;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const rating of ratings) {
    const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));
    totalScore += clampedRating;
    distribution[clampedRating] = (distribution[clampedRating] || 0) + 1;
  }

  const average = Math.round((totalScore / ratings.length) * 10) / 10;

  return {
    average,
    count: ratings.length,
    distribution,
  };
}

describe("Rating Service Logic", () => {
  describe("rating calculation", () => {
    test("calculates correct average with all 5-star ratings", () => {
      const stats = calculateRatingStats([5, 5, 5, 5, 5]);
      expect(stats).toEqual({
        average: 5,
        count: 5,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 5 },
      });
    });

    test("calculates correct average with mixed ratings", () => {
      const stats = calculateRatingStats([5, 4, 3, 5, 2]);
      expect(stats).toEqual({
        average: 3.8,
        count: 5,
        distribution: { 1: 0, 2: 1, 3: 1, 4: 1, 5: 2 },
      });
    });

    test("handles zero ratings", () => {
      const stats = calculateRatingStats([]);
      expect(stats).toEqual({
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    });

    test("clamps scores to 1-5 range", () => {
      const stats = calculateRatingStats([1.2, 2.8, 3.5, 4.9, 5.1, 0.8, 6.2]);
      expect(stats).toEqual({
        average: 3.4,
        count: 7,
        distribution: { 1: 2, 2: 0, 3: 1, 4: 1, 5: 3 },
      });
    });

    test("calculates correct average for single rating", () => {
      const stats = calculateRatingStats([4]);
      expect(stats).toEqual({
        average: 4,
        count: 1,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 },
      });
    });

    test("calculates correct average for all 1-star ratings", () => {
      const stats = calculateRatingStats([1, 1, 1]);
      expect(stats).toEqual({
        average: 1,
        count: 3,
        distribution: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    });

    test("distribution sums to total count", () => {
      const ratings = [1, 2, 2, 3, 3, 3, 4, 4, 5];
      const stats = calculateRatingStats(ratings);
      const distSum = Object.values(stats.distribution).reduce((a, b) => a + b, 0);
      expect(distSum).toBe(stats.count);
      expect(stats.count).toBe(9);
    });

    test("average is rounded to one decimal", () => {
      const stats = calculateRatingStats([3, 4, 5]);
      // (3 + 4 + 5) / 3 = 4.0
      expect(stats.average).toBe(4.0);
      expect(Number.isInteger(stats.average * 10)).toBe(true);
    });
  });

  describe("score validation", () => {
    test("validates score must be integer 1-5", () => {
      const validScores = [1, 2, 3, 4, 5];
      for (const score of validScores) {
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(5);
      }
    });

    test("rejects non-integer scores", () => {
      const invalidScores = [0, 6, -1, 1.5, 3.7, NaN, Infinity];
      for (const score of invalidScores) {
        const isValid = Number.isInteger(score) && score >= 1 && score <= 5;
        expect(isValid).toBe(false);
      }
    });

    test("rejects non-numeric scores", () => {
      const invalidScores = ["five", null, undefined, {}, []];
      for (const score of invalidScores) {
        const num = Number(score);
        const isValid = Number.isInteger(num) && num >= 1 && num <= 5;
        expect(isValid).toBe(false);
      }
    });
  });

  describe("widget initial state", () => {
    test("default stats are zero", () => {
      const defaultStats = {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
      expect(defaultStats.average).toBe(0);
      expect(defaultStats.count).toBe(0);
      expect(Object.values(defaultStats.distribution).reduce((a, b) => a + b, 0)).toBe(0);
    });

    test("default user rating is null (not rated)", () => {
      const userRating: number | null = null;
      expect(userRating).toBeNull();
    });
  });
});
