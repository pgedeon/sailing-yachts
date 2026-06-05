import { db } from "@/lib/db";
import { featuredYachts, yachtModels, manufacturers, images } from "@/drizzle/schema";
import { eq, and, lte, gte, desc, sql } from "drizzle-orm";

export interface FeaturedYachtData {
  id: number;
  yachtModelId: number;
  weekStart: string;
  weekEnd: string;
  headline: string | null;
  editorialText: string | null;
  newsletterSent: boolean;
  isManualOverride: boolean;
  isActive: boolean;
  yacht: {
    id: number;
    modelName: string;
    slug: string;
    year: number;
    lengthOverall: string | null;
    beam: string | null;
    draft: string | null;
    displacement: string | null;
    cabins: number | null;
    berths: number | null;
    description: string | null;
    manufacturer: string;
    manufacturerSlug: string;
    imageUrl: string | null;
  };
}

/**
 * Get the currently active featured yacht (the one whose week range covers now).
 */
export async function getActiveFeaturedYacht(): Promise<FeaturedYachtData | null> {
  const now = new Date();

  const rows = await db
    .select({
      id: featuredYachts.id,
      yachtModelId: featuredYachts.yachtModelId,
      weekStart: featuredYachts.weekStart,
      weekEnd: featuredYachts.weekEnd,
      headline: featuredYachts.headline,
      editorialText: featuredYachts.editorialText,
      newsletterSent: featuredYachts.newsletterSent,
      isManualOverride: featuredYachts.isManualOverride,
      isActive: featuredYachts.isActive,
      yachtId: yachtModels.id,
      modelName: yachtModels.modelName,
      slug: yachtModels.slug,
      year: yachtModels.year,
      lengthOverall: yachtModels.lengthOverall,
      beam: yachtModels.beam,
      draft: yachtModels.draft,
      displacement: yachtModels.displacement,
      cabins: yachtModels.cabins,
      berths: yachtModels.berths,
      description: yachtModels.description,
      manufacturerName: manufacturers.name,
      imageUrl: images.url,
    })
    .from(featuredYachts)
    .innerJoin(yachtModels, eq(featuredYachts.yachtModelId, yachtModels.id))
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .leftJoin(images, and(eq(images.yachtModelId, yachtModels.id), eq(images.isPrimary, true)))
    .where(
      and(
        eq(featuredYachts.isActive, true),
        lte(featuredYachts.weekStart, now),
        gte(featuredYachts.weekEnd, now),
      )
    )
    .orderBy(desc(featuredYachts.isManualOverride), desc(featuredYachts.weekStart))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  const manufacturerSlug = row.manufacturerName
    ? row.manufacturerName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    : "";

  return {
    id: row.id,
    yachtModelId: row.yachtModelId,
    weekStart: row.weekStart instanceof Date ? row.weekStart.toISOString() : String(row.weekStart),
    weekEnd: row.weekEnd instanceof Date ? row.weekEnd.toISOString() : String(row.weekEnd),
    headline: row.headline,
    editorialText: row.editorialText,
    newsletterSent: row.newsletterSent,
    isManualOverride: row.isManualOverride,
    isActive: row.isActive,
    yacht: {
      id: row.yachtId,
      modelName: row.modelName,
      slug: row.slug ?? "",
      year: row.year,
      lengthOverall: row.lengthOverall,
      beam: row.beam,
      draft: row.draft,
      displacement: row.displacement,
      cabins: row.cabins,
      berths: row.berths,
      description: row.description,
      manufacturer: row.manufacturerName ?? "",
      manufacturerSlug,
      imageUrl: row.imageUrl ?? null,
    },
  };
}

/**
 * Get the featured yacht for a specific week (by week start date).
 */
export async function getFeaturedYachtByWeek(weekStart: Date): Promise<FeaturedYachtData | null> {
  const rows = await db
    .select({
      id: featuredYachts.id,
      yachtModelId: featuredYachts.yachtModelId,
      weekStart: featuredYachts.weekStart,
      weekEnd: featuredYachts.weekEnd,
      headline: featuredYachts.headline,
      editorialText: featuredYachts.editorialText,
      newsletterSent: featuredYachts.newsletterSent,
      isManualOverride: featuredYachts.isManualOverride,
      isActive: featuredYachts.isActive,
      yachtId: yachtModels.id,
      modelName: yachtModels.modelName,
      slug: yachtModels.slug,
      year: yachtModels.year,
      lengthOverall: yachtModels.lengthOverall,
      beam: yachtModels.beam,
      draft: yachtModels.draft,
      displacement: yachtModels.displacement,
      cabins: yachtModels.cabins,
      berths: yachtModels.berths,
      description: yachtModels.description,
      manufacturerName: manufacturers.name,
      imageUrl: images.url,
    })
    .from(featuredYachts)
    .innerJoin(yachtModels, eq(featuredYachts.yachtModelId, yachtModels.id))
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .leftJoin(images, and(eq(images.yachtModelId, yachtModels.id), eq(images.isPrimary, true)))
    .where(
      and(
        eq(featuredYachts.isActive, true),
        lte(featuredYachts.weekStart, weekStart),
        gte(featuredYachts.weekEnd, weekStart),
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  const manufacturerSlug = row.manufacturerName
    ? row.manufacturerName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    : "";

  return {
    id: row.id,
    yachtModelId: row.yachtModelId,
    weekStart: row.weekStart instanceof Date ? row.weekStart.toISOString() : String(row.weekStart),
    weekEnd: row.weekEnd instanceof Date ? row.weekEnd.toISOString() : String(row.weekEnd),
    headline: row.headline,
    editorialText: row.editorialText,
    newsletterSent: row.newsletterSent,
    isManualOverride: row.isManualOverride,
    isActive: row.isActive,
    yacht: {
      id: row.yachtId,
      modelName: row.modelName,
      slug: row.slug ?? "",
      year: row.year,
      lengthOverall: row.lengthOverall,
      beam: row.beam,
      draft: row.draft,
      displacement: row.displacement,
      cabins: row.cabins,
      berths: row.berths,
      description: row.description,
      manufacturer: row.manufacturerName ?? "",
      manufacturerSlug,
      imageUrl: row.imageUrl ?? null,
    },
  };
}

/**
 * Get all featured yachts (for admin).
 */
export async function getAllFeaturedYachts(limit = 20, offset = 0) {
  const rows = await db
    .select({
      id: featuredYachts.id,
      yachtModelId: featuredYachts.yachtModelId,
      weekStart: featuredYachts.weekStart,
      weekEnd: featuredYachts.weekEnd,
      headline: featuredYachts.headline,
      editorialText: featuredYachts.editorialText,
      newsletterSent: featuredYachts.newsletterSent,
      isManualOverride: featuredYachts.isManualOverride,
      isActive: featuredYachts.isActive,
      createdAt: featuredYachts.createdAt,
      modelName: yachtModels.modelName,
      manufacturerName: manufacturers.name,
    })
    .from(featuredYachts)
    .innerJoin(yachtModels, eq(featuredYachts.yachtModelId, yachtModels.id))
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .orderBy(desc(featuredYachts.weekStart))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(featuredYachts);

  return {
    items: rows,
    total: countResult[0]?.count ?? 0,
  };
}

/**
 * Create a new featured yacht entry.
 */
export async function createFeaturedYacht(data: {
  yachtModelId: number;
  weekStart: Date;
  weekEnd: Date;
  headline?: string;
  editorialText?: string;
  isManualOverride?: boolean;
}) {
  const result = await db.insert(featuredYachts).values({
    yachtModelId: data.yachtModelId,
    weekStart: data.weekStart,
    weekEnd: data.weekEnd,
    headline: data.headline ?? null,
    editorialText: data.editorialText ?? null,
    isManualOverride: data.isManualOverride ?? false,
    isActive: true,
  }).returning();

  return result[0];
}

/**
 * Update a featured yacht entry.
 */
export async function updateFeaturedYacht(
  id: number,
  data: {
    headline?: string;
    editorialText?: string;
    isActive?: boolean;
    weekStart?: Date;
    weekEnd?: Date;
  },
) {
  const result = await db
    .update(featuredYachts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(featuredYachts.id, id))
    .returning();

  return result[0];
}

/**
 * Delete a featured yacht entry.
 */
export async function deleteFeaturedYacht(id: number) {
  await db.delete(featuredYachts).where(eq(featuredYachts.id, id));
}

/**
 * Mark newsletter as sent for a featured yacht.
 */
export async function markNewsletterSent(id: number) {
  await db
    .update(featuredYachts)
    .set({ newsletterSent: true, updatedAt: new Date() })
    .where(eq(featuredYachts.id, id));
}

/**
 * Get recent featured yachts for archive display.
 */
export async function getRecentFeaturedYachts(limit = 6): Promise<FeaturedYachtData[]> {
  const rows = await db
    .select({
      id: featuredYachts.id,
      yachtModelId: featuredYachts.yachtModelId,
      weekStart: featuredYachts.weekStart,
      weekEnd: featuredYachts.weekEnd,
      headline: featuredYachts.headline,
      editorialText: featuredYachts.editorialText,
      newsletterSent: featuredYachts.newsletterSent,
      isManualOverride: featuredYachts.isManualOverride,
      isActive: featuredYachts.isActive,
      yachtId: yachtModels.id,
      modelName: yachtModels.modelName,
      slug: yachtModels.slug,
      year: yachtModels.year,
      lengthOverall: yachtModels.lengthOverall,
      beam: yachtModels.beam,
      draft: yachtModels.draft,
      displacement: yachtModels.displacement,
      cabins: yachtModels.cabins,
      berths: yachtModels.berths,
      description: yachtModels.description,
      manufacturerName: manufacturers.name,
      imageUrl: images.url,
    })
    .from(featuredYachts)
    .innerJoin(yachtModels, eq(featuredYachts.yachtModelId, yachtModels.id))
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .leftJoin(images, and(eq(images.yachtModelId, yachtModels.id), eq(images.isPrimary, true)))
    .where(eq(featuredYachts.isActive, true))
    .orderBy(desc(featuredYachts.weekStart))
    .limit(limit);

  return rows.map((row: any) => {
    const manufacturerSlug = row.manufacturerName
      ? row.manufacturerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : "";

    return {
      id: row.id,
      yachtModelId: row.yachtModelId,
      weekStart: row.weekStart instanceof Date ? row.weekStart.toISOString() : String(row.weekStart),
      weekEnd: row.weekEnd instanceof Date ? row.weekEnd.toISOString() : String(row.weekEnd),
      headline: row.headline,
      editorialText: row.editorialText,
      newsletterSent: row.newsletterSent,
      isManualOverride: row.isManualOverride,
      isActive: row.isActive,
      yacht: {
        id: row.yachtId,
        modelName: row.modelName,
        slug: row.slug ?? "",
        year: row.year,
        lengthOverall: row.lengthOverall,
        beam: row.beam,
        draft: row.draft,
        displacement: row.displacement,
        cabins: row.cabins,
        berths: row.berths,
        description: row.description,
        manufacturer: row.manufacturerName ?? "",
        manufacturerSlug,
        imageUrl: row.imageUrl ?? null,
      },
    };
  });
}

/**
 * Generate a default headline for a featured yacht based on its data.
 */
export function generateDefaultHeadline(yacht: {
  modelName: string;
  manufacturer: string;
  year: number;
  lengthOverall: string | null;
}): string {
  const loa = yacht.lengthOverall ? ` ${Number(yacht.lengthOverall).toFixed(1)}m` : "";
  return `${yacht.manufacturer} ${yacht.modelName}${loa} (${yacht.year})`;
}
