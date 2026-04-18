import { NextRequest, NextResponse } from "next/server";
import { eq, sql, and } from "drizzle-orm";
import { db, yachtModels, manufacturers, images, reviews, specValues } from "@/lib/db";
import { calculateCompletenessScore, shouldNoindex } from "@/lib/completeness";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const manufacturerSlug = url.searchParams.get("manufacturer");
    const minScore = parseInt(url.searchParams.get("minScore") || "0", 10);
    const maxScore = parseInt(url.searchParams.get("maxScore") || "100", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    // Build query
    let query = db
      .select({
        id: yachtModels.id,
        modelName: yachtModels.modelName,
        slug: yachtModels.slug,
        year: yachtModels.year,
        manufacturerName: manufacturers.name,
        manufacturerId: yachtModels.manufacturerId,
        lengthOverall: yachtModels.lengthOverall,
        beam: yachtModels.beam,
        draft: yachtModels.draft,
        displacement: yachtModels.displacement,
        ballast: yachtModels.ballast,
        sailAreaMain: yachtModels.sailAreaMain,
        rigType: yachtModels.rigType,
        keelType: yachtModels.keelType,
        hullMaterial: yachtModels.hullMaterial,
        cabins: yachtModels.cabins,
        berths: yachtModels.berths,
        heads: yachtModels.heads,
        engineHp: yachtModels.engineHp,
        engineType: yachtModels.engineType,
        fuelCapacity: yachtModels.fuelCapacity,
        waterCapacity: yachtModels.waterCapacity,
        description: yachtModels.description,
        designNotes: yachtModels.designNotes,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .limit(limit)
      .offset(offset);

    if (manufacturerSlug) {
      // Filter by manufacturer slug/name
      query = db
        .select({
          id: yachtModels.id,
          modelName: yachtModels.modelName,
          slug: yachtModels.slug,
          year: yachtModels.year,
          manufacturerName: manufacturers.name,
          manufacturerId: yachtModels.manufacturerId,
          lengthOverall: yachtModels.lengthOverall,
          beam: yachtModels.beam,
          draft: yachtModels.draft,
          displacement: yachtModels.displacement,
          ballast: yachtModels.ballast,
          sailAreaMain: yachtModels.sailAreaMain,
          rigType: yachtModels.rigType,
          keelType: yachtModels.keelType,
          hullMaterial: yachtModels.hullMaterial,
          cabins: yachtModels.cabins,
          berths: yachtModels.berths,
          heads: yachtModels.heads,
          engineHp: yachtModels.engineHp,
          engineType: yachtModels.engineType,
          fuelCapacity: yachtModels.fuelCapacity,
          waterCapacity: yachtModels.waterCapacity,
          description: yachtModels.description,
          designNotes: yachtModels.designNotes,
        })
        .from(yachtModels)
        .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
        .where(eq(manufacturers.name, manufacturerSlug))
        .limit(limit)
        .offset(offset);
    }

    const yachts = await query;

    // Calculate completeness for each yacht
    const scored = yachts.map((yacht: Record<string, unknown>) => {
      const score = calculateCompletenessScore(yacht);
      return {
        id: yacht.id,
        modelName: yacht.modelName,
        slug: yacht.slug,
        year: yacht.year,
        manufacturerName: yacht.manufacturerName,
        lengthOverall: yacht.lengthOverall,
        completenessScore: score,
        noindex: shouldNoindex(score),
      };
    });

    // Filter by score range
    const filtered = scored.filter((y: { completenessScore: number }) =>
      y.completenessScore >= minScore && y.completenessScore <= maxScore
    );

    // Calculate aggregate stats
    const allScores: number[] = scored.map((y: { completenessScore: number }) => y.completenessScore);
    const avgScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    // Score distribution
    const distribution = {
      comprehensive: allScores.filter((s) => s >= 80).length,
      good: allScores.filter((s) => s >= 60 && s < 80).length,
      partial: allScores.filter((s) => s >= 40 && s < 60).length,
      basic: allScores.filter((s) => s >= 20 && s < 40).length,
      minimal: allScores.filter((s) => s < 20).length,
    };

    return NextResponse.json({
      total: scored.length,
      averageScore: avgScore,
      distribution,
      yachts: filtered,
    });
  } catch (error) {
    console.error("[completeness] Error:", error);
    return NextResponse.json({ error: "Failed to calculate completeness" }, { status: 500 });
  }
}
