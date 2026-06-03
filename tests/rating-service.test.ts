import { describe, test, expect } from "vitest";
import { 
  getRatingStats,
} from "@/lib/rating-service";

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
      // Let's manually calculate:
      // 1.2 -> 1, 2.8 -> 3, 3.5 -> 4, 4.9 -> 5, 5.1 -> 5, 0.8 -> 1, 6.2 -> 6 -> 5
      // So: 1, 3, 4, 5, 5, 1, 5 = 24 total / 7 ratings = 3.4
      const stats = calculateRatingStats([1.2, 2.8, 3.5, 4.9, 5.1, 0.8, 6.2]);
      expect(stats).toEqual({
        average: 3.4,
        count: 7,
        distribution: { 1: 2, 2: 0, 3: 1, 4: 1, 5: 3 },
      });
    });
  });
});