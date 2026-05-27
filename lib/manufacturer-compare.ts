import { db, manufacturers, yachtModels } from "@/lib/db";
import { slugify } from "@/lib/utils/slugify";
import { eq, count, min, max, avg, sql } from "drizzle-orm";

export interface ManufacturerCompareStats {
  id: number;
  name: string;
  slug: string;
  country: string | null;
  foundedYear: number | null;
  logoUrl: string | null;
  description: string | null;
  websiteUrl: string | null;
  yachtCount: number;
  minYear: number | null;
  maxYear: number | null;
  minLength: number | null;
  maxLength: number | null;
  avgLength: number | null;
  minDisplacement: number | null;
  maxDisplacement: number | null;
  minCabins: number | null;
  maxCabins: number | null;
  popularModels: Array<{
    id: number;
    slug: string | null;
    modelName: string;
    year: number;
    lengthOverall: number | null;
  }>;
}

function parseNum(v: string | number | null): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function getManufacturerCompareData(
  slugA: string,
  slugB: string,
): Promise<{ mfrA: ManufacturerCompareStats; mfrB: ManufacturerCompareStats } | null> {
  try {
    // Get all manufacturers
    const allMfrs = await db.select().from(manufacturers);

    const mfrARow = allMfrs.find((m: any) => slugify(m.name) === slugA);
    const mfrBRow = allMfrs.find((m: any) => slugify(m.name) === slugB);

    if (!mfrARow || !mfrBRow) return null;

    const [statsA, statsB] = await Promise.all([
      getStatsForManufacturer(mfrARow),
      getStatsForManufacturer(mfrBRow),
    ]);

    return { mfrA: statsA, mfrB: statsB };
  } catch (error) {
    console.error("[manufacturer-compare] DB query failed:", error);
    return null;
  }
}

async function getStatsForManufacturer(mfr: any): Promise<ManufacturerCompareStats> {
  // Get aggregate stats
  const aggResult = await db
    .select({
      yachtCount: count(yachtModels.id),
      minYear: min(yachtModels.year),
      maxYear: max(yachtModels.year),
      minLength: min(yachtModels.lengthOverall),
      maxLength: max(yachtModels.lengthOverall),
      avgLength: avg(yachtModels.lengthOverall),
      minDisplacement: min(yachtModels.displacement),
      maxDisplacement: max(yachtModels.displacement),
      minCabins: min(yachtModels.cabins),
      maxCabins: max(yachtModels.cabins),
    })
    .from(yachtModels)
    .where(eq(yachtModels.manufacturerId, mfr.id));

  const agg = aggResult[0];

  // Get top 5 popular models (by completeness score or recent)
  const popularModels = await db
    .select({
      id: yachtModels.id,
      slug: yachtModels.slug,
      modelName: yachtModels.modelName,
      year: yachtModels.year,
      lengthOverall: yachtModels.lengthOverall,
    })
    .from(yachtModels)
    .where(eq(yachtModels.manufacturerId, mfr.id))
    .orderBy(sql`COALESCE(${yachtModels.completenessScore}, 0) DESC, ${yachtModels.year} DESC`)
    .limit(5);

  return {
    id: mfr.id,
    name: mfr.name,
    slug: slugify(mfr.name),
    country: mfr.country,
    foundedYear: mfr.foundedYear,
    logoUrl: mfr.logoUrl,
    description: mfr.description,
    websiteUrl: mfr.websiteUrl,
    yachtCount: Number(agg?.yachtCount ?? 0),
    minYear: agg?.minYear ?? null,
    maxYear: agg?.maxYear ?? null,
    minLength: parseNum(agg?.minLength),
    maxLength: parseNum(agg?.maxLength),
    avgLength: parseNum(agg?.avgLength),
    minDisplacement: parseNum(agg?.minDisplacement),
    maxDisplacement: parseNum(agg?.maxDisplacement),
    minCabins: agg?.minCabins ?? null,
    maxCabins: agg?.maxCabins ?? null,
    popularModels: popularModels.map((m: any) => ({
      id: m.id,
      slug: m.slug,
      modelName: m.modelName,
      year: m.year,
      lengthOverall: parseNum(m.lengthOverall),
    })),
  };
}
