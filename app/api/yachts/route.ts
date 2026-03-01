import { NextResponse } from 'next/server';
import { db, yachtModels, manufacturers } from '@/lib/db';
import { eq, count, sql, inArray } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = (searchParams.get('sort') as keyof typeof yachtModels) || 'id';
    const sortOrder = searchParams.get('order') === 'desc' ? 'desc' : 'asc';

    // Parse filters (modern format)
    const filters: any = {};
    const filterEntries: Record<string, any[]> = {};
    for (const [key, value] of searchParams.entries()) {
      const match = key.match(/^filters\[(.+)\]$/);
      if (match) {
        const inner = match[1];
        if (!filterEntries[inner]) filterEntries[inner] = [];
        filterEntries[inner].push(value);
      }
    }
    for (const [k, v] of Object.entries(filterEntries)) {
      if (v.length === 1) {
        const num = Number(v[0]);
        filters[k] = isNaN(num) ? v[0] : num;
      } else {
        const nums = v.map(x => {
          const n = Number(x);
          return isNaN(n) ? x : n;
        });
        filters[k] = nums;
      }
    }

    // Base query with join
    let query = db.select({
      id: yachtModels.id,
      model_name: yachtModels.modelName,
      manufacturer_id: yachtModels.manufacturerId,
      year: yachtModels.year,
      slug: yachtModels.slug,
      length_overall: yachtModels.lengthOverall,
      beam: yachtModels.beam,
      draft: yachtModels.draft,
      displacement: yachtModels.displacement,
      ballast: yachtModels.ballast,
      sail_area_main: yachtModels.sailAreaMain,
      rig_type: yachtModels.rigType,
      keel_type: yachtModels.keelType,
      hull_material: yachtModels.hullMaterial,
      cabins: yachtModels.cabins,
      berths: yachtModels.berths,
      heads: yachtModels.heads,
      max_occupancy: yachtModels.maxOccupancy,
      engine_hp: yachtModels.engineHp,
      engine_type: yachtModels.engineType,
      fuel_capacity: yachtModels.fuelCapacity,
      water_capacity: yachtModels.waterCapacity,
      design_notes: yachtModels.designNotes,
      description: yachtModels.description,
      source_url: yachtModels.sourceUrl,
      source_attribution: yachtModels.sourceAttribution,
      admin_links: yachtModels.adminLinks,
      created_at: yachtModels.createdAt,
      updated_at: yachtModels.updatedAt,
      manufacturer_name: manufacturers.name,
    }).from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id));

    // Apply filters
    if (filters.manufacturers && Array.isArray(filters.manufacturers) && filters.manufacturers.length > 0) {
      query = query.where(inArray(yachtModels.manufacturerId, filters.manufacturers));
    }
    if (filters.rigType) query = query.where(sql`${yachtModels.rigType} = ${filters.rigType}`);
    if (filters.keelType) query = query.where(sql`${yachtModels.keelType} = ${filters.keelType}`);
    if (filters.hullMaterial) query = query.where(sql`${yachtModels.hullMaterial} = ${filters.hullMaterial}`);
    if (filters.lengthOverall_min != null) query = query.where(sql`${yachtModels.lengthOverall} >= ${filters.lengthOverall_min}`);
    if (filters.lengthOverall_max != null) query = query.where(sql`${yachtModels.lengthOverall} <= ${filters.lengthOverall_max}`);
    if (filters.beam_min != null) query = query.where(sql`${yachtModels.beam} >= ${filters.beam_min}`);
    if (filters.beam_max != null) query = query.where(sql`${yachtModels.beam} <= ${filters.beam_max}`);
    if (filters.draft_min != null) query = query.where(sql`${yachtModels.draft} >= ${filters.draft_min}`);
    if (filters.draft_max != null) query = query.where(sql`${yachtModels.draft} <= ${filters.draft_max}`);
    if (filters.displacement_min != null) query = query.where(sql`${yachtModels.displacement} >= ${filters.displacement_min}`);
    if (filters.displacement_max != null) query = query.where(sql`${yachtModels.displacement} <= ${filters.displacement_max}`);
    if (filters.sailAreaMain_min != null) query = query.where(sql`${yachtModels.sailAreaMain} >= ${filters.sailAreaMain_min}`);
    if (filters.sailAreaMain_max != null) query = query.where(sql`${yachtModels.sailAreaMain} <= ${filters.sailAreaMain_max}`);

    // Get total count with same filters
    let countQuery = db.select({ count: count() }).from(yachtModels);
    if (filters.manufacturers && Array.isArray(filters.manufacturers) && filters.manufacturers.length > 0) {
      countQuery = countQuery.where(inArray(yachtModels.manufacturerId, filters.manufacturers));
    }
    if (filters.rigType) countQuery = countQuery.where(sql`${yachtModels.rigType} = ${filters.rigType}`);
    if (filters.keelType) countQuery = countQuery.where(sql`${yachtModels.keelType} = ${filters.keelType}`);
    if (filters.hullMaterial) countQuery = countQuery.where(sql`${yachtModels.hullMaterial} = ${filters.hullMaterial}`);
    if (filters.lengthOverall_min != null) countQuery = countQuery.where(sql`${yachtModels.lengthOverall} >= ${filters.lengthOverall_min}`);
    if (filters.lengthOverall_max != null) countQuery = countQuery.where(sql`${yachtModels.lengthOverall} <= ${filters.lengthOverall_max}`);
    if (filters.beam_min != null) countQuery = countQuery.where(sql`${yachtModels.beam} >= ${filters.beam_min}`);
    if (filters.beam_max != null) countQuery = countQuery.where(sql`${yachtModels.beam} <= ${filters.beam_max}`);
    if (filters.draft_min != null) countQuery = countQuery.where(sql`${yachtModels.draft} >= ${filters.draft_min}`);
    if (filters.draft_max != null) countQuery = countQuery.where(sql`${yachtModels.draft} <= ${filters.draft_max}`);
    if (filters.displacement_min != null) countQuery = countQuery.where(sql`${yachtModels.displacement} >= ${filters.displacement_min}`);
    if (filters.displacement_max != null) countQuery = countQuery.where(sql`${yachtModels.displacement} <= ${filters.displacement_max}`);
    if (filters.sailAreaMain_min != null) countQuery = countQuery.where(sql`${yachtModels.sailAreaMain} >= ${filters.sailAreaMain_min}`);
    if (filters.sailAreaMain_max != null) countQuery = countQuery.where(sql`${yachtModels.sailAreaMain} <= ${filters.sailAreaMain_max}`);

    const countResult = await countQuery;
    const total = Number(countResult[0]?.count || 0);

    // Sorting
    const sortField = yachtModels[sortBy] ?? yachtModels.id;
    query = query.orderBy(sql`${sortField} ${sortOrder}`);

    // Pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    const results = await query;

    // Build distinct values (from filtered? or full? We'll use full dataset not filtered)
    const distinctQuery = db.select({
      rigType: yachtModels.rigType,
      keelType: yachtModels.keelType,
      hullMaterial: yachtModels.hullMaterial,
    }).from(yachtModels);
    const distinctRows = await distinctQuery;
    const collectDistinct = (field: string) =>
      Array.from(new Set(distinctRows.map((r: any) => r[field] as string | null).filter(Boolean))).sort();
    const distinct = {
      rigTypes: collectDistinct('rigType'),
      keelTypes: collectDistinct('keelType'),
      hullMaterials: collectDistinct('hullMaterial'),
    };

    // Flatten results
    const yachts = results.map(row => ({
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
