import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { checkRateLimit, getClientIp, rateLimitHeaders, DEFAULT_RATE_LIMIT } from '@/lib/rate-limit';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/yachts — List yachts with pagination, filtering, sorting.
 *
 * Query params:
 *   page (default 1), limit (default 20, max 100)
 *   sort (id|modelName|year|lengthOverall|beam|draft|displacement|cabins|berths)
 *   order (asc|desc)
 *   manufacturer — manufacturer name (partial match)
 *   manufacturerId — exact manufacturer ID
 *   rigType, keelType, hullMaterial — exact match
 *   lengthMin, lengthMax — LOA range in meters
 *   yearMin, yearMax — year range
 *   cabinsMin — minimum cabins
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return apiError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please slow down.', 429, { rateLimit: rl });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Sorting
    const sortMap: Record<string, string> = {
      id: 'y.id',
      modelName: 'y.model_name',
      year: 'y.year',
      lengthOverall: 'y.length_overall',
      beam: 'y.beam',
      draft: 'y.draft',
      displacement: 'y.displacement',
      cabins: 'y.cabins',
      berths: 'y.berths',
    };
    const sortKey = searchParams.get('sort') || 'id';
    const sortCol = sortMap[sortKey] || 'y.id';
    const sortOrder = searchParams.get('order')?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Build filters
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const manufacturer = searchParams.get('manufacturer');
    if (manufacturer) {
      conditions.push(`m.name ILIKE $${idx++}`);
      params.push(`%${manufacturer}%`);
    }

    const manufacturerId = searchParams.get('manufacturerId');
    if (manufacturerId) {
      const mid = parseInt(manufacturerId, 10);
      if (!isNaN(mid)) {
        conditions.push(`y.manufacturer_id = $${idx++}`);
        params.push(mid);
      }
    }

    const rigType = searchParams.get('rigType');
    if (rigType) {
      conditions.push(`y.rig_type = $${idx++}`);
      params.push(rigType);
    }

    const keelType = searchParams.get('keelType');
    if (keelType) {
      conditions.push(`y.keel_type = $${idx++}`);
      params.push(keelType);
    }

    const hullMaterial = searchParams.get('hullMaterial');
    if (hullMaterial) {
      conditions.push(`y.hull_material = $${idx++}`);
      params.push(hullMaterial);
    }

    const lengthMin = parseFloat(searchParams.get('lengthMin') || '');
    if (!isNaN(lengthMin)) {
      conditions.push(`y.length_overall >= $${idx++}`);
      params.push(lengthMin);
    }

    const lengthMax = parseFloat(searchParams.get('lengthMax') || '');
    if (!isNaN(lengthMax)) {
      conditions.push(`y.length_overall <= $${idx++}`);
      params.push(lengthMax);
    }

    const yearMin = parseInt(searchParams.get('yearMin') || '', 10);
    if (!isNaN(yearMin)) {
      conditions.push(`y.year >= $${idx++}`);
      params.push(yearMin);
    }

    const yearMax = parseInt(searchParams.get('yearMax') || '', 10);
    if (!isNaN(yearMax)) {
      conditions.push(`y.year <= $${idx++}`);
      params.push(yearMax);
    }

    const cabinsMin = parseInt(searchParams.get('cabinsMin') || '', 10);
    if (!isNaN(cabinsMin)) {
      conditions.push(`y.cabins >= $${idx++}`);
      params.push(cabinsMin);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count
    const countResult = await pool.query(
      `SELECT COUNT(*)::int as count FROM yacht_models y LEFT JOIN manufacturers m ON y.manufacturer_id = m.id ${where}`,
      params
    );
    const total = countResult.rows[0]?.count || 0;

    // Data
    const offset = (page - 1) * limit;
    const dataResult = await pool.query(
      `SELECT
        y.id, y.model_name, y.slug, y.year, y.manufacturer_id,
        y.length_overall, y.beam, y.draft, y.displacement, y.ballast,
        y.sail_area_main, y.rig_type, y.keel_type, y.hull_material,
        y.cabins, y.berths, y.heads, y.max_occupancy,
        y.engine_hp, y.engine_type, y.fuel_capacity, y.water_capacity,
        y.design_notes, y.description,
        m.name as manufacturer_name, m.country as manufacturer_country
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       ${where}
       ORDER BY ${sortCol} ${sortOrder} NULLS LAST
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    const yachts = dataResult.rows.map((row: any) => ({
      id: row.id,
      slug: row.slug ?? undefined,
      modelName: row.model_name,
      manufacturer: {
        id: row.manufacturer_id,
        name: row.manufacturer_name ?? '',
        country: row.manufacturer_country ?? undefined,
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
    }));

    return apiSuccess(yachts, {
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      rateLimit: rl,
    });
  } catch (error: any) {
    console.error('API v1 yachts error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch yachts', 500, { details: error.message, rateLimit: rl });
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
