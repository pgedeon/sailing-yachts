import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi-schema';

export const dynamic = 'force-static';

/**
 * GET /api/v1/openapi.json — OpenAPI 3.0.3 specification for the public API.
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
