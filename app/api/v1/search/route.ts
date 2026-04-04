import { pool } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/search?q=...&limit=N — Search yachts by name, manufacturer, rig type, keel type, hull material, description.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return apiError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded.', 429, { rateLimit: rl });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    if (!q || q.length < 2) {
      return apiError('INVALID_PARAM', 'Query parameter "q" must be at least 2 characters', 400, { rateLimit: rl });
    }

    const escapedQ = q.replace(/[%;_]/g, '\\$&');

    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       WHERE (
         y.model_name ILIKE $1
         OR m.name ILIKE $1
         OR CONCAT(m.name, ' ', y.model_name) ILIKE $1
         OR y.rig_type ILIKE $1
         OR y.keel_type ILIKE $1
         OR y.hull_material ILIKE $1
         OR y.description ILIKE $1
       )`,
      [`%${escapedQ}%`]
    );
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    const dataResult = await pool.query(
      `SELECT
        y.id, y.model_name, y.slug, y.year,
        y.length_overall, y.beam, y.draft, y.displacement,
        y.rig_type, y.keel_type, y.hull_material,
        y.cabins, y.berths,
        m.name as manufacturer_name, m.country as manufacturer_country
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       WHERE (
         y.model_name ILIKE $1
         OR m.name ILIKE $1
         OR CONCAT(m.name, ' ', y.model_name) ILIKE $1
         OR y.rig_type ILIKE $1
         OR y.keel_type ILIKE $1
         OR y.hull_material ILIKE $1
         OR y.description ILIKE $1
       )
       ORDER BY
         CASE
           WHEN y.model_name ILIKE $2 THEN 0
           WHEN m.name ILIKE $2 THEN 1
           ELSE 2
         END,
         y.length_overall DESC NULLS LAST
       LIMIT $3`,
      [`%${escapedQ}%`, `${escapedQ}%`, limit]
    );

    const yachts = dataResult.rows.map((row: any) => ({
      id: row.id,
      slug: row.slug ?? undefined,
      modelName: row.model_name,
      manufacturer: {
        id: row.manufacturer_id ?? undefined,
        name: row.manufacturer_name ?? '',
        country: row.manufacturer_country ?? undefined,
      },
      year: row.year ?? undefined,
      lengthOverall: row.length_overall != null ? parseFloat(row.length_overall) : undefined,
      beam: row.beam != null ? parseFloat(row.beam) : undefined,
      draft: row.draft != null ? parseFloat(row.draft) : undefined,
      displacement: row.displacement != null ? parseFloat(row.displacement) : undefined,
      rigType: row.rig_type ?? undefined,
      keelType: row.keel_type ?? undefined,
      hullMaterial: row.hull_material ?? undefined,
      cabins: row.cabins ?? undefined,
      berths: row.berths ?? undefined,
    }));

    return apiSuccess(yachts, {
      meta: { total, limit },
      rateLimit: rl,
    });
  } catch (error: any) {
    console.error('API v1 search error:', error);
    return apiError('INTERNAL_ERROR', 'Search failed', 500, { details: error.message, rateLimit: rl });
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
