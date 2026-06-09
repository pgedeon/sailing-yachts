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
    reviewCount: row.review_count != null ? Number(row.review_count) : 0,
  };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** GET /api/admin/review-sources — list all review sources */
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT rs.*, COUNT(r.id)::int as review_count
       FROM review_sources rs
       LEFT JOIN reviews r ON r.review_source_id = rs.id
       GROUP BY rs.id
       ORDER BY rs.name`
    );
    return NextResponse.json({ sources: result.rows.map(mapSource) });
  } catch (error) {
    console.error('Failed to fetch review sources:', error);
    return NextResponse.json({ error: 'Failed to fetch review sources' }, { status: 500 });
  }
}

/** POST /api/admin/review-sources — create a review source */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, websiteUrl, logoUrl, description, credibilityScore, sourceType } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = slugify(name);
    const score = credibilityScore != null ? Math.min(100, Math.max(0, Number(credibilityScore))) : 50;
    const type = sourceType || 'magazine';

    const result = await pool.query(
      `INSERT INTO review_sources (name, slug, website_url, logo_url, description, credibility_score, source_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name.trim(), slug, websiteUrl || null, logoUrl || null, description || null, score, type]
    );

    return NextResponse.json({ source: mapSource(result.rows[0]) }, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'A review source with this name already exists' }, { status: 409 });
    }
    console.error('Failed to create review source:', error);
    return NextResponse.json({ error: 'Failed to create review source' }, { status: 500 });
  }
}
