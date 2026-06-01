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

/**
 * Build security headers based on the route type.
 * - Embed routes allow framing (used by third-party embeds)
 * - All other routes set X-Frame-Options: DENY
 */
function getSecurityHeaders(pathname: string): Record<string, string> {
  const isEmbed = pathname.startsWith('/embed/')

  // Content-Security-Policy directives
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://info.sailboats.fr https://img.youtube.com https://i.vimeocdn.com https://*.googleusercontent.com",
    "media-src 'self'",
    "object-src 'none'",
    isEmbed
      ? "frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com"
      : "frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com",
    "frame-ancestors " + (isEmbed ? "'self' *" : "'none'"),
    "connect-src 'self' https://o*.ingest.sentry.io https://*.ingest.sentry.io https://info.sailboats.fr https://speedcurve.com https://cdn.speedcurve.com",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ')

  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': cspDirectives,
    // X-Frame-Options only set for non-embed routes (CSP frame-ancestors takes priority in modern browsers)
    ...(isEmbed ? {} : { 'X-Frame-Options': 'DENY' }),
  }
}

function addSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  const headers = getSecurityHeaders(pathname)
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}

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

    const response = NextResponse.next()
    // API-specific security headers (no CSP needed for API routes)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    return response
  }

  // ── Embed routes: allow framing for embeds ──
  if (pathname.startsWith('/embed/')) {
    const response = NextResponse.next()
    return addSecurityHeaders(response, pathname)
  }

  // ── Admin routes: no locale handling ──
  if (pathname.startsWith('/admin')) {
    const response = NextResponse.next()
    return addSecurityHeaders(response, pathname)
  }

  // ── Everything else: handle with next-intl middleware ──
  const response = intlMiddleware(request)
  return addSecurityHeaders(response, pathname)
}

export const config = {
  matcher: [
    // Match all paths except static files, _next, and other internals
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap.*\\.xml|feed\\.xml|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.webp|.*\\.woff2?|.*\\.ttf).*)',
  ]
}