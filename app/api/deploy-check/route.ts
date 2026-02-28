import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    deployedAt: new Date().toISOString(),
    commit: 'diagnostic',
  });
}
