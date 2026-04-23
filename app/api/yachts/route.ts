import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cached, CACHE_TTL, CACHE_TAGS } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

// ─── Lightweight field sets ──────────────────────────────────────────
const LIST_FIELDS = 'y.id, y.model_name, y.slug, y.year, y.length_overall, y.beam, y.draft, y.displacement, y.rig_type, y.keel_type, y.hull_material, y.cabins, y.manufacturer_id, m.name as manufacturer_name';
const ALL_FIELDS = 'y.*, m.name as manufacturer_name';

// ─── Cached: distinct filter options (changes rarely) ────────────────
const getCachedFilterOptions = cached(
  async () => {
    const result = await pool.query(
      `SELECT DISTINCT rig_type, keel_type, hull_material FROM yacht_models WHERE rig_type IS NOT NULL OR keel_type IS NOT NULL OR hull_material IS NOT NULL`
    );
    return {
      rigTypes: [...new Set(result.rows.map((r: any) => r.rig_type).filter(Boolean))].sort(),
      keelTypes: [...new Set(result.rows.map((r: any) => r.keel_type).filter(Boolean))].sort(),
      hullMaterials: [...new Set(result.rows.map((r: any) => r.hull_material).filter(Boolean))].sort(),
    };
  },
  ['yachts-filter-options'],
  [CACHE_TAGS.FILTER_OPTIONS, CACHE_TAGS.YACHTS],
  CACHE_TTL.FILTER_OPTIONS,
);

// ─── Cached: yacht list query ────────────────────────────────────────
function getCachedYachts(
  whereClause: string,
  params: any[],
  safeSort: string,
  sortOrder: string,
  limit: number,
  offset: number,
  fields: string,
  cacheKey: string,
) {
  return cached(
    async (
      _where: string,
      _params: any[],
      _sort: string,
      _order: string,
      _limit: number,
      _offset: number,
      _fields: string,
    ) => {
      const [countResult, dataResult] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int as count FROM yacht_models y ${_where}`, _params),
        pool.query(
          `SELECT ${_fields} FROM yacht_models y LEFT JOIN manufacturers m ON y.manufacturer_id = m.id ${_where} ORDER BY y.${_sort} ${_order} LIMIT $${_params.length + 1} OFFSET $${_params.length + 2}`,
          [..._params, _limit, _offset],
        ),
      ]);

      const total = countResult.rows[0]?.count || 0;
      return { rows: dataResult.rows, total };
    },
    [cacheKey],
    [CACHE_TAGS.YACHTS],
    CACHE_TTL.YACHT_LIST,
  )(whereClause, params, safeSort, sortOrder, limit, offset, fields);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = searchParams.get('sort') || 'id';
    const sortOrder = searchParams.get('order') === 'desc' ? 'DESC' : 'ASC';
    const view = searchParams.get('view') || 'full'; // 'list' for lighter payload

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    const manufacturerFilter = searchParams.getAll('filters[manufacturers]').map(Number).filter(Boolean);
    if (manufacturerFilter.length > 0) {
      const placeholders = manufacturerFilter.map(() => `$${paramIdx++}`).join(',');
      conditions.push(`y.manufacturer_id IN (${placeholders})`);
      params.push(...manufacturerFilter);
    }

    if (searchParams.get('filters[rigType]')) {
      conditions.push(`y.rig_type = $${paramIdx++}`);
      params.push(searchParams.get('filters[rigType]'));
    }
    if (searchParams.get('filters[keelType]')) {
      conditions.push(`y.keel_type = $${paramIdx++}`);
      params.push(searchParams.get('filters[keelType]'));
    }
    if (searchParams.get('filters[hullMaterial]')) {
      conditions.push(`y.hull_material = $${paramIdx++}`);
      params.push(searchParams.get('filters[hullMaterial]'));
    }

    const lengthMin = parseFloat(searchParams.get('filters[lengthMin]') || '');
    if (!isNaN(lengthMin)) {
      conditions.push(`y.length_overall >= $${paramIdx++}`);
      params.push(lengthMin);
    }
    const lengthMax = parseFloat(searchParams.get('filters[lengthMax]') || '');
    if (!isNaN(lengthMax)) {
      conditions.push(`y.length_overall <= $${paramIdx++}`);
      params.push(lengthMax);
    }
    const displacementMin = parseFloat(searchParams.get('filters[displacementMin]') || '');
    if (!isNaN(displacementMin)) {
      conditions.push(`y.displacement >= $${paramIdx++}`);
      params.push(displacementMin);
    }
    const displacementMax = parseFloat(searchParams.get('filters[displacementMax]') || '');
    if (!isNaN(displacementMax)) {
      conditions.push(`y.displacement <= $${paramIdx++}`);
      params.push(displacementMax);
    }
    const cabinsMin = parseInt(searchParams.get('filters[cabinsMin]') || '', 10);
    if (!isNaN(cabinsMin)) {
      conditions.push(`y.cabins >= $${paramIdx++}`);
      params.push(cabinsMin);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const allowedSorts = ['id', 'model_name', 'year', 'length_overall', 'beam', 'draft', 'displacement', 'ballast', 'sail_area_main', 'cabins', 'berths', 'heads', 'engine_hp'];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'id';

    const offset = (page - 1) * limit;
    const fields = view === 'list' ? LIST_FIELDS : ALL_FIELDS;

    // Generate deterministic cache key from all inputs
    const cacheKey = `yachts-${whereClause}-${params.join(',')}-${safeSort}-${sortOrder}-${limit}-${offset}-${view}`;

    // Run data query + filter options in parallel (both cached)
    const [dataResult, distinct] = await Promise.all([
      getCachedYachts(whereClause, params, safeSort, sortOrder, limit, offset, fields, cacheKey),
      getCachedFilterOptions(),
    ]);

    const { rows, total } = dataResult;

    // Map results — use lighter mapping for list view
    const yachts = rows.map((row: any) => view === 'list' ? {
      id: row.id,
      manufacturer: row.manufacturer_name ?? '',
      modelName: row.model_name,
      year: row.year ?? undefined,
      slug: row.slug ?? undefined,
      lengthOverall: row.length_overall ?? undefined,
      beam: row.beam ?? undefined,
      draft: row.draft ?? undefined,
      displacement: row.displacement ?? undefined,
      rigType: row.rig_type ?? undefined,
      keelType: row.keel_type ?? undefined,
      hullMaterial: row.hull_material ?? undefined,
      cabins: row.cabins ?? undefined,
    } : {
      id: row.id,
      manufacturer: row.manufacturer_name ?? '',
      modelName: row.model_name,
      year: row.year ?? undefined,
      slug: row.slug ?? undefined,
      lengthOverall: row.length_overall ?? undefined,
      beam: row.beam ?? undefined,
      draft: row.draft ?? undefined,
      displacement: row.displacement ?? undefined,
      ballast: row.ballast ?? undefined,
      sailAreaMain: row.sail_area_main ?? undefined,
      rigType: row.rig_type ?? undefined,
      keelType: row.keel_type ?? undefined,
      hullMaterial: row.hull_material ?? undefined,
      cabins: row.cabins ?? undefined,
      berths: row.berths ?? undefined,
      heads: row.heads ?? undefined,
      maxOccupancy: row.max_occupancy ?? undefined,
      engineHp: row.engine_hp ?? undefined,
      engineType: row.engine_type ?? undefined,
      fuelCapacity: row.fuel_capacity ?? undefined,
      waterCapacity: row.water_capacity ?? undefined,
      designNotes: row.design_notes ?? undefined,
      description: row.description ?? undefined,
      sourceUrl: row.source_url ?? undefined,
      sourceAttribution: row.source_attribution ?? undefined,
      adminLinks: row.admin_links ?? undefined,
      createdAt: row.created_at ?? undefined,
      updatedAt: row.updated_at ?? undefined,
    });

    // Set cache headers for CDN/Vercel edge
    const response = NextResponse.json({
      yachts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      distinct,
    });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error: any) {
    console.error('Yachts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch yachts', details: error.message },
      { status: 500 }
    );
  }
}
