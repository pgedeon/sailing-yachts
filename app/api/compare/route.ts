import { NextResponse } from "next/server";
import { edgePool } from "@/lib/edge-pool";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface SpecValue {
  specCategoryId: number;
  categoryName: string;
  categoryGroup: string;
  unit: string | null;
  dataType: string | null;
  valueText: string | null;
  valueNumeric: number | null;
}

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
    if (ids.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 yachts allowed' }, { status: 400 });
    }
    if (ids.length < 2) {
      return NextResponse.json({ error: 'Minimum 2 yachts required' }, { status: 400 });
    }

    // Fetch yacht base data
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const yachtQuery = `
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
    const yachtResult = await edgePool.query(yachtQuery, ids);
    const rows = yachtResult.rows as any[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No yachts found' }, { status: 404 });
    }

    // Fetch spec_values for these yachts
    const specPlaceholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const specQuery = `
      SELECT
        sv.yacht_model_id,
        sv.value_text,
        sv.value_numeric,
        sc.id AS spec_category_id,
        sc.name AS category_name,
        sc.category_group,
        sc.unit,
        sc.data_type
      FROM spec_values sv
      JOIN spec_categories sc ON sv.spec_category_id = sc.id
      WHERE sv.yacht_model_id IN (${specPlaceholders})
      ORDER BY sc.category_group, sc.name
    `;
    const specResult = await edgePool.query(specQuery, ids);
    const specRows = specResult.rows as any[];

    // Group specs by yacht id
    const specsByYacht: Record<number, SpecValue[]> = {};
    for (const sr of specRows) {
      const yachtId = sr.yacht_model_id;
      if (!specsByYacht[yachtId]) specsByYacht[yachtId] = [];
      specsByYacht[yachtId].push({
        specCategoryId: sr.spec_category_id,
        categoryName: sr.category_name,
        categoryGroup: sr.category_group || 'Other',
        unit: sr.unit,
        dataType: sr.data_type,
        valueText: sr.value_text,
        valueNumeric: sr.value_numeric ? Number(sr.value_numeric) : null,
      });
    }

    // Map rows to DTO
    const yachts = rows.map(row => ({
      id: row.id,
      manufacturer: row.manufacturer_name ?? '',
      modelName: row.model_name,
      year: row.year ?? undefined,
      slug: row.slug ?? undefined,
      lengthOverall: row.length_overall ? Number(row.length_overall) : undefined,
      beam: row.beam ? Number(row.beam) : undefined,
      draft: row.draft ? Number(row.draft) : undefined,
      displacement: row.displacement ? Number(row.displacement) : undefined,
      ballast: row.ballast ? Number(row.ballast) : undefined,
      sailAreaMain: row.sail_area_main ? Number(row.sail_area_main) : undefined,
      rigType: row.rig_type ?? undefined,
      keelType: row.keel_type ?? undefined,
      hullMaterial: row.hull_material ?? undefined,
      cabins: row.cabins ?? undefined,
      berths: row.berths ?? undefined,
      heads: row.heads ?? undefined,
      maxOccupancy: row.max_occupancy ?? undefined,
      engineHp: row.engine_hp ? Number(row.engine_hp) : undefined,
      engineType: row.engine_type ?? undefined,
      fuelCapacity: row.fuel_capacity ? Number(row.fuel_capacity) : undefined,
      waterCapacity: row.water_capacity ? Number(row.water_capacity) : undefined,
      designNotes: row.design_notes ?? undefined,
      description: row.description ?? undefined,
      sourceUrl: row.source_url ?? undefined,
      sourceAttribution: row.source_attribution ?? undefined,
      adminLinks: row.admin_links ?? undefined,
      createdAt: row.created_at ?? undefined,
      updatedAt: row.updated_at ?? undefined,
      specsByGroup: buildSpecGroups(specsByYacht[row.id] || []),
      images: [],
      reviews: [],
    }));

    // Note: recordCompareUsage (FAQ harvesting) uses pg Pool which is
    // incompatible with Edge runtime. It's tracked via the Node.js
    // admin routes instead.

    return NextResponse.json({ yachts });
  } catch (error: any) {
    console.error('Compare API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compare data', details: error.message },
      { status: 500 },
    );
  }
}

function buildSpecGroups(specs: SpecValue[]): Record<string, { name: string; value: string; unit: string | null }[]> {
  const groups: Record<string, { name: string; value: string; unit: string | null }[]> = {};
  for (const s of specs) {
    const group = s.categoryGroup || 'Other';
    if (!groups[group]) groups[group] = [];
    let value = '—';
    if (s.valueNumeric !== null) {
      value = s.valueNumeric.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else if (s.valueText) {
      value = s.valueText;
    }
    groups[group].push({ name: s.categoryName, value, unit: s.unit });
  }
  return groups;
}
