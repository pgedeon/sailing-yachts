import { pool } from "@/lib/db";
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

async function getYachtsBySlugsUncached(
  slugA: string,
  slugB: string
): Promise<{ yachtA: YachtComparisonData | null; yachtB: YachtComparisonData | null }> {
  const result = await pool.query(
    `SELECT
      ym.id, ym.model_name AS "modelName", ym.year, ym.slug,
      ym.length_overall AS "lengthOverall", ym.beam, ym.draft,
      ym.displacement, ym.ballast, ym.sail_area_main AS "sailAreaMain",
      ym.rig_type AS "rigType", ym.keel_type AS "keelType",
      ym.hull_material AS "hullMaterial",
      ym.cabins, ym.berths, ym.heads, ym.max_occupancy AS "maxOccupancy",
      ym.engine_hp AS "engineHp", ym.engine_type AS "engineType",
      ym.fuel_capacity AS "fuelCapacity", ym.water_capacity AS "waterCapacity",
      ym.design_notes AS "designNotes", ym.description,
      m.name AS manufacturer
    FROM yacht_models ym
    LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
    WHERE ym.slug = $1 OR ym.slug = $2`,
    [slugA, slugB]
  );

  console.log(`[canonical-compare] Query returned ${result.rows.length} yachts for slugs: ${slugA}, ${slugB}`);

  const yachtA = result.rows.find((y: any) => y.slug === slugA) || null;
  const yachtB = result.rows.find((y: any) => y.slug === slugB) || null;

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
      const result = await pool.query(
        `SELECT i.url FROM images i
         JOIN yacht_models ym ON i.yacht_model_id = ym.id
         WHERE ym.slug = $1 AND i.is_primary = true
         LIMIT 1`,
        [slug]
      );

      return result.rows[0]?.url || null;
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
