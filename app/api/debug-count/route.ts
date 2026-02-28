import { NextRequest, NextResponse } from 'next/server';
import { db, yachtModels, manufacturers, specValues, specCategories } from '@/lib/db';
import { eq, count, inArray, gte, lte, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Simulate the exact query from /api/yachts with no filters
    const searchParams = request.nextUrl.searchParams;
    // We ignore filters to replicate empty state
    let query: any = db
      .select({
        yacht: yachtModels,
        manufacturer: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(
        manufacturers,
        eq(yachtModels.manufacturerId, manufacturers.id),
      );

    // No filters applied (same as yachts API with empty filters)

    // Count subquery exactly like yachts API
    const countResult = await db
      .select({ count: count() })
      .from((query as any).as('count_subquery'));
    const total = Number(countResult[0]?.count || 0);

    // Order and limit (default limit 100 for debug)
    query = query.orderBy(yachtModels.lengthOverall).limit(100);

    const results = await query;
    const ids = results.map((r:any) => r.yacht.id);
    const slugs = results.map((r:any) => r.yacht.slug);

    return NextResponse.json({
      totalCountFromYachtsStyleQuery: total,
      fetchedRows: results.length,
      ids,
      slugs,
      message: 'Debug endpoint mimicking /api/yachts query. Remove after testing.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
