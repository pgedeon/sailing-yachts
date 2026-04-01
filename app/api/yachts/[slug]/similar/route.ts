import { NextResponse } from "next/server";
import { db, yachtModels, manufacturers, images } from "@/lib/db";
import { eq, ne, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface SpecRow {
  id: number;
  manufacturer: string | null;
  modelName: string;
  slug: string | null;
  year: number;
  lengthOverall: string | null;
  beam: string | null;
  draft: string | null;
  displacement: string | null;
  sailAreaMain: string | null;
  hullMaterial: string | null;
  rigType: string | null;
  keelType: string | null;
  cabins: number | null;
}

interface ScoredYacht extends SpecRow {
  score: number;
  primaryImage: string | null;
}

/**
 * Compute weighted Euclidean similarity between the source yacht and candidates.
 * Weights prioritize dimensional proximity (LOA > displacement > beam > draft > sail area).
 * Normalizes each dimension by the source value so the distance is scale-independent.
 */
function computeSimilarity(source: SpecRow, candidates: SpecRow[]): ScoredYacht[] {
  type DimKey = "lengthOverall" | "beam" | "draft" | "displacement" | "sailAreaMain";
  const dims: Array<{ key: DimKey; weight: number }> = [
    { key: "lengthOverall", weight: 0.30 },
    { key: "displacement", weight: 0.25 },
    { key: "beam", weight: 0.20 },
    { key: "draft", weight: 0.15 },
    { key: "sailAreaMain", weight: 0.10 },
  ];

  const scored = candidates
    .map((c) => {
      let totalWeight = 0;
      let weightedDist = 0;

      for (const dim of dims) {
        const sv = source[dim.key] !== null ? parseFloat(source[dim.key]!) : null;
        const cv = c[dim.key] !== null ? parseFloat(c[dim.key]!) : null;

        if (sv === null || cv === null || sv === 0) continue;

        // Normalized absolute difference
        const normDiff = Math.abs(sv - cv) / sv;
        weightedDist += dim.weight * normDiff;
        totalWeight += dim.weight;
      }

      // If we had no overlapping dimensions, skip
      if (totalWeight === 0) return null;

      // Convert to a 0-1 similarity score (1 = identical)
      const normalizedDist = weightedDist / totalWeight;
      const score = Math.max(0, 1 - normalizedDist);

      return { ...c, score };
    })
    .filter((x): x is ScoredYacht & { score: number } => x !== null && x.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

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
        sailAreaMain: yachtModels.sailAreaMain,
        hullMaterial: yachtModels.hullMaterial,
        rigType: yachtModels.rigType,
        keelType: yachtModels.keelType,
        cabins: yachtModels.cabins,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(eq(yachtModels.slug, slug))
      .limit(1);

    if (sourceResult.length === 0) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
    }

    const source = sourceResult[0];

    // Fetch all other yachts as candidates
    const candidates = await db
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
        sailAreaMain: yachtModels.sailAreaMain,
        hullMaterial: yachtModels.hullMaterial,
        rigType: yachtModels.rigType,
        keelType: yachtModels.keelType,
        cabins: yachtModels.cabins,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(ne(yachtModels.id, source.id));

    // Compute similarity
    const similar = computeSimilarity(source, candidates);

    // Fetch primary images for similar yachts
    if (similar.length > 0) {
      const similarIds = similar.map((y) => y.id);

      const allImages = await db
        .select({
          yachtModelId: images.yachtModelId,
          url: images.url,
          altText: images.altText,
          isPrimary: images.isPrimary,
        })
        .from(images)
        .where(inArray(images.yachtModelId, similarIds));

      // Build a map of yachtId -> primary image (fallback to first)
      const imageMap = new Map<number, { url: string; altText: string | null }>();
      for (const img of allImages) {
        if (img.isPrimary || !imageMap.has(img.yachtModelId)) {
          imageMap.set(img.yachtModelId, { url: img.url, altText: img.altText });
        }
      }

      // Attach images to results
      for (const yacht of similar) {
        (yacht as any).primaryImage = imageMap.get(yacht.id)?.url || null;
      }
    }

    return NextResponse.json({ similar });
  } catch (error) {
    console.error("Error fetching similar yachts:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar yachts" },
      { status: 500 },
    );
  }
}
