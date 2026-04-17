import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq, desc } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db, userFavorites, yachtModels, manufacturers, images, savedComparisons } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ScoredRecommendation {
  id: number;
  manufacturer: string | null;
  modelName: string;
  slug: string | null;
  year: number;
  lengthOverall: string | null;
  beam: string | null;
  displacement: string | null;
  rigType: string | null;
  score: number;
  primaryImage: string | null;
  reason: string;
}

/**
 * Weighted similarity score based on dimensional specs.
 * Reuses the same algorithm as /api/yachts/[slug]/similar.
 */
function computeSimilarity(
  source: { lengthOverall: string | null; beam: string | null; draft: string | null; displacement: string | null; sailAreaMain: string | null },
  candidate: { lengthOverall: string | null; beam: string | null; draft: string | null; displacement: string | null; sailAreaMain: string | null },
): number {
  type DimKey = "lengthOverall" | "beam" | "draft" | "displacement" | "sailAreaMain";
  const dims: Array<{ key: DimKey; weight: number }> = [
    { key: "lengthOverall", weight: 0.30 },
    { key: "displacement", weight: 0.25 },
    { key: "beam", weight: 0.20 },
    { key: "draft", weight: 0.15 },
    { key: "sailAreaMain", weight: 0.10 },
  ];

  let totalWeight = 0;
  let weightedDist = 0;

  for (const dim of dims) {
    const sv = source[dim.key] !== null ? parseFloat(source[dim.key]!) : null;
    const cv = candidate[dim.key] !== null ? parseFloat(candidate[dim.key]!) : null;
    if (sv === null || cv === null || sv === 0) continue;
    weightedDist += dim.weight * (Math.abs(sv - cv) / sv);
    totalWeight += dim.weight;
  }

  if (totalWeight === 0) return 0;
  return Math.max(0, 1 - weightedDist / totalWeight);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = Number(session.user.id);

    // Fetch user's favorites with full spec data
    const favorites = await db
      .select({
        id: yachtModels.id,
        modelName: yachtModels.modelName,
        manufacturer: manufacturers.name,
        lengthOverall: yachtModels.lengthOverall,
        beam: yachtModels.beam,
        draft: yachtModels.draft,
        displacement: yachtModels.displacement,
        sailAreaMain: yachtModels.sailAreaMain,
      })
      .from(userFavorites)
      .innerJoin(yachtModels, eq(userFavorites.yachtModelId, yachtModels.id))
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(eq(userFavorites.userId, userId));

    // Fetch user's saved comparisons for "compare again"
    const comparisons = await db
      .select({
        id: savedComparisons.id,
        name: savedComparisons.name,
        yachtIds: savedComparisons.yachtIds,
        createdAt: savedComparisons.createdAt,
      })
      .from(savedComparisons)
      .where(eq(savedComparisons.userId, userId))
      .orderBy(desc(savedComparisons.updatedAt))
      .limit(5);

    // Fetch recently added yachts
    const recentYachts = await db
      .select({
        id: yachtModels.id,
        modelName: yachtModels.modelName,
        slug: yachtModels.slug,
        year: yachtModels.year,
        lengthOverall: yachtModels.lengthOverall,
        beam: yachtModels.beam,
        displacement: yachtModels.displacement,
        rigType: yachtModels.rigType,
        manufacturer: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .orderBy(desc(yachtModels.createdAt))
      .limit(20);

    const favoriteIds = new Set<number>(favorites.map((f: { id: number }) => f.id));

    // Filter out already-favorited yachts from recent
    type RecentYacht = typeof recentYachts[number];
    const newSinceVisit: Array<RecentYacht & { reason: "new" }> = [];
    for (const y of recentYachts) {
      if (!favoriteIds.has(y.id)) {
        newSinceVisit.push({ ...y, reason: "new" });
      }
      if (newSinceVisit.length >= 6) break;
    }

    // Compute "similar to favorites" recommendations
    const similarToFavoriteList: ScoredRecommendation[] = [];

    if (favorites.length > 0) {
      // Fetch all candidate yachts (exclude favorites)
      const allYachts = await db
        .select({
          id: yachtModels.id,
          modelName: yachtModels.modelName,
          slug: yachtModels.slug,
          year: yachtModels.year,
          lengthOverall: yachtModels.lengthOverall,
          beam: yachtModels.beam,
          draft: yachtModels.draft,
          displacement: yachtModels.displacement,
          sailAreaMain: yachtModels.sailAreaMain,
          rigType: yachtModels.rigType,
          manufacturer: manufacturers.name,
        })
        .from(yachtModels)
        .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id));

      // Filter out favorites
      const candidates = allYachts.filter((y: { id: number }) => !favoriteIds.has(y.id));

      // Score each candidate against all favorites, keep best score
      for (const candidate of candidates) {
        let bestScore = 0;
        let bestReason = "";

        for (const fav of favorites) {
          const score = computeSimilarity(fav, candidate);
          if (score > bestScore) {
            bestScore = score;
            bestReason = `Similar to ${fav.manufacturer || ""} ${fav.modelName}`.trim();
          }
        }

        if (bestScore > 0.3) {
          similarToFavoriteList.push({
            id: candidate.id,
            manufacturer: candidate.manufacturer,
            modelName: candidate.modelName,
            slug: candidate.slug,
            year: candidate.year,
            lengthOverall: candidate.lengthOverall,
            beam: candidate.beam,
            displacement: candidate.displacement,
            rigType: candidate.rigType,
            score: bestScore,
            primaryImage: null,
            reason: bestReason,
          });
        }
      }

      // Sort by score, take top 6
      similarToFavoriteList.sort((a: ScoredRecommendation, b: ScoredRecommendation) => b.score - a.score);
      similarToFavoriteList.splice(6); // keep only top 6

      // Fetch primary images for top recommendations
      for (const yacht of similarToFavoriteList) {
        try {
          const yachtImages = await db
            .select({ url: images.url })
            .from(images)
            .where(eq(images.yachtModelId, yacht.id))
            .limit(1);
          yacht.primaryImage = yachtImages.length > 0 ? yachtImages[0].url : null;
        } catch {
          yacht.primaryImage = null;
        }
      }
    }

    // Fetch primary images for new since visit
    type NewWithImage = RecentYacht & { reason: "new"; primaryImage: string | null };
    const newSinceVisitWithImages: NewWithImage[] = [];
    for (const y of newSinceVisit) {
      let primaryImage: string | null = null;
      try {
        const yachtImages = await db
          .select({ url: images.url })
          .from(images)
          .where(eq(images.yachtModelId, y.id))
          .limit(1);
        primaryImage = yachtImages.length > 0 ? yachtImages[0].url : null;
      } catch { /* no image */ }

      newSinceVisitWithImages.push({
        ...y,
        primaryImage,
      });
    }

    type ComparisonRow = typeof comparisons[number];
    return NextResponse.json({
      similarToFavorites: similarToFavoriteList,
      newSinceVisit: newSinceVisitWithImages,
      compareAgain: comparisons.map((c: ComparisonRow) => ({
        id: c.id,
        name: c.name,
        yachtIds: c.yachtIds,
        createdAt: c.createdAt,
      })),
      favoritesCount: favorites.length,
    });
  } catch (error) {
    console.error("[recommendations] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 },
    );
  }
}
