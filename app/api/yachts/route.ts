import { NextResponse } from 'next/server';
import { db, yachtModels, manufacturers } from '@/lib/db';
import { eq, count, inArray, sql, and } from 'drizzle-orm';
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

    // Parse filters from query string: accept both legacy JSON ?filters={"k":v} and modern ?filters[k]=v
    let filters: any = {};

    // First, try modern format: repeated filters[key]=value
    const filterEntries: Record<string, any[]> = {};
    for (const [key, value] of searchParams.entries()) {
      const match = key.match(/^filters\[(.+)\]$/);
      if (match) {
        const inner = match[1];
        if (!filterEntries[inner]) filterEntries[inner] = [];
        filterEntries[inner].push(value);
      }
    }
    // Convert arrays with single elements to primitives for compatibility
    for (const [k, v] of Object.entries(filterEntries)) {
      if (v.length === 1) {
        // Try to parse number if numeric
        const num = Number(v[0]);
        filters[k] = isNaN(num) ? v[0] : num;
      } else {
        filters[k] = v;
      }
    }

    // Fallback: legacy single JSON parameter
    if (Object.keys(filters).length === 0) {
      try {
        const legacy = searchParams.get('filters');
        if (legacy) {
          filters = JSON.parse(legacy);
        }
      } catch (e) {
        console.warn('Invalid filters JSON:', e);
      }
    }

    const conditions: any[] = [];

    // Manufacturer filter: expects array of IDs
    if (filters.manufacturers && Array.isArray(filters.manufacturers) && filters.manufacturers.length > 0) {
      conditions.push(inArray(yachtModels.manufacturerId, filters.manufacturers));
    }

    // String equality filters using eq for type safety
    if (filters.rigType) conditions.push(eq(yachtModels.rigType, filters.rigType));
    if (filters.keelType) conditions.push(eq(yachtModels.keelType, filters.keelType));
    if (filters.hullMaterial) conditions.push(eq(yachtModels.hullMaterial, filters.hullMaterial));

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
