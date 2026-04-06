import { db, yachtModels, manufacturers, images, reviews, specValues, specCategories } from "@/lib/db";
import { eq, inArray, desc, asc } from "drizzle-orm";

export interface YachtDetailData {
  yacht: typeof yachtModels.$inferSelect;
  manufacturer: string;
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
  }>;
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
    })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(eq(yachtModels.slug, slug))
    .limit(1);

  if (yachtResult.length === 0) return null;

  const { yacht, manufacturer } = yachtResult[0];

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

  return {
    yacht,
    manufacturer: manufacturer || "Unknown",
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
