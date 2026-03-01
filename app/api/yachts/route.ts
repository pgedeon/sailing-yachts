import { NextResponse } from 'next/server';
import { db, yachtModels, manufacturers } from '@/lib/db';
import { eq, count, sql, and } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const sortBy = searchParams.get('sort') || 'id';
    const sortOrder = searchParams.get('order') === 'desc' ? 'desc' : 'asc';
    const debug = searchParams.get('debug') === 'true';

    // Base query: join with manufacturers
    let query = db
      .select({
        yacht: yachtModels,
        manufacturer: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(
        manufacturers,
        eq(yachtModels.manufacturerId, manufacturers.id)
      );

    // Parse and apply filters
    let filters: any = {};
    try {
      const filtersParam = searchParams.get('filters');
      if (filtersParam) {
        filters = JSON.parse(filtersParam);
      }
    } catch (e) {
      console.warn('Invalid filters parameter:', e);
    }

    const conditions: any[] = [];

    // Manufacturer filter: expects array of IDs
    if (filters.manufacturers && Array.isArray(filters.manufacturers) && filters.manufacturers.length > 0) {
      conditions.push(sql`${yachtModels.manufacturerId} = ANY(${filters.manufacturers})`);
    }

    // String equality filters
    if (filters.rigType) conditions.push(sql`${yachtModels.rigType} = ${filters.rigType}`);
    if (filters.keelType) conditions.push(sql`${yachtModels.keelType} = ${filters.keelType}`);
    if (filters.hullMaterial) conditions.push(sql`${yachtModels.hullMaterial} = ${filters.hullMaterial}`);

    // Numeric ranges with inclusive bounds
    if (filters.lengthOverall_min != null) conditions.push(sql`${yachtModels.lengthOverall} >= ${filters.lengthOverall_min}`);
    if (filters.lengthOverall_max != null) conditions.push(sql`${yachtModels.lengthOverall} <= ${filters.lengthOverall_max}`);
    if (filters.beam_min != null) conditions.push(sql`${yachtModels.beam} >= ${filters.beam_min}`);
    if (filters.beam_max != null) conditions.push(sql`${yachtModels.beam} <= ${filters.beam_max}`);
    if (filters.draft_min != null) conditions.push(sql`${yachtModels.draft} >= ${filters.draft_min}`);
    if (filters.draft_max != null) conditions.push(sql`${yachtModels.draft} <= ${filters.draft_max}`);
    if (filters.displacement_min != null) conditions.push(sql`${yachtModels.displacement} >= ${filters.displacement_min}`);
    if (filters.displacement_max != null) conditions.push(sql`${yachtModels.displacement} <= ${filters.displacement_max}`);
    if (filters.sailAreaMain_min != null) conditions.push(sql`${yachtModels.sailAreaMain} >= ${filters.sailAreaMain_min}`);
    if (filters.sailAreaMain_max != null) conditions.push(sql`${yachtModels.sailAreaMain} <= ${filters.sailAreaMain_max}`);

    // Apply all conditions with AND using drizzle and()
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count respecting filters (without pagination)
    let countBase = db.select({ count: count() }).from(yachtModels);
    if (conditions.length > 0) {
      countBase = countBase.where(and(...conditions));
    }
    const countResult = await countBase;
    const total = Number(countResult[0]?.count || 0);

    // Apply sorting
    const sortField = (yachtModels as any)[sortBy] || yachtModels.id;
    if (sortOrder === 'desc') {
      query = query.orderBy(sql`${sortField} DESC`);
    } else {
      query = query.orderBy(sql`${sortField} ASC`);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    // Fetch results
    const results = await query;

    // Build distinct values for filter options (from full dataset, ignoring filters)
    const distinctQuery = db
      .select({
        rigType: yachtModels.rigType,
        keelType: yachtModels.keelType,
        hullMaterial: yachtModels.hullMaterial,
      })
      .from(yachtModels)
      .where(sql`${yachtModels.rigType} IS NOT NULL OR ${yachtModels.keelType} IS NOT NULL OR ${yachtModels.hullMaterial} IS NOT NULL`);
    const distinctRows = await distinctQuery;

    const collectDistinct = (field: string) =>
      Array.from(
        new Set(distinctRows.map((r: any) => r[field] as string | null).filter(Boolean))
      ).sort();

    const distinct = {
      rigTypes: collectDistinct('rigType'),
      keelTypes: collectDistinct('keelType'),
      hullMaterials: collectDistinct('hullMaterial'),
    };

    // Build response
    const response: any = {
      yachts: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      distinct,
    };

    if (debug) {
      response._debug = {
        appliedSort: { sortBy, sortOrder },
        effectiveQuery: 'SELECT DISTINCT ...' // Simplified
      };
    }

    const jsonResponse = NextResponse.json(response);
    // P0: Ensure public API is non-cacheable at all layers
    jsonResponse.headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0");
    jsonResponse.headers.set("Pragma", "no-cache");
    // P1: Tag for future cache invalidation (currently unused but ready)
    jsonResponse.headers.set("x-next-revalidate-tags", "yachts");
    return jsonResponse;
  } catch (error: any) {
    console.error('Yachts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch yachts', details: error.message },
      { status: 500 }
    );
  }
}
