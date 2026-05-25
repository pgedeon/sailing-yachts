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
 */
export async function getSizeCategoryHubData(
  sizeCategorySlug: string
): Promise<SizeCategoryHubData | null> {
  const sizeCategory = SIZE_CATEGORIES.find((c) => c.slug === sizeCategorySlug);
  if (!sizeCategory) return null;

  // Get yachts in this size range, across all manufacturers
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

  // Get counts for other size categories
  const otherSizes = await Promise.all(
    SIZE_CATEGORIES.filter((sc) => sc.slug !== sizeCategorySlug).map(
      async (sc) => {
        const result = await db
          .select({ cnt: count() })
          .from(yachtModels)
          .where(
            and(
              sql`${yachtModels.lengthOverall}::numeric >= ${sc.loaMin}`,
              sql`${yachtModels.lengthOverall}::numeric < ${sc.loaMax}`
            )
          );
        return {
          slug: sc.slug,
          labelEn: sc.labelEn,
          labelFr: sc.labelFr,
          count: result[0]?.cnt ?? 0,
        };
      }
    )
  );

  // Get top manufacturers in this size range with counts
  const allMfrs = await db
    .select({
      id: manufacturers.id,
      name: manufacturers.name,
    })
    .from(manufacturers);

  const topManufacturers = (
    await Promise.all(
      allMfrs.map(async (m: { id: number; name: string }) => {
        const result = await db
          .select({ cnt: count() })
          .from(yachtModels)
          .innerJoin(
            manufacturers,
            eq(yachtModels.manufacturerId, manufacturers.id)
          )
          .where(
            and(
              eq(manufacturers.id, m.id),
              sql`${yachtModels.lengthOverall}::numeric >= ${sizeCategory.loaMin}`,
              sql`${yachtModels.lengthOverall}::numeric < ${sizeCategory.loaMax}`
            )
          );
        return {
          name: m.name,
          slug: slugify(m.name),
          count: result[0]?.cnt ?? 0,
        };
      })
    )
  )
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    sizeCategory,
    yachts,
    otherSizes,
    topManufacturers,
  };
}
