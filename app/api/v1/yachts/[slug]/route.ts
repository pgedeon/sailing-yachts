import { pool } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/yachts/[slug] — Single yacht by slug.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return apiError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded.', 429, { rateLimit: rl });
  }

  try {
    const { slug } = params;

    const result = await pool.query(
      `SELECT
        y.*,
        m.name as manufacturer_name, m.country as manufacturer_country,
        m.website_url as manufacturer_website, m.description as manufacturer_description
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       WHERE y.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return apiError('NOT_FOUND', `Yacht with slug '${slug}' not found`, 404, { rateLimit: rl });
    }

    const row = result.rows[0];

    // Fetch images
    const imagesResult = await pool.query(
      `SELECT id, url, caption, alt_text, is_primary, sort_order FROM images WHERE yacht_model_id = $1 ORDER BY sort_order, id`,
      [row.id]
    );

    // Fetch reviews
    const reviewsResult = await pool.query(
      `SELECT id, source, rating, summary, author_name, review_date, source_url
       FROM reviews WHERE yacht_model_id = $1 AND rating IS NOT NULL
       ORDER BY review_date DESC NULLS LAST`,
      [row.id]
    );

    const yacht = {
      id: row.id,
      slug: row.slug ?? undefined,
      modelName: row.model_name,
      manufacturer: {
        id: row.manufacturer_id,
        name: row.manufacturer_name ?? '',
        country: row.manufacturer_country ?? undefined,
        website: row.manufacturer_website ?? undefined,
        description: row.manufacturer_description ?? undefined,
      },
      year: row.year ?? undefined,
      lengthOverall: row.length_overall != null ? parseFloat(row.length_overall) : undefined,
      beam: row.beam != null ? parseFloat(row.beam) : undefined,
      draft: row.draft != null ? parseFloat(row.draft) : undefined,
      displacement: row.displacement != null ? parseFloat(row.displacement) : undefined,
      ballast: row.ballast != null ? parseFloat(row.ballast) : undefined,
      sailAreaMain: row.sail_area_main != null ? parseFloat(row.sail_area_main) : undefined,
      rigType: row.rig_type ?? undefined,
      keelType: row.keel_type ?? undefined,
      hullMaterial: row.hull_material ?? undefined,
      cabins: row.cabins ?? undefined,
      berths: row.berths ?? undefined,
      heads: row.heads ?? undefined,
      maxOccupancy: row.max_occupancy ?? undefined,
      engineHp: row.engine_hp != null ? parseFloat(row.engine_hp) : undefined,
      engineType: row.engine_type ?? undefined,
      fuelCapacity: row.fuel_capacity != null ? parseFloat(row.fuel_capacity) : undefined,
      waterCapacity: row.water_capacity != null ? parseFloat(row.water_capacity) : undefined,
      designNotes: row.design_notes ?? undefined,
      description: row.description ?? undefined,
      images: imagesResult.rows.map((img: any) => ({
        url: img.url,
        caption: img.caption ?? undefined,
        alt: img.alt_text ?? undefined,
        isPrimary: img.is_primary ?? false,
      })),
      reviews: reviewsResult.rows.map((rev: any) => ({
        source: rev.source ?? undefined,
        rating: rev.rating != null ? parseFloat(rev.rating) : undefined,
        summary: rev.summary ?? undefined,
        author: rev.author_name ?? undefined,
        date: rev.review_date ?? undefined,
      })),
    };

    return apiSuccess(yacht, { rateLimit: rl });
  } catch (error: any) {
    console.error('API v1 yacht detail error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch yacht', 500, { details: error.message, rateLimit: rl });
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
