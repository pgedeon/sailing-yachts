import { NextResponse } from "next/server";
import { db, yachtModels, manufacturers, images } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { rankSimilarYachts, type YachtForSimilarity } from "@/lib/similarity-score";

export const dynamic = "force-dynamic";

export async function GET(request: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  try {
    const { slug } = params;

    // Fetch source yacht
    const sourceResult = await db
      .select({
        id: yachtModels.id,
        manufacturer: manufacturers.name,
        modelName: yachtModels.modelName,
        slug: yachtModels.slug,
        year: yachtModels.year,
        lengthOverall: yachtModels.lengthOverall,
        beam: yachtModels.beam,
        draft: yachtModels.draft,
        displacement: yachtModels.displacement,
        ballast: yachtModels.ballast,
        sailAreaMain: yachtModels.sailAreaMain,
        hullMaterial: yachtModels.hullMaterial,
        rigType: yachtModels.rigType,
        keelType: yachtModels.keelType,
        cabins: yachtModels.cabins,
        berths: yachtModels.berths,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(eq(yachtModels.slug, slug))
      .limit(1);

    if (sourceResult.length === 0) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
    }

    const source = sourceResult[0] as YachtForSimilarity;

    // Fetch all candidate yachts
    const candidatesRaw = await db
      .select({
        id: yachtModels.id,
        manufacturer: manufacturers.name,
        modelName: yachtModels.modelName,
        slug: yachtModels.slug,
        year: yachtModels.year,
        lengthOverall: yachtModels.lengthOverall,
        beam: yachtModels.beam,
        draft: yachtModels.draft,
        displacement: yachtModels.displacement,
        ballast: yachtModels.ballast,
        sailAreaMain: yachtModels.sailAreaMain,
        hullMaterial: yachtModels.hullMaterial,
        rigType: yachtModels.rigType,
        keelType: yachtModels.keelType,
        cabins: yachtModels.cabins,
        berths: yachtModels.berths,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id));

    const candidates = candidatesRaw as YachtForSimilarity[];

    // Compute similarity using new weighted algorithm
    const ranked = rankSimilarYachts(source, candidates);

    // P27.1: Batch-fetch all images for ranked yachts instead of N+1 queries
    const rankedIds = ranked.map((entry) => entry.yacht.id);
    const imageMap = new Map<number, string | null>();

    if (rankedIds.length > 0) {
      const imageRows = await db
        .select({
          yachtModelId: images.yachtModelId,
          url: images.url,
          isPrimary: images.isPrimary,
          sortOrder: images.sortOrder,
        })
        .from(images)
        .where(inArray(images.yachtModelId, rankedIds))
        .orderBy(images.yachtModelId, images.sortOrder);

      for (const row of imageRows) {
        if (!imageMap.has(row.yachtModelId)) {
          imageMap.set(row.yachtModelId, row.url);
        }
        if (row.isPrimary) {
          imageMap.set(row.yachtModelId, row.url);
        }
      }
    }

    const similar = ranked.map((entry) => ({
      id: entry.yacht.id,
      manufacturer: entry.yacht.manufacturer,
      modelName: entry.yacht.modelName,
      slug: entry.yacht.slug,
      year: entry.yacht.year,
      lengthOverall: entry.yacht.lengthOverall,
      beam: entry.yacht.beam,
      draft: entry.yacht.draft,
      displacement: entry.yacht.displacement,
      sailAreaMain: entry.yacht.sailAreaMain,
      rigType: entry.yacht.rigType,
      keelType: entry.yacht.keelType,
      hullMaterial: entry.yacht.hullMaterial,
      cabins: entry.yacht.cabins,
      berths: entry.yacht.berths,
      score: entry.score,
      factors: entry.factors,
      primaryImage: imageMap.get(entry.yacht.id) ?? null,
    }));

    return NextResponse.json({ similar });
  } catch (error) {
    console.error("Error fetching similar yachts:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar yachts" },
      { status: 500 },
    );
  }
}
