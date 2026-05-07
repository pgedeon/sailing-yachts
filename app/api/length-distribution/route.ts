import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

export interface DistributionBin {
  label: string;
  min: number;
  max: number;
  count: number;
}

interface DistributionResponse {
  bins: DistributionBin[];
  total: number;
}

// Define fixed bins for yacht length distribution (in meters)
const BINS: ReadonlyArray<{ min: number; max: number; label: string }> = [
  { min: 0, max: 6, label: '0-6m' },
  { min: 6, max: 8, label: '6-8m' },
  { min: 8, max: 10, label: '8-10m' },
  { min: 10, max: 12, label: '10-12m' },
  { min: 12, max: 14, label: '12-14m' },
  { min: 14, max: 16, label: '14-16m' },
  { min: 16, max: 18, label: '16-18m' },
  { min: 18, max: 20, label: '18-20m' },
  { min: 20, max: 25, label: '20-25m' },
  { min: 25, max: 100, label: '25m+' },
];

function buildCaseExpression(): string {
  const whens = BINS.map(
    (b, i) => `WHEN length_overall >= ${b.min} AND length_overall < ${b.max} THEN ${i}`,
  );
  return `CASE ${whens.join(' ')} END`;
}

async function computeDistribution(): Promise<DistributionResponse> {
  const caseExpr = buildCaseExpression();
  const { rows } = await pool.query(
    `SELECT ${caseExpr} AS bin_idx, COUNT(*) AS cnt
     FROM yacht_models
     WHERE length_overall IS NOT NULL
     GROUP BY bin_idx
     ORDER BY bin_idx`,
  );

  const binMap = new Map<number, number>();
  for (const row of rows) {
    const idx = row.bin_idx;
    if (idx !== null) {
      binMap.set(Number(idx), Number(row.cnt));
    }
  }

  const bins: DistributionBin[] = BINS.map((b, i) => ({
    label: b.label,
    min: b.min,
    max: b.max,
    count: binMap.get(i) || 0,
  }));

  const total = bins.reduce((sum, b) => sum + b.count, 0);

  return { bins, total };
}

const getCachedDistribution = unstable_cache(
  computeDistribution,
  ['length-distribution'],
  { tags: ['yachts'], revalidate: 300 },
);

export async function GET() {
  try {
    const data = await getCachedDistribution();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error computing length distribution:', err);
    return NextResponse.json(
      { error: 'Failed to compute length distribution' },
      { status: 500 },
    );
  }
}
