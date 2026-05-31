import { NextResponse } from 'next/server';
import { getManufacturersWithCounts } from '@/lib/manufacturers';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const manufacturers = await getManufacturersWithCounts();
    return NextResponse.json({
      manufacturers: manufacturers.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        country: m.country,
        foundedYear: m.foundedYear,
        description: m.description,
        logoUrl: m.logoUrl,
        yachtCount: m.yachtCount,
      })),
    });
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return NextResponse.json({ error: 'Failed to fetch manufacturers' }, { status: 500 });
  }
}
