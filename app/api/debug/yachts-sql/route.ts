import { NextResponse } from 'next/server';
import { db, yachtModels, manufacturers } from '@/lib/db';
import { eq, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
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

  // No filter modifications

  // Get base query SQL
  // @ts-ignore
  const baseSql = (query as any).toSQL?.({ dialect: 'postgresql' }) || 'Could not serialize base';

  // Build count query exactly as /api/yachts does
  const countQuery = db
    .select({ count: count() })
    .from((query as any).as('count_subquery'));

  // @ts-ignore
  const countSql = (countQuery as any).toSQL?.({ dialect: 'postgresql' }) || 'Could not serialize count';

  // Execute base query to see actual rows
  const rows = await query;
  const baseCount = rows.length;
  const ids = (rows as any[]).map((r: any) => r.yacht.id);

  // Execute count query
  const countResult = await countQuery;
  const totalFromCount = Number((countResult[0] as any)?.count || 0);

  return NextResponse.json({
    baseSql,
    countSql,
    totalFromCount,
    baseRowCount: baseCount,
    ids,
    message: 'Compare baseRowCount vs totalFromCount. They should be equal.'
  });
}
