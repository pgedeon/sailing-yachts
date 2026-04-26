import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { checkLoginRateLimit, getClientIp } from '@/lib/rate-limit'
import { locales, defaultLocale } from '@/i18n'

// next-intl middleware for locale routing
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // /en/... and /fr/...
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── API routes: no locale handling, just rate limiting ──
  if (pathname.startsWith('/api/')) {
    const clientIp = getClientIp(request)

    // Rate limiting for admin login attempts
    if (pathname === '/api/auth/callback/credentials' && request.method === 'POST') {
      const rateLimit = checkLoginRateLimit(clientIp)
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.', retryAfterMs: rateLimit.retryAfterMs },
          { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
        )
      }
    }

    return NextResponse.next()
  }

  // ── Embed routes: no locale handling ──
  if (pathname.startsWith('/embed/')) {
    return NextResponse.next()
  }

  // ── Admin routes: no locale handling ──
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // ── Everything else: handle with next-intl middleware ──
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Match all paths except static files, _next, and other internals
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap.*\\.xml|feed\\.xml|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.webp|.*\\.woff2?|.*\\.ttf).*)',
  ]
}
