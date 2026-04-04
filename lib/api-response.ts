import { NextResponse } from 'next/server';

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * Standard CORS headers for the public API.
 */
export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  };
}

/**
 * Create a success response with CORS and rate limit headers.
 */
export function apiSuccess<T>(
  data: T,
  opts?: {
    meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
    rateLimit?: { remaining: number; resetAt: number; limit: number };
    status?: number;
  }
): NextResponse {
  const headers: Record<string, string> = { ...corsHeaders() };
  if (opts?.rateLimit) {
    headers['X-RateLimit-Limit'] = String(opts.rateLimit.limit);
    headers['X-RateLimit-Remaining'] = String(opts.rateLimit.remaining);
    headers['X-RateLimit-Reset'] = String(Math.ceil(opts.rateLimit.resetAt / 1000));
  }
  return NextResponse.json({ data, ...(opts?.meta ? { meta: opts.meta } : {}) }, { status: opts?.status ?? 200, headers });
}

/**
 * Create an error response with CORS.
 */
export function apiError(
  code: string,
  message: string,
  status: number,
  opts?: {
    details?: string;
    rateLimit?: { remaining: number; resetAt: number; limit: number };
  }
): NextResponse {
  const headers: Record<string, string> = { ...corsHeaders() };
  if (opts?.rateLimit) {
    headers['X-RateLimit-Limit'] = String(opts.rateLimit.limit);
    headers['X-RateLimit-Remaining'] = String(opts.rateLimit.remaining);
    headers['X-RateLimit-Reset'] = String(Math.ceil(opts.rateLimit.resetAt / 1000));
  }
  if (status === 429 && opts?.rateLimit) {
    headers['Retry-After'] = String(Math.ceil((opts.rateLimit.resetAt - Date.now()) / 1000));
  }
  return NextResponse.json(
    { error: { code, message, details: opts?.details } },
    { status, headers }
  );
}

/**
 * Handle CORS preflight (OPTIONS).
 */
export function corsOptionsResponse(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
