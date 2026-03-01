import { NextResponse } from 'next/server';
import { db, yachtModels, manufacturers } from '@/lib/db';
import { eq, count, sql } from 'drizzle-orm';
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

    // Apply filters (if any)
    // Currently no filters, but structure supports:
    // - manufacturer filter
    // - spec numeric ranges
    // - full-text search

    // Get total count BEFORE pagination
    const countResult = await db
      .select({ count: count() })
      .from(query.as('count_subquery'));
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
