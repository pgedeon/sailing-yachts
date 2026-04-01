import { NextResponse } from "next/server";
import { db, yachtModels, manufacturers, images } from "@/lib/db";
import { eq } from "drizzle-orm";

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
 * Weighted Euclidean similarity based on dimensional specs.
 * Weights: LOA 30%, displacement 25%, beam 20%, draft 15%, sail area 10%.
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

  return candidates
    .map((c) => {
      let totalWeight = 0;
      let weightedDist = 0;

      for (const dim of dims) {
        const sv = source[dim.key] !== null ? parseFloat(source[dim.key]!) : null;
        const cv = c[dim.key] !== null ? parseFloat(c[dim.key]!) : null;
        if (sv === null || cv === null || sv === 0) continue;
        weightedDist += dim.weight * (Math.abs(sv - cv) / sv);
        totalWeight += dim.weight;
      }

      if (totalWeight === 0) return null;
      const score = Math.max(0, 1 - weightedDist / totalWeight);
      return { ...c, score };
    })
    .filter((x): x is ScoredYacht => x !== null && x.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
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

    // Fetch candidate yachts — exclude source, limit to reasonable set
    // Fetch all yachts (200 is fine for in-memory similarity)
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
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id));

    // Filter out source in JS (avoids ne() issues with Neon HTTP)
    const filteredCandidates = candidates.filter((c: any) => c.id !== source.id);

    // Compute similarity
    const similar = computeSimilarity(source, filteredCandidates);

    // Fetch primary images for similar yachts individually
    if (similar.length > 0) {
      for (const yacht of similar) {
        try {
          const yachtImages = await db
            .select({
              url: images.url,
              isPrimary: images.isPrimary,
            })
            .from(images)
            .where(eq(images.yachtModelId, yacht.id))
            .limit(1);

          (yacht as any).primaryImage = yachtImages.length > 0 ? yachtImages[0].url : null;
        } catch {
          (yacht as any).primaryImage = null;
        }
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
