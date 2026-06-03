import { db } from "@/lib/db";
import { yachtRatings } from "@/drizzle/schema";
import { eq, and, isNotNull, isNull, sql as drizzleSql } from "drizzle-orm";

/**
 * Get aggregated rating stats for a yacht.
 */
export async function getRatingStats(yachtModelId: number): Promise<{
  average: number;
  count: number;
  distribution: Record<number, number>;
}> {
  const rows = await db
    .select({
      score: yachtRatings.score,
      count: drizzleSql<number>`count(*)::int`,
    })
    .from(yachtRatings)
    .where(eq(yachtRatings.yachtModelId, yachtModelId))
    .groupBy(yachtRatings.score);

  let totalCount = 0;
  let totalScore = 0;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const row of rows) {
    totalCount += row.count;
    totalScore += row.score * row.count;
    distribution[row.score] = row.count;
  }

  return {
    average: totalCount > 0 ? Math.round((totalScore / totalCount) * 10) / 10 : 0,
    count: totalCount,
    distribution,
  };
}

/**
 * Get a user's existing rating for a yacht.
 */
export async function getUserRating(
  yachtModelId: number,
  userId?: number | null,
  ipAddress?: string | null,
): Promise<number | null> {
  if (userId) {
    const rows = await db
      .select({ score: yachtRatings.score })
      .from(yachtRatings)
      .where(
        and(
          eq(yachtRatings.yachtModelId, yachtModelId),
          eq(yachtRatings.userId, userId),
        ),
      )
      .limit(1);
    return rows.length > 0 ? rows[0].score : null;
  }

  if (ipAddress) {
    const rows = await db
      .select({ score: yachtRatings.score })
      .from(yachtRatings)
      .where(
        and(
          eq(yachtRatings.yachtModelId, yachtModelId),
          eq(yachtRatings.ipAddress, ipAddress),
          isNull(yachtRatings.userId),
        ),
      )
      .limit(1);
    return rows.length > 0 ? rows[0].score : null;
  }

  return null;
}

/**
 * Submit or update a rating for a yacht. Returns the updated stats.
 */
export async function submitRating(
  yachtModelId: number,
  score: number,
  userId?: number | null,
  ipAddress?: string | null,
): Promise<{ average: number; count: number; distribution: Record<number, number> }> {
  // Clamp score to 1-5
  const clampedScore = Math.max(1, Math.min(5, Math.round(score)));

  // Check for existing rating
  const existing = await getUserRating(yachtModelId, userId, ipAddress);

  if (existing !== null) {
    // Update existing rating
    if (userId) {
      await db
        .update(yachtRatings)
        .set({ score: clampedScore })
        .where(
          and(
            eq(yachtRatings.yachtModelId, yachtModelId),
            eq(yachtRatings.userId, userId),
          ),
        );
    } else if (ipAddress) {
      await db
        .update(yachtRatings)
        .set({ score: clampedScore })
        .where(
          and(
            eq(yachtRatings.yachtModelId, yachtModelId),
            eq(yachtRatings.ipAddress, ipAddress),
            isNull(yachtRatings.userId),
          ),
        );
    }
  } else {
    // Insert new rating
    await db.insert(yachtRatings).values({
      yachtModelId,
      userId: userId ?? null,
      score: clampedScore,
      ipAddress: ipAddress ?? null,
    });
  }

  return getRatingStats(yachtModelId);
}
