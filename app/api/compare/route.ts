import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) {
      return NextResponse.json({ error: 'ids parameter required' }, { status: 400 });
    }
    const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400 });
    }
    if (ids.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 yachts allowed' }, { status: 400 });
    }

    // Build a query with IN clause using raw SQL
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const sqlQuery = `
      SELECT
        y.id,
        y.model_name,
        y.manufacturer_id,
        y.year,
        y.slug,
        y.length_overall,
        y.beam,
        y.draft,
        y.displacement,
        y.ballast,
        y.sail_area_main,
        y.rig_type,
        y.keel_type,
        y.hull_material,
        y.cabins,
        y.berths,
        y.heads,
        y.max_occupancy,
        y.engine_hp,
        y.engine_type,
        y.fuel_capacity,
        y.water_capacity,
        y.design_notes,
        y.description,
        y.source_url,
        y.source_attribution,
        y.admin_links,
        y.created_at,
        y.updated_at,
        m.name AS manufacturer_name
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      WHERE y.id IN (${placeholders})
    `;
    const result = await pool.query(sqlQuery, ids);
    const rows = result.rows as any[];

    // Map rows to DTO
    const yachts = rows.map(row => ({
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
      specsByGroup: {},
      images: [],
      reviews: [],
    }));

    return NextResponse.json({ yachts });
  } catch (error: any) {
    console.error('Compare API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compare data', details: error.message },
      { status: 500 }
    );
  }
}
