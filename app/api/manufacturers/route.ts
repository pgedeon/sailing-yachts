import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, name, country, founded_year, website_url, description FROM manufacturers ORDER BY name'
    );
    const manufacturers = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      country: row.country,
      foundedYear: row.founded_year,
      websiteUrl: row.website_url,
      description: row.description,
    }));
    return NextResponse.json({ manufacturers });
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return NextResponse.json({ error: 'Failed to fetch manufacturers' }, { status: 500 });
  }
}
