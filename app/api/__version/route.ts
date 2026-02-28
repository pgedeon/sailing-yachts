import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    version: '2025-06-18-1200',
    timestamp: new Date().toISOString(),
    node_version: process.version,
  });
}
