import { NextResponse } from 'next/server';
import {
  db,
  yachtModels,
  manufacturers,
  specValues,
  specCategories,
} from '@/lib/db';
import { eq, inArray, and, count, gte, lte, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Simulate the exact GET logic from /api/yachts with no filters
    const filters = {};
    const sortBy = 'lengthOverall';
    const sortOrder = 'asc';

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

    // Skip all filter blocks (filters empty)

    // Count via subquery (same as yachts API)
    const countResult = await db
      .select({ count: count() })
      .from((query as any).as('count_subquery'));
    const totalFromSub = Number(countResult[0]?.count || 0);

    // Also do a direct count on base join for comparison
    const directCount = await db
      .select({ count: count() })
      .from(yachtModels)
      .leftJoin(
        manufacturers,
        eq(yachtModels.manufacturerId, manufacturers.id)
      );
    const totalDirect = Number(directCount[0]?.count || 0);

    // Fetch the rows to see which IDs are included in the base query
    const rows = await query;
    const ids = rows.map((r: any) => r.yacht.id);
    const slugs = rows.map((r: any) => r.yacht.slug);

    return NextResponse.json({
      totalFromSubquery: totalFromSub,
      totalFromDirect: totalDirect,
      fetchedRows: rows.length,
      ids,
      slugs,
      note: 'Compare subquery count vs direct count. If subquery is lower, something in the query building is filtering rows.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
