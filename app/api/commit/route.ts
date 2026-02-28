import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_HASH || 'unknown';
  return NextResponse.json({ commit, timestamp: new Date().toISOString() });
}
