import { NextResponse } from 'next/server';
import { db, yachtModels, manufacturers } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const query = db
    .select({
      yacht: yachtModels,
      manufacturer: manufacturers.name,
    })
    .from(yachtModels)
    .leftJoin(
      manufacturers,
      eq(yachtModels.manufacturerId, manufacturers.id)
    );

  // @ts-ignore – toSQL is available but TS may not see it
  const sql = (query as any).toSQL?.({ dialect: 'postgresql' }) || 'Could not serialize';

  return NextResponse.json({ sql });
}
