import { NextResponse } from 'next/server';
import { db, yachtModels, manufacturers } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db
    .select({
      yacht: yachtModels,
      manufacturer: manufacturers.name,
    })
    .from(yachtModels)
    .leftJoin(
      manufacturers,
      eq(yachtModels.manufacturerId, manufacturers.id)
    );
  return NextResponse.json({
    count: rows.length,
    ids: rows.map(r => r.yacht.id),
    names: rows.map(r => `${r.manufacturer} ${r.yacht.modelName}`.trim()),
  });
}
