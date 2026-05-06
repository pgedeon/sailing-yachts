import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

interface SpecStats {
  min: number;
  max: number;
  avg: number;
  p25: number;
  p50: number;
  p75: number;
  count: number;
}

interface SizeClassStats {
  sizeClass: { min: number; max: number };
  count: number;
  specs: Record<string, SpecStats>;
}

const SPEC_COLUMNS = [
  'length_overall',
  'beam',
  'draft',
  'displacement',
  'ballast',
  'sail_area_main',
  'engine_hp',
] as const;

async function computeSizeClassStats(loaMin: number, loaMax: number): Promise<SizeClassStats> {
  const { rows } = await pool.query(
    `SELECT
      ${SPEC_COLUMNS.map(col => `
        MIN(${col}) FILTER (WHERE ${col} IS NOT NULL) AS ${col}_min,
        MAX(${col}) FILTER (WHERE ${col} IS NOT NULL) AS ${col}_max,
        AVG(${col}) FILTER (WHERE ${col} IS NOT NULL) AS ${col}_avg,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ${col}) FILTER (WHERE ${col} IS NOT NULL) AS ${col}_p25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ${col}) FILTER (WHERE ${col} IS NOT NULL) AS ${col}_p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${col}) FILTER (WHERE ${col} IS NOT NULL) AS ${col}_p75,
        COUNT(${col}) FILTER (WHERE ${col} IS NOT NULL) AS ${col}_count
      `).join(', ')}
    FROM yacht_models
    WHERE length_overall BETWEEN $1 AND $2`,
    [loaMin, loaMax],
  );

  const row = rows[0];
  const specs: Record<string, SpecStats> = {};

  for (const col of SPEC_COLUMNS) {
    const count = Number(row[`${col}_count`]) || 0;
    if (count > 0) {
      specs[col] = {
        min: Number(row[`${col}_min`]),
        max: Number(row[`${col}_max`]),
        avg: Number(Number(row[`${col}_avg`]).toFixed(2)),
        p25: Number(Number(row[`${col}_p25`]).toFixed(2)),
        p50: Number(Number(row[`${col}_p50`]).toFixed(2)),
        p75: Number(Number(row[`${col}_p75`]).toFixed(2)),
        count,
      };
    }
  }

  // Total count in size class
  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM yacht_models WHERE length_overall BETWEEN $1 AND $2`,
    [loaMin, loaMax],
  );

  return {
    sizeClass: { min: loaMin, max: loaMax },
    count: Number(countResult.rows[0].total),
    specs,
  };
}

function getCachedStats(loaMin: number, loaMax: number) {
  return unstable_cache(
    () => computeSizeClassStats(loaMin, loaMax),
    [`size-class-stats:${loaMin}-${loaMax}`],
    { tags: ['yachts'], revalidate: 300 },
  )();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const loa = parseFloat(searchParams.get('loa') || '');

  if (!loa || loa <= 0) {
    return NextResponse.json(
      { error: 'loa parameter is required and must be positive' },
      { status: 400 },
    );
  }

  // Size class = ±20% of LOA
  const loaMin = +(loa * 0.8).toFixed(2);
  const loaMax = +(loa * 1.2).toFixed(2);

  try {
    const stats = await getCachedStats(loaMin, loaMax);
    return NextResponse.json(stats);
  } catch (err) {
    console.error('Error computing size-class stats:', err);
    return NextResponse.json(
      { error: 'Failed to compute size-class statistics' },
      { status: 500 },
    );
  }
}
