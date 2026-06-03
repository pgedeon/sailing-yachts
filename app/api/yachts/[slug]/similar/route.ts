import { NextResponse } from "next/server";
import { db, yachtModels, manufacturers, images } from "@/lib/db";
import { eq } from "drizzle-orm";
import { rankSimilarYachts, type YachtForSimilarity } from "@/lib/similarity-score";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
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

    // Build response with images and factor details
    const similar = await Promise.all(
      ranked.map(async (entry) => {
        let primaryImage: string | null = null;
        try {
          const yachtImages = await db
            .select({ url: images.url })
            .from(images)
            .where(eq(images.yachtModelId, entry.yacht.id))
            .limit(1);
          primaryImage = yachtImages.length > 0 ? yachtImages[0].url : null;
        } catch {
          primaryImage = null;
        }

        return {
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
          primaryImage,
        };
      }),
    );

    return NextResponse.json({ similar });
  } catch (error) {
    console.error("Error fetching similar yachts:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar yachts" },
      { status: 500 },
    );
  }
}
