import { NextResponse } from 'next/server';
import { edgePool } from '@/lib/edge-pool';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const mode = searchParams.get('mode') || 'full';

    if (!q || q.length < 2) {
      return NextResponse.json({ yachts: [], total: 0 });
    }

    const escapedQ = q.replace(/[%;_]/g, '\\$&');
    const like = `%${escapedQ}%`;
    const prefixLike = `${escapedQ}%`;

    if (mode === 'autocomplete') {
      const result = await edgePool.query(
        `SELECT y.id, y.model_name, y.slug, y.length_overall, y.year, m.name AS manufacturer_name
         FROM yacht_models y LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
         WHERE (y.model_name ILIKE $1 OR m.name ILIKE $1 OR CONCAT(m.name, ' ', y.model_name) ILIKE $1)
         ORDER BY CASE WHEN y.model_name ILIKE $2 THEN 0 WHEN m.name ILIKE $2 THEN 1 ELSE 2 END,
           y.length_overall DESC NULLS LAST
         LIMIT $3`,
        [like, prefixLike, limit],
      );

      const suggestions = result.rows.map((row: any) => ({
        id: row.id,
        modelName: row.model_name,
        manufacturer: row.manufacturer_name ?? '',
        slug: row.slug,
        year: row.year,
        lengthOverall: row.length_overall,
        display: row.manufacturer_name ? `${row.manufacturer_name} ${row.model_name}` : row.model_name,
      }));

      const response = NextResponse.json({ suggestions, query: q });
      response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      return response;
    }

    // Full search — run count + data in parallel
    const [countResult, dataResult] = await Promise.all([
      edgePool.query(
        `SELECT COUNT(*) as total FROM yacht_models y LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
         WHERE (y.model_name ILIKE $1 OR m.name ILIKE $1 OR CONCAT(m.name, ' ', y.model_name) ILIKE $1
           OR y.rig_type ILIKE $1 OR y.keel_type ILIKE $1 OR y.hull_material ILIKE $1
           OR y.design_notes ILIKE $1 OR y.description ILIKE $1)`,
        [like],
      ),
      edgePool.query(
        `SELECT y.id, y.model_name, y.year, y.slug, y.length_overall, y.beam, y.draft,
           y.displacement, y.ballast, y.sail_area_main, y.rig_type, y.keel_type, y.hull_material,
           y.cabins, y.berths, y.heads, y.max_occupancy, y.engine_hp, y.engine_type,
           y.fuel_capacity, y.water_capacity, y.design_notes, y.description, m.name AS manufacturer_name
         FROM yacht_models y LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
         WHERE (y.model_name ILIKE $1 OR m.name ILIKE $1 OR CONCAT(m.name, ' ', y.model_name) ILIKE $1
           OR y.rig_type ILIKE $1 OR y.keel_type ILIKE $1 OR y.hull_material ILIKE $1
           OR y.design_notes ILIKE $1 OR y.description ILIKE $1)
         ORDER BY CASE WHEN y.model_name ILIKE $2 THEN 0 WHEN m.name ILIKE $2 THEN 1 ELSE 2 END,
           y.length_overall DESC NULLS LAST
         LIMIT $3`,
        [like, prefixLike, limit],
      ),
    ]);

    const total = parseInt(countResult.rows[0]?.total || '0', 10);
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
    }));

    const response = NextResponse.json({ yachts, total, query: q });
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    );
  }
}
