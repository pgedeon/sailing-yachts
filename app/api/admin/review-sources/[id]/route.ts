import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

function mapSource(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    name: row.name as string,
    slug: row.slug as string,
    websiteUrl: row.website_url as string | null,
    logoUrl: row.logo_url as string | null,
    description: row.description as string | null,
    credibilityScore: row.credibility_score != null ? Number(row.credibility_score) : 50,
    sourceType: row.source_type as string,
    isActive: row.is_active === true || row.is_active === 'true',
    lastFetchedAt: row.last_fetched_at as string | null,
    createdAt: row.created_at as string | null,
    updatedAt: row.updated_at as string | null,
  };
}

/** GET /api/admin/review-sources/[id] */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const result = await pool.query('SELECT * FROM review_sources WHERE id = $1', [numId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Review source not found' }, { status: 404 });
    }

    return NextResponse.json({ source: mapSource(result.rows[0]) });
  } catch (error) {
    console.error('Failed to fetch review source:', error);
    return NextResponse.json({ error: 'Failed to fetch review source' }, { status: 500 });
  }
}

/** PATCH /api/admin/review-sources/[id] */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const allowedFields = ['name', 'website_url', 'logo_url', 'description', 'credibility_score', 'source_type', 'is_active'];
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    for (const field of allowedFields) {
      if (field in body) {
        setClauses.push(`${field} = $${paramIdx++}`);
        values.push(body[field]);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(numId);

    const result = await pool.query(
      `UPDATE review_sources SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Review source not found' }, { status: 404 });
    }

    return NextResponse.json({ source: mapSource(result.rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'A review source with this name already exists' }, { status: 409 });
    }
    console.error('Failed to update review source:', error);
    return NextResponse.json({ error: 'Failed to update review source' }, { status: 500 });
  }
}

/** DELETE /api/admin/review-sources/[id] */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const result = await pool.query('DELETE FROM review_sources WHERE id = $1 RETURNING id', [numId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Review source not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Review source deleted successfully' });
  } catch (error) {
    console.error('Failed to delete review source:', error);
    return NextResponse.json({ error: 'Failed to delete review source' }, { status: 500 });
  }
}
