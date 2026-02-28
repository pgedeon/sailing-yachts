import { NextResponse } from 'next/server';
import { db, yachtModels, manufacturers } from '@/lib/db';
import { eq, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Replicate the exact count query from the main /api/yachts route (before sort/limit)
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

  // No filters applied (same as main API with empty filters)

  const countResult = await db
    .select({ count: count() })
    .from((query as any).as('count_subquery'));
  const total = Number(countResult[0]?.count || 0);

  // Also fetch the rows from the same base query to see which IDs are included
  const rows = await query;
  const ids = rows.map(r => r.yacht.id);

  return NextResponse.json({
    totalFromSubquery: total,
    fetchedRows: rows.length,
    ids,
    slugs: rows.map(r => r.yacht.slug),
    message: 'This replicates the count logic from /api/yachts'
  });
}
