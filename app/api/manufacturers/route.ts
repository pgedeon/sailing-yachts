import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, name FROM manufacturers ORDER BY name'
    );
    const manufacturers = result.rows;
    return NextResponse.json({ manufacturers });
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return NextResponse.json({ error: 'Failed to fetch manufacturers' }, { status: 500 });
  }
}
