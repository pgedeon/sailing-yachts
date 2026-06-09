import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getYachtReviewAggregation } from '@/lib/review-aggregation';

export const dynamic = 'force-dynamic';

/** GET /api/yachts/[slug]/review-aggregation */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Look up yacht model ID from slug
    const yachtResult = await pool.query(
      'SELECT id FROM yacht_models WHERE slug = $1',
      [slug]
    );
    if (yachtResult.rows.length === 0) {
      return NextResponse.json({ error: 'Yacht not found' }, { status: 404 });
    }

    const yachtModelId = Number(yachtResult.rows[0].id);
    const aggregation = await getYachtReviewAggregation(yachtModelId);
    return NextResponse.json(aggregation);
  } catch (error) {
    console.error('Failed to fetch review aggregation:', error);
    return NextResponse.json({ error: 'Failed to fetch review aggregation' }, { status: 500 });
  }
}
