import { NextResponse } from 'next/server';
import { db, yachtModels, manufacturers } from '@/lib/db';
import { eq, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sortBy = searchParams.get('sort') || 'id';
  const sortOrder = searchParams.get('order') || 'asc';
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

  // Apply any filters (manufacturer, specs, search) would go here

  // Deduplicate rows (important if spec joins are added later)
  query = query.distinct();

  // Get total count
  const countResult = await db
    .select({ count: count() })
    .from(query.as('count_subquery'));
  const total = Number(countResult[0]?.count || 0);

  // Apply sorting
  const sortField = yachtModels[sortBy as keyof typeof yachtModels] || yachtModels.id;
  query = query.orderBy(sortOrder === 'desc' ? (sortField as any).desc() : (sortField as any).asc());

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.limit(limit).offset(offset);

  // Fetch results
  const results = await query;

  return NextResponse.json({
    yachts: results,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
