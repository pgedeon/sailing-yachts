import { db, yachtModels, manufacturers, images, reviews, specValues, specCategories, mediaAssets } from "@/lib/db-edge";
import { eq, inArray, desc, asc, sql, count, isNotNull } from "drizzle-orm";

export interface YachtDetailData {
  yacht: typeof yachtModels.$inferSelect;
  manufacturer: string;
  manufacturerLogoUrl: string | null;
  images: Array<{
    url: string;
    caption: string | null;
    altText: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  specsByGroup: Record<
    string,
    Array<{ category: string; value: number | string; unit?: string | null }>
  >;
  reviews: Array<{
    source: string | null;
    rating: number | null;
    summary: string | null;
    fullText: string | null;
    reviewDate: string | null;
    authorName: string | null;
    sourceUrl: string | null;
    reviewType: string | null;
    verified: boolean | null;
    ratingBreakdown: {
      build_quality: number | null;
      sailing_performance: number | null;
      comfort: number | null;
      value_for_money: number | null;
    } | null;
    pros: string[] | null;
    cons: string[] | null;
    helpfulCount: number | null;
  }>;
  mediaAssets: Array<{
    id: number;
    mediaType: string;
    title: string | null;
    description: string | null;
    url: string | null;
    embedUrl: string | null;
    thumbnailUrl: string | null;
    fileFormat: string | null;
  }>;
}

/**
 * Yacht listing item — lightweight for browse page SSR.
 */
export interface YachtListItem {
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
  description: string | null;
}

export interface YachtsListingResult {
  yachts: YachtListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FilterOptions {
  manufacturers: Array<{ id: number; name: string }>;
  rigTypes: string[];
  keelTypes: string[];
  hullMaterials: string[];
}

/**
 * Get paginated yacht listing for SSR.
 * Fetches the default view (no filters, page 1) so Google can index real yacht data.
 */
export async function getYachtsListing(page: number = 1, limit: number = 20): Promise<YachtsListingResult> {
  const offset = (page - 1) * limit;

  // Count total
  const [{ total }] = await db
    .select({ total: count() })
    .from(yachtModels);

  // Fetch page of yachts with manufacturer name
  const rows = await db
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
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .orderBy(yachtModels.id)
    .limit(limit)
    .offset(offset);

  // Convert numeric strings to numbers for the client
  const yachts: YachtListItem[] = rows.map((r: typeof rows[number]) => ({
    ...r,
    year: r.year ?? null,
    lengthOverall: r.lengthOverall !== null ? parseFloat(r.lengthOverall) : null,
    beam: r.beam !== null ? parseFloat(r.beam) : null,
    draft: r.draft !== null ? parseFloat(r.draft) : null,
    displacement: r.displacement !== null ? parseFloat(r.displacement) : null,
    ballast: r.ballast !== null ? parseFloat(r.ballast) : null,
    sailAreaMain: r.sailAreaMain !== null ? parseFloat(r.sailAreaMain) : null,
    engineHp: r.engineHp !== null ? parseFloat(r.engineHp) : null,
    fuelCapacity: r.fuelCapacity !== null ? parseFloat(r.fuelCapacity) : null,
    waterCapacity: r.waterCapacity !== null ? parseFloat(r.waterCapacity) : null,
  }));

  return {
    yachts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get filter options for the browse page sidebar.
 */
export async function getFilterOptions(): Promise<FilterOptions> {
  const [mfgRows, distinctRows] = await Promise.all([
    db.select({ id: manufacturers.id, name: manufacturers.name }).from(manufacturers).orderBy(manufacturers.name),
    db
      .select({
        rigType: yachtModels.rigType,
        keelType: yachtModels.keelType,
        hullMaterial: yachtModels.hullMaterial,
      })
      .from(yachtModels)
      .where(sql`${yachtModels.rigType} IS NOT NULL OR ${yachtModels.keelType} IS NOT NULL OR ${yachtModels.hullMaterial} IS NOT NULL`),
  ]);

  const rigTypes = [...new Set(distinctRows.map((r: typeof distinctRows[number]) => r.rigType).filter(Boolean))].sort() as string[];
  const keelTypes = [...new Set(distinctRows.map((r: typeof distinctRows[number]) => r.keelType).filter(Boolean))].sort() as string[];
  const hullMaterials = [...new Set(distinctRows.map((r: typeof distinctRows[number]) => r.hullMaterial).filter(Boolean))].sort() as string[];

  return {
    manufacturers: mfgRows,
    rigTypes,
    keelTypes,
    hullMaterials,
  };
}

/**
 * Get yacht detail data by slug with all related specs, images, and reviews.
 * Used by both yacht detail page and yacht detail API.
 */
export async function getYachtDetailData(slug: string): Promise<YachtDetailData | null> {
  // Find yacht by slug
  const yachtResult = await db
    .select({
      yacht: yachtModels,
      manufacturer: manufacturers.name,
      manufacturerLogoUrl: manufacturers.logoUrl,
    })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(eq(yachtModels.slug, slug))
    .limit(1);

  if (yachtResult.length === 0) return null;

  const { yacht, manufacturer, manufacturerLogoUrl } = yachtResult[0];

  // Fetch all spec values with category info
  const specs = await db
    .select({
      category: specCategories.name,
      valueText: specValues.valueText,
      valueNumeric: specValues.valueNumeric,
      unit: specCategories.unit,
      group: specCategories.categoryGroup,
      displayOrder: specCategories.displayOrder,
    })
    .from(specValues)
    .leftJoin(
      specCategories,
      eq(specValues.specCategoryId, specCategories.id),
    )
    .where(eq(specValues.yachtModelId, yacht.id))
    .orderBy(specCategories.displayOrder);

  // Group specs by categoryGroup, ensuring non-null values and category presence
  const specsByGroup: Record<
    string,
    Array<{ category: string; value: number | string; unit?: string | null }>
  > = {};
  for (const s of specs) {
    if (!s.category) continue;
    const group = s.group || "other";
    if (!specsByGroup[group]) specsByGroup[group] = [];

    // Skip if both valueNumeric and valueText are null
    if (s.valueNumeric === null && s.valueText === null) continue;

    const value: number | string =
      s.valueNumeric !== null ? s.valueNumeric : (s.valueText as string);
    specsByGroup[group].push({
      category: s.category,
      value,
      unit: s.unit ?? undefined,
    });
  }

  // Fetch images
  const yachtImages = await db
    .select()
    .from(images)
    .where(eq(images.yachtModelId, yacht.id))
    .orderBy(images.sortOrder);

  // Fetch reviews (optional)
  const yachtReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.yachtModelId, yacht.id))
    .orderBy(reviews.reviewDate);

  // Fetch media assets (P10.2)
  const yachtMedia = await db
    .select({
      id: mediaAssets.id,
      mediaType: mediaAssets.mediaType,
      title: mediaAssets.title,
      description: mediaAssets.description,
      url: mediaAssets.url,
      embedUrl: mediaAssets.embedUrl,
      thumbnailUrl: mediaAssets.thumbnailUrl,
      fileFormat: mediaAssets.fileFormat,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.yachtModelId, yacht.id))
    .orderBy(mediaAssets.sortOrder);

  return {
    yacht,
    manufacturer: manufacturer || "Unknown",
    manufacturerLogoUrl: manufacturerLogoUrl || null,
    images: yachtImages.map((img: typeof images.$inferSelect) => ({
      url: img.url,
      caption: img.caption,
      altText: img.altText,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
    specsByGroup,
    reviews: yachtReviews.map((rev: typeof reviews.$inferSelect) => ({
      source: rev.source,
      rating: rev.rating,
      summary: rev.summary,
      fullText: rev.fullText,
      reviewDate: rev.reviewDate,
      authorName: rev.authorName,
      sourceUrl: rev.sourceUrl,
      reviewType: (rev as any).reviewType ?? null,
      verified: (rev as any).verified ?? null,
      ratingBreakdown: (rev as any).ratingBreakdown ?? null,
      pros: (rev as any).pros ?? null,
      cons: (rev as any).cons ?? null,
      helpfulCount: (rev as any).helpfulCount ?? null,
    })),
    mediaAssets: yachtMedia.map((m: typeof yachtMedia[number]) => ({
      id: m.id as number,
      mediaType: m.mediaType as string,
      title: m.title as string | null,
      description: m.description as string | null,
      url: m.url as string | null,
      embedUrl: m.embedUrl as string | null,
      thumbnailUrl: m.thumbnailUrl as string | null,
      fileFormat: m.fileFormat as string | null,
    })),
  };
}

/**
 * Get primary image for a yacht.
 */
export async function getPrimaryImage(slug: string): Promise<string | null> {
  const yachtResult = await db
    .select({ id: yachtModels.id })
    .from(yachtModels)
    .where(eq(yachtModels.slug, slug))
    .limit(1);

  if (yachtResult.length === 0) return null;

  const yachtImages = await db
    .select()
    .from(images)
    .where(eq(images.yachtModelId, yachtResult[0].id))
    .orderBy(images.sortOrder);

  const primaryImage = yachtImages.find((img: typeof images.$inferSelect) => img.isPrimary) || yachtImages[0];
  return primaryImage?.url || null;
}
