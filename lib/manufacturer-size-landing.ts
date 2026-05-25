/**
 * Data layer for manufacturer+size category landing pages.
 */

import { db, yachtModels, manufacturers } from "@/lib/db";
import { eq, and, sql, count, asc } from "drizzle-orm";
import { SIZE_CATEGORIES, type SizeCategory } from "@/lib/size-categories";
import type { YachtListItem } from "@/lib/yachts";
import { slugify } from "@/lib/utils/slugify";

export interface ManufacturerSizePageData {
  manufacturer: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  sizeCategory: SizeCategory;
  yachts: YachtListItem[];
  otherSizes: Array<{
    slug: string;
    labelEn: string;
    labelFr: string;
    count: number;
  }>;
  otherManufacturers: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
}

/**
 * Get manufacturer by slug (slug is derived from name via slugify).
 */
async function getManufacturerBySlugFromDb(mfrSlug: string) {
  const rows = await db
    .select({
      id: manufacturers.id,
      name: manufacturers.name,
      logoUrl: manufacturers.logoUrl,
    })
    .from(manufacturers)
    .orderBy(asc(manufacturers.name));

  type MfrRow = (typeof rows)[number];
  return rows.find((row: MfrRow) => row.name && slugify(row.name) === mfrSlug) || null;
}

/**
 * Fetch all data needed for a manufacturer+size category landing page.
 */
export async function getManufacturerSizePageData(
  manufacturerSlug: string,
  sizeCategorySlug: string
): Promise<ManufacturerSizePageData | null> {
  const sizeCategory = SIZE_CATEGORIES.find((c) => c.slug === sizeCategorySlug);
  if (!sizeCategory) return null;

  const mfr = await getManufacturerBySlugFromDb(manufacturerSlug);
  if (!mfr) return null;

  // lengthOverall is PgNumeric (string) — compare as numeric via SQL
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
        eq(manufacturers.id, mfr.id),
        sql`${yachtModels.lengthOverall}::numeric >= ${sizeCategory.loaMin}`,
        sql`${yachtModels.lengthOverall}::numeric < ${sizeCategory.loaMax}`
      )
    )
    .orderBy(yachtModels.modelName);

  // Get counts for other size categories (same manufacturer)
  const otherSizes = await Promise.all(
    SIZE_CATEGORIES.filter((sc) => sc.slug !== sizeCategorySlug).map(
      async (sc) => {
        const result = await db
          .select({ cnt: count() })
          .from(yachtModels)
          .innerJoin(
            manufacturers,
            eq(yachtModels.manufacturerId, manufacturers.id)
          )
          .where(
            and(
              eq(manufacturers.id, mfr.id),
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

  // Get other manufacturers with yachts in same size category
  const allMfrs = await db
    .select({
      id: manufacturers.id,
      name: manufacturers.name,
    })
    .from(manufacturers);

  const otherManufacturers = (
    await Promise.all(
      allMfrs
        .filter((m: { id: number; name: string }) => m.id !== mfr.id)
        .map(async (m: { id: number; name: string }) => {
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
  ).filter((m) => m.count > 0);

  return {
    manufacturer: {
      name: mfr.name,
      slug: manufacturerSlug,
      logoUrl: mfr.logoUrl,
    },
    sizeCategory,
    yachts,
    otherSizes,
    otherManufacturers,
  };
}

/**
 * Get all valid manufacturer+size combinations for generateStaticParams.
 */
export async function getManufacturerSizeCombinations(): Promise<
  Array<{ manufacturerSlug: string; sizeCategory: string }>
> {
  const allMfrs = await db
    .select({ id: manufacturers.id, name: manufacturers.name })
    .from(manufacturers);

  const combos: Array<{ manufacturerSlug: string; sizeCategory: string }> = [];

  for (const mfr of allMfrs) {
    for (const sc of SIZE_CATEGORIES) {
      const result = await db
        .select({ cnt: count() })
        .from(yachtModels)
        .innerJoin(
          manufacturers,
          eq(yachtModels.manufacturerId, manufacturers.id)
        )
        .where(
          and(
            eq(manufacturers.id, mfr.id),
            sql`${yachtModels.lengthOverall}::numeric >= ${sc.loaMin}`,
            sql`${yachtModels.lengthOverall}::numeric < ${sc.loaMax}`
          )
        );
      const cnt = result[0]?.cnt ?? 0;
      if (cnt > 0) {
        combos.push({
          manufacturerSlug: slugify(mfr.name),
          sizeCategory: sc.slug,
        });
      }
    }
  }

  return combos;
}
