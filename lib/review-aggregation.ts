import { pool } from '@/lib/db';

export interface ReviewSourceAggregation {
  sourceId: number;
  sourceName: string;
  sourceSlug: string;
  sourceType: string;
  sourceLogoUrl: string | null;
  sourceWebsiteUrl: string | null;
  credibilityScore: number;
  reviewCount: number;
  averageRating: number;
  latestReviewDate: string | null;
}

export interface YachtReviewAggregation {
  overallAverage: number;
  totalReviewCount: number;
  sourceCount: number;
  bySource: ReviewSourceAggregation[];
  unassignedCount: number;
}

/**
 * Get aggregated review data for a yacht, grouped by review source.
 */
export async function getYachtReviewAggregation(yachtModelId: number): Promise<YachtReviewAggregation> {
  const result = await pool.query(
    `SELECT
       rs.id as source_id,
       rs.name as source_name,
       rs.slug as source_slug,
       rs.source_type,
       rs.logo_url as source_logo_url,
       rs.website_url as source_website_url,
       COALESCE(rs.credibility_score, 50) as credibility_score,
       COUNT(r.id)::int as review_count,
       AVG(r.rating::numeric) as avg_rating,
       MAX(r.review_date) as latest_review_date
     FROM review_sources rs
     INNER JOIN reviews r ON r.review_source_id = rs.id
     WHERE r.yacht_model_id = $1 AND r.rating IS NOT NULL
     GROUP BY rs.id, rs.name, rs.slug, rs.source_type, rs.logo_url, rs.website_url, rs.credibility_score
     ORDER BY credibility_score DESC, review_count DESC`,
    [yachtModelId]
  );

  // Count reviews without a source
  const unassigned = await pool.query(
    `SELECT COUNT(*)::int as cnt, AVG(rating::numeric) as avg
     FROM reviews
     WHERE yacht_model_id = $1 AND rating IS NOT NULL AND review_source_id IS NULL`,
    [yachtModelId]
  );

  const bySource: ReviewSourceAggregation[] = result.rows.map(row => ({
    sourceId: Number(row.source_id),
    sourceName: row.source_name,
    sourceSlug: row.source_slug,
    sourceType: row.source_type,
    sourceLogoUrl: row.source_logo_url,
    sourceWebsiteUrl: row.source_website_url,
    credibilityScore: Number(row.credibility_score),
    reviewCount: Number(row.review_count),
    averageRating: row.avg_rating ? Math.round(Number(row.avg_rating) * 10) / 10 : 0,
    latestReviewDate: row.latest_review_date,
  }));

  const unassignedCount = Number(unassigned.rows[0]?.cnt ?? 0);
  const totalReviewCount = bySource.reduce((sum, s) => sum + s.reviewCount, 0) + unassignedCount;

  // Weighted average based on credibility scores
  let weightedSum = 0;
  let weightedDivisor = 0;
  for (const source of bySource) {
    weightedSum += source.averageRating * source.reviewCount * source.credibilityScore;
    weightedDivisor += source.reviewCount * source.credibilityScore;
  }

  const overallAverage = weightedDivisor > 0
    ? Math.round((weightedSum / weightedDivisor) * 10) / 10
    : 0;

  return {
    overallAverage,
    totalReviewCount,
    sourceCount: bySource.length,
    bySource,
    unassignedCount,
  };
}

/**
 * Get all active review sources for admin dropdowns.
 */
export async function getActiveReviewSources() {
  const result = await pool.query(
    `SELECT id, name, slug, source_type, credibility_score
     FROM review_sources
     WHERE is_active = true
     ORDER BY name`
  );
  return result.rows.map(row => ({
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    sourceType: row.source_type,
    credibilityScore: Number(row.credibility_score ?? 50),
  }));
}

/**
 * Batch import reviews from CSV-like data.
 */
export async function batchImportReviews(
  reviews: Array<{
    yachtModelId: number;
    reviewSourceId?: number;
    source?: string;
    rating: number;
    summary?: string;
    fullText?: string;
    authorName?: string;
    sourceUrl?: string;
    reviewDate?: string;
    reviewType?: string;
    pros?: string[];
    cons?: string[];
  }>
): Promise<{ imported: number; errors: number }> {
  let imported = 0;
  let errors = 0;

  for (const review of reviews) {
    try {
      await pool.query(
        `INSERT INTO reviews (
          yacht_model_id, review_source_id, source, rating, summary, full_text,
          author_name, source_url, review_date, review_type, pros, cons, verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)`,
        [
          review.yachtModelId,
          review.reviewSourceId ?? null,
          review.source ?? 'import',
          String(review.rating),
          review.summary ?? null,
          review.fullText ?? null,
          review.authorName ?? null,
          review.sourceUrl ?? null,
          review.reviewDate ?? null,
          review.reviewType ?? 'expert',
          review.pros ?? [],
          review.cons ?? [],
        ]
      );
      imported++;
    } catch {
      errors++;
    }
  }

  return { imported, errors };
}
