import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cached, CACHE_TTL, CACHE_TAGS } from '@/lib/api-cache';
import { assignUseCaseTags, type UseCaseTagId } from '@/lib/use-case-tags';

export const dynamic = 'force-dynamic';

// ─── Lightweight field sets ──────────────────────────────────────────
const LIST_FIELDS = 'y.id, y.model_name, y.slug, y.year, y.length_overall, y.beam, y.draft, y.displacement, y.rig_type, y.keel_type, y.hull_material, y.cabins, y.manufacturer_id, m.name as manufacturer_name';
const ALL_FIELDS = 'y.*, m.name as manufacturer_name';

// ─── Fields needed for tag computation (used when useCase filter active) ──
const TAG_FIELDS = 'y.id, y.model_name, y.slug, y.year, y.length_overall, y.beam, y.draft, y.displacement, y.ballast, y.sail_area_main, y.rig_type, y.keel_type, y.hull_material, y.cabins, y.berths, y.manufacturer_id, m.name as manufacturer_name';

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

// ─── Helper: parse a numeric range filter ────────────────────────────
function addRangeFilter(
  searchParams: URLSearchParams,
  paramMin: string,
  paramMax: string,
  column: string,
  conditions: string[],
  params: any[],
  paramIdx: { value: number },
  parse: 'float' | 'int' = 'float',
) {
  const minVal = parse === 'int'
    ? parseInt(searchParams.get(paramMin) || '', 10)
    : parseFloat(searchParams.get(paramMin) || '');
  if (!isNaN(minVal as number)) {
    conditions.push(`${column} >= $${paramIdx.value++}`);
    params.push(minVal);
  }
  const maxVal = parse === 'int'
    ? parseInt(searchParams.get(paramMax) || '', 10)
    : parseFloat(searchParams.get(paramMax) || '');
  if (!isNaN(maxVal as number)) {
    conditions.push(`${column} <= $${paramIdx.value++}`);
    params.push(maxVal);
  }
}

// ─── Compute tags for a DB row ───────────────────────────────────────
function computeTagsForRow(row: any): UseCaseTagId[] {
  return assignUseCaseTags({
    lengthOverall: row.length_overall ?? null,
    beam: row.beam ?? null,
    draft: row.draft ?? null,
    displacement: row.displacement ?? null,
    ballast: row.ballast ?? null,
    sailAreaMain: row.sail_area_main ?? null,
    cabins: row.cabins ?? null,
    berths: row.berths ?? null,
    rigType: row.rig_type ?? null,
    keelType: row.keel_type ?? null,
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = searchParams.get('sort') || 'id';
    const sortOrder = searchParams.get('order') === 'desc' ? 'DESC' : 'ASC';
    const view = searchParams.get('view') || 'full'; // 'list' for lighter payload

    // Use-case tag filter (computed in memory from spec heuristics)
    const useCaseFilter = searchParams.get('filters[useCase]') as UseCaseTagId | null;
    const validUseCaseFilter = useCaseFilter && ['bluewater-cruiser', 'weekend-sailor', 'racing', 'liveaboard', 'family-cruiser', 'light-wind-performer'].includes(useCaseFilter) ? useCaseFilter : null;

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: any[] = [];
    const paramIdx = { value: 1 };

    const manufacturerFilter = searchParams.getAll('filters[manufacturers]').map(Number).filter(Boolean);
    if (manufacturerFilter.length > 0) {
      const placeholders = manufacturerFilter.map(() => `$${paramIdx.value++}`).join(',');
      conditions.push(`y.manufacturer_id IN (${placeholders})`);
      params.push(...manufacturerFilter);
    }

    if (searchParams.get('filters[rigType]')) {
      conditions.push(`y.rig_type = $${paramIdx.value++}`);
      params.push(searchParams.get('filters[rigType]'));
    }
    if (searchParams.get('filters[keelType]')) {
      conditions.push(`y.keel_type = $${paramIdx.value++}`);
      params.push(searchParams.get('filters[keelType]'));
    }
    if (searchParams.get('filters[hullMaterial]')) {
      conditions.push(`y.hull_material = $${paramIdx.value++}`);
      params.push(searchParams.get('filters[hullMaterial]'));
    }

    // Range filters
    addRangeFilter(searchParams, 'filters[lengthMin]', 'filters[lengthMax]', 'y.length_overall', conditions, params, paramIdx);
    addRangeFilter(searchParams, 'filters[beamMin]', 'filters[beamMax]', 'y.beam', conditions, params, paramIdx);
    addRangeFilter(searchParams, 'filters[draftMin]', 'filters[draftMax]', 'y.draft', conditions, params, paramIdx);
    addRangeFilter(searchParams, 'filters[displacementMin]', 'filters[displacementMax]', 'y.displacement', conditions, params, paramIdx);
    addRangeFilter(searchParams, 'filters[sailAreaMin]', 'filters[sailAreaMax]', 'y.sail_area_main', conditions, params, paramIdx);
    addRangeFilter(searchParams, 'filters[cabinsMin]', 'filters[cabinsMax]', 'y.cabins', conditions, params, paramIdx, 'int');
    addRangeFilter(searchParams, 'filters[berthsMin]', 'filters[berthsMax]', 'y.berths', conditions, params, paramIdx, 'int');

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const allowedSorts = ['id', 'model_name', 'year', 'length_overall', 'beam', 'draft', 'displacement', 'ballast', 'sail_area_main', 'cabins', 'berths', 'heads', 'engine_hp'];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'id';

    // When useCase filter is active, we need to fetch all matching rows,
    // compute tags, filter in memory, then paginate.
    if (validUseCaseFilter) {
      // Fetch all rows matching other criteria (no LIMIT/OFFSET)
      const fields = TAG_FIELDS;
      const [dataResult, distinct] = await Promise.all([
        pool.query(
          `SELECT ${fields} FROM yacht_models y LEFT JOIN manufacturers m ON y.manufacturer_id = m.id ${whereClause} ORDER BY y.${safeSort} ${sortOrder}`,
          params,
        ),
        getCachedFilterOptions(),
      ]);

      // Compute tags and filter
      const tagged = dataResult.rows.map((row: any) => ({
        row,
        tags: computeTagsForRow(row),
      })).filter(item => item.tags.includes(validUseCaseFilter));

      const total = tagged.length;
      const offset = (page - 1) * limit;
      const paged = tagged.slice(offset, offset + limit);

      // Map to response shape (always use full mapping since we fetched TAG_FIELDS)
      const yachts = paged.map(({ row, tags }) => ({
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
        useCaseTags: tags,
      }));

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
    }

    // ── Normal path (no useCase filter) ──
    const offset = (page - 1) * limit;
    const fields = view === 'list' ? LIST_FIELDS : ALL_FIELDS;

    // Run count + data + filter options in parallel
    const [countResult, dataResult, distinct] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int as count FROM yacht_models y ${whereClause}`, params),
      pool.query(
        `SELECT ${fields} FROM yacht_models y LEFT JOIN manufacturers m ON y.manufacturer_id = m.id ${whereClause} ORDER BY y.${safeSort} ${sortOrder} LIMIT $${paramIdx.value++} OFFSET $${paramIdx.value++}`,
        [...params, limit, offset],
      ),
      getCachedFilterOptions(),
    ]);

    const total = countResult.rows[0]?.count || 0;

    // Map results — use lighter mapping for list view
    const yachts = dataResult.rows.map((row: any) => view === 'list' ? {
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
