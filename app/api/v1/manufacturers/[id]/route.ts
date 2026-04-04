import { pool } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/manufacturers/[id] — Single manufacturer with its yachts.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return apiError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded.', 429, { rateLimit: rl });
  }

  try {
    const manufacturerId = parseInt(params.id, 10);
    if (isNaN(manufacturerId)) {
      return apiError('INVALID_PARAM', 'Manufacturer ID must be a number', 400, { rateLimit: rl });
    }

    const mfrResult = await pool.query(
      `SELECT id, name, country, founded_year, website_url, description, logo_url
       FROM manufacturers WHERE id = $1`,
      [manufacturerId]
    );

    if (mfrResult.rows.length === 0) {
      return apiError('NOT_FOUND', `Manufacturer with ID ${manufacturerId} not found`, 404, { rateLimit: rl });
    }

    const mfr = mfrResult.rows[0];

    const yachtsResult = await pool.query(
      `SELECT id, model_name, slug, year, length_overall, beam, draft, displacement,
        rig_type, keel_type, hull_material, cabins, berths
       FROM yacht_models
       WHERE manufacturer_id = $1
       ORDER BY length_overall DESC NULLS LAST`,
      [manufacturerId]
    );

    const manufacturer = {
      id: mfr.id,
      name: mfr.name,
      country: mfr.country ?? undefined,
      foundedYear: mfr.founded_year ?? undefined,
      website: mfr.website_url ?? undefined,
      description: mfr.description ?? undefined,
      logoUrl: mfr.logo_url ?? undefined,
      yachts: yachtsResult.rows.map((row: any) => ({
        id: row.id,
        modelName: row.model_name,
        slug: row.slug ?? undefined,
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
      })),
    };

    return apiSuccess(manufacturer, { rateLimit: rl });
  } catch (error: any) {
    console.error('API v1 manufacturer detail error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch manufacturer', 500, { details: error.message, rateLimit: rl });
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
