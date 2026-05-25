/**
 * Data layer for size category hub pages.
 * Route: /yachts/by-size/[sizeCategory]
 */

import { db, yachtModels, manufacturers } from "@/lib/db";
import { eq, and, sql, count, asc } from "drizzle-orm";
import { SIZE_CATEGORIES, type SizeCategory } from "@/lib/size-categories";
import type { YachtListItem } from "@/lib/yachts";
import { slugify } from "@/lib/utils/slugify";

export interface SizeCategoryHubData {
  sizeCategory: SizeCategory;
  yachts: YachtListItem[];
  otherSizes: Array<{
    slug: string;
    labelEn: string;
    labelFr: string;
    count: number;
  }>;
  topManufacturers: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
}

/**
 * Fetch all data for a size category hub page.
 * Optimized to use GROUP BY for manufacturer counts instead of N+1 queries.
 */
export async function getSizeCategoryHubData(
  sizeCategorySlug: string
): Promise<SizeCategoryHubData | null> {
  const sizeCategory = SIZE_CATEGORIES.find((c) => c.slug === sizeCategorySlug);
  if (!sizeCategory) return null;

  // Single query: get yachts in this size range with manufacturer info
  const yachts = await db
    .select({
      id: yachtModels.id,
      manufacturer: manufacturers.name,
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
      description: yachtModels.description,
    })
    .from(yachtModels)
    .innerJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(
      and(
        sql`${yachtModels.lengthOverall}::numeric >= ${sizeCategory.loaMin}`,
        sql`${yachtModels.lengthOverall}::numeric < ${sizeCategory.loaMax}`
      )
    )
    .orderBy(yachtModels.modelName);

  if (yachts.length === 0) return null;

  // Single query: count yachts per manufacturer in this size range using GROUP BY
  const mfrCounts = await db
    .select({
      name: manufacturers.name,
      cnt: count(),
    })
    .from(yachtModels)
    .innerJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(
      and(
        sql`${yachtModels.lengthOverall}::numeric >= ${sizeCategory.loaMin}`,
        sql`${yachtModels.lengthOverall}::numeric < ${sizeCategory.loaMax}`
      )
    )
    .groupBy(manufacturers.name)
    .orderBy(sql`count(*) DESC`);

  const topManufacturers = mfrCounts.map((r: { name: string; cnt: number }) => ({
    name: r.name,
    slug: slugify(r.name),
    count: r.cnt,
  }));

  // Single query: count yachts in each OTHER size category
  // Build a UNION ALL query for efficiency
  const otherSizeSlugs = SIZE_CATEGORIES.filter((sc) => sc.slug !== sizeCategorySlug);
  const otherSizes: Array<{
    slug: string;
    labelEn: string;
    labelFr: string;
    count: number;
  }> = [];

  for (const sc of otherSizeSlugs) {
    const result = await db
      .select({ cnt: count() })
      .from(yachtModels)
      .where(
        and(
          sql`${yachtModels.lengthOverall}::numeric >= ${sc.loaMin}`,
          sql`${yachtModels.lengthOverall}::numeric < ${sc.loaMax}`
        )
      );
    otherSizes.push({
      slug: sc.slug,
      labelEn: sc.labelEn,
      labelFr: sc.labelFr,
      count: result[0]?.cnt ?? 0,
    });
  }

  return {
    sizeCategory,
    yachts,
    otherSizes,
    topManufacturers,
  };
}
