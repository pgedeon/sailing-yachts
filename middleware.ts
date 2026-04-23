import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkLoginRateLimit, getClientIp } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIp = getClientIp(request)

  // ── Rate limiting for admin login attempts ──
  if (pathname === '/api/auth/callback/credentials' && request.method === 'POST') {
    const rateLimit = checkLoginRateLimit(clientIp)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.', retryAfterMs: rateLimit.retryAfterMs },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
      )
    }
  }

  // Admin API routes are protected by requireAdmin() in page components

  // Admin page routes are protected by requireAdmin() in each page component

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/auth/callback/credentials',
  ]
}
