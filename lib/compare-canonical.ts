import { db, yachtModels, manufacturers, images } from "@/lib/db";
import { eq, or, and, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export interface YachtComparisonData {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number | null;
  slug: string | null;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sailAreaMain: number | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  maxOccupancy: number | null;
  engineHp: number | null;
  engineType: string | null;
  fuelCapacity: number | null;
  waterCapacity: number | null;
  designNotes: string | null;
  description: string | null;
  primaryImageUrl: string | null;
}

/**
 * Normalize a value that may be a string (Neon HTTP decimal columns) to a number.
 */
function toNum(val: unknown): number | null {
  if (val == null) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

async function getYachtsBySlugsUncached(
  slugA: string,
  slugB: string
): Promise<{ yachtA: YachtComparisonData | null; yachtB: YachtComparisonData | null }> {
  const rows = await db
    .select({
      id: yachtModels.id,
      modelName: yachtModels.modelName,
      year: yachtModels.year,
      slug: yachtModels.slug,
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
      maxOccupancy: yachtModels.maxOccupancy,
      engineHp: yachtModels.engineHp,
      engineType: yachtModels.engineType,
      fuelCapacity: yachtModels.fuelCapacity,
      waterCapacity: yachtModels.waterCapacity,
      designNotes: yachtModels.designNotes,
      description: yachtModels.description,
      manufacturer: manufacturers.name,
    })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(or(eq(yachtModels.slug, slugA), eq(yachtModels.slug, slugB)));

  console.log(`[canonical-compare] Query returned ${rows.length} yachts for slugs: ${slugA}, ${slugB}`);

  // Normalize numeric fields from string (Neon HTTP returns decimal columns as strings)
  const normalized: YachtComparisonData[] = rows.map((row: Record<string, unknown>) => ({
    id: row.id as number,
    modelName: row.modelName as string,
    year: row.year as number | null,
    slug: row.slug as string | null,
    lengthOverall: toNum(row.lengthOverall),
    beam: toNum(row.beam),
    draft: toNum(row.draft),
    displacement: toNum(row.displacement),
    ballast: toNum(row.ballast),
    sailAreaMain: toNum(row.sailAreaMain),
    rigType: row.rigType as string | null,
    keelType: row.keelType as string | null,
    hullMaterial: row.hullMaterial as string | null,
    cabins: row.cabins as number | null,
    berths: row.berths as number | null,
    heads: row.heads as number | null,
    maxOccupancy: row.maxOccupancy as number | null,
    engineHp: toNum(row.engineHp),
    engineType: row.engineType as string | null,
    fuelCapacity: toNum(row.fuelCapacity),
    waterCapacity: toNum(row.waterCapacity),
    designNotes: row.designNotes as string | null,
    description: row.description as string | null,
    primaryImageUrl: null,
    manufacturer: row.manufacturer as string,
  }));

  const yachtA = normalized.find((y) => y.slug === slugA) || null;
  const yachtB = normalized.find((y) => y.slug === slugB) || null;

  console.log(`[canonical-compare] yachtA found: ${!!yachtA}, yachtB found: ${!!yachtB}`);

  return { yachtA, yachtB };
}

export async function getYachtsBySlugs(
  slugA: string,
  slugB: string
): Promise<{ yachtA: YachtComparisonData | null; yachtB: YachtComparisonData | null }> {
  return unstable_cache(
    async () => getYachtsBySlugsUncached(slugA, slugB),
    [`compare-canonical-${slugA}-${slugB}`],
    { tags: ["yachts"], revalidate: 3600 }
  )();
}

export async function getPrimaryImage(slug: string): Promise<string | null> {
  return unstable_cache(
    async () => {
      const rows = await db
        .select({ url: images.url })
        .from(images)
        .innerJoin(yachtModels, eq(images.yachtModelId, yachtModels.id))
        .where(and(eq(yachtModels.slug, slug), sql`${images.isPrimary} = true`))
        .limit(1);

      return rows[0]?.url || null;
    },
    [`primary-image-${slug}`],
    { tags: ["images"], revalidate: 3600 }
  )();
}

export function generateComparisonIntro(yachtA: YachtComparisonData, yachtB: YachtComparisonData): string {
  const fullNameA = `${yachtA.manufacturer} ${yachtA.modelName}`;
  const fullNameB = `${yachtB.manufacturer} ${yachtB.modelName}`;
  
  // Get length for context
  const lenA = yachtA.lengthOverall ? yachtA.lengthOverall.toFixed(1) : "unknown size";
  const lenB = yachtB.lengthOverall ? yachtB.lengthOverall.toFixed(1) : "unknown size";
  
  // Get year context
  const yearA = yachtA.year || "unknown year";
  const yearB = yachtB.year || "unknown year";
  
  return `Compare ${fullNameA} (${yearA}, ${lenA}m LOA) and ${fullNameB} (${yearB}, ${lenB}m LOA) side by side. This detailed comparison covers dimensions, sail plan, accommodation, and technical specifications to help you choose between these two cruising yachts. Use table below to see key differences in length, beam, draft, displacement, cabins, and more.`;
}

export function generateComparisonMetadata(
  yachtA: YachtComparisonData,
  yachtB: YachtComparisonData
) {
  const fullNameA = `${yachtA.manufacturer} ${yachtA.modelName}`;
  const fullNameB = `${yachtB.manufacturer} ${yachtB.modelName}`;
  
  return {
    title: `${fullNameA} vs ${fullNameB} Comparison`,
    description: `Compare ${fullNameA} and ${fullNameB} side by side — dimensions, sail plan, accommodation, and technical specs. Which cruising yacht is right for you?`,
    keywords: [
      fullNameA,
      fullNameB,
      "compare yachts",
      "yacht comparison",
      "sailboat comparison",
      `${yachtA.manufacturer} vs ${yachtB.manufacturer}`,
      "cruising yacht comparison",
    ],
  };
}
