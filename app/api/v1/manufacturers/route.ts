import { pool } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/manufacturers — List all manufacturers.
 * Optional query: country (exact match), name (partial match)
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return apiError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded.', 429, { rateLimit: rl });
  }

  try {
    const { searchParams } = new URL(request.url);
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const country = searchParams.get('country');
    if (country) {
      conditions.push(`m.country = $${idx++}`);
      params.push(country);
    }

    const name = searchParams.get('name');
    if (name) {
      conditions.push(`m.name ILIKE $${idx++}`);
      params.push(`%${name}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT m.id, m.name, m.country, m.founded_year, m.website_url, m.description,
        (SELECT COUNT(*)::int FROM yacht_models y WHERE y.manufacturer_id = m.id) as yacht_count
       FROM manufacturers m
       ${where}
       ORDER BY m.name`,
      params
    );

    const manufacturers = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      country: row.country ?? undefined,
      foundedYear: row.founded_year ?? undefined,
      website: row.website_url ?? undefined,
      description: row.description ?? undefined,
      yachtCount: row.yacht_count,
    }));

    return apiSuccess(manufacturers, { rateLimit: rl });
  } catch (error: any) {
    console.error('API v1 manufacturers error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch manufacturers', 500, { details: error.message, rateLimit: rl });
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
