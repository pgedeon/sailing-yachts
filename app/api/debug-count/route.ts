import { NextResponse } from 'next/server';
import { db, yachtModels, manufacturers } from '@/lib/db';
import { eq, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Build a simple query like the public yachts list (no filters)
    const baseQuery = db
      .select({ count: count() })
      .from(yachtModels)
      .leftJoin(
        manufacturers,
        eq(yachtModels.manufacturerId, manufacturers.id)
      );

    const result = await baseQuery;
    const total = Number(result[0]?.count || 0);

    // Also fetch all rows to see which IDs are returned
    const rows = await db
      .select({
        yacht: yachtModels,
        manufacturer: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(
        manufacturers,
        eq(yachtModels.manufacturerId, manufacturers.id)
      )
      .orderBy(yachtModels.id);

    const ids = rows.map((r: any) => r.yacht.id);
    const slugs = rows.map((r: any) => r.yacht.slug);

    return NextResponse.json({
      totalCountFromSimpleQuery: total,
      fetchedRows: rows.length,
      ids,
      slugs,
      message: 'This is a debug endpoint. Remove after testing.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
