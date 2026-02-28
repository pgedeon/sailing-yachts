import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || 'unknown';
  return NextResponse.json({
    commit,
    timestamp: new Date().toISOString(),
    message: 'If this shows an old commit, redeploy from Vercel dashboard.',
  });
}
