import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = searchParams.get('sort') || 'id';
    const sortOrder = searchParams.get('order') === 'desc' ? 'DESC' : 'ASC';

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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countResult = await pool.query(`SELECT COUNT(*)::int as count FROM yacht_models y ${whereClause}`, params);
    const total = countResult.rows[0]?.count || 0;

    // Validate sort column to prevent SQL injection
    const allowedSorts = ['id', 'model_name', 'year', 'length_overall', 'beam', 'draft', 'displacement', 'ballast', 'sail_area_main', 'cabins', 'berths', 'heads', 'engine_hp'];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'id';

    // Data query
    const offset = (page - 1) * limit;
    const dataResult = await pool.query(
      `SELECT y.*, m.name as manufacturer_name
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       ${whereClause}
       ORDER BY y.${safeSort} ${sortOrder}
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    // Distinct values query
    const distinctResult = await pool.query(
      `SELECT DISTINCT rig_type, keel_type, hull_material FROM yacht_models WHERE rig_type IS NOT NULL OR keel_type IS NOT NULL OR hull_material IS NOT NULL`
    );
    const distinct = {
      rigTypes: [...new Set(distinctResult.rows.map((r: any) => r.rig_type).filter(Boolean))].sort(),
      keelTypes: [...new Set(distinctResult.rows.map((r: any) => r.keel_type).filter(Boolean))].sort(),
      hullMaterials: [...new Set(distinctResult.rows.map((r: any) => r.hull_material).filter(Boolean))].sort(),
    };

    // Map results
    const yachts = dataResult.rows.map((row: any) => ({
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
    }));

    return NextResponse.json({
      yachts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      distinct,
    });
  } catch (error: any) {
    console.error('Yachts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch yachts', details: error.message },
      { status: 500 }
    );
  }
}
