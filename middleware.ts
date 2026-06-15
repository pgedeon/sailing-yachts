import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { checkLoginRateLimit, checkRateLimit, getClientIp, rateLimitHeaders, READ_RATE_LIMIT, WRITE_RATE_LIMIT } from '@/lib/rate-limit'
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
  const isEmbed = pathname === '/embed' || pathname.startsWith('/embed/')

  // Content-Security-Policy directives
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self'",
    "object-src 'none'",
    isEmbed
      ? "frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com"
      : "frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com",
    "frame-ancestors " + (isEmbed ? "'self' *" : "'none'"),
    "connect-src 'self' https://*.ingest.sentry.io https://info.sailboats.fr https://api.sailboats.fr https://speedcurve.com https://cdn.speedcurve.com",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ')

  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': cspDirectives,
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
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

/**
 * Apply tiered rate limiting to API routes.
 * - GET requests: READ_RATE_LIMIT (120/min)
 * - POST/PUT/DELETE: WRITE_RATE_LIMIT (20/min)
 * - Special strict routes use per-route limits
 */
function applyApiRateLimit(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  const method = request.method
  const clientIp = getClientIp(request)
  const isWrite = method !== 'GET' && method !== 'HEAD'

  // Strict-limited write routes
  const strictRoutes = [
    '/api/email-yacht',
    '/api/compare/share',
  ]

  // Login route has its own brute-force protection
  if (pathname === '/api/auth/callback/credentials' && method === 'POST') {
    const rateLimit = checkLoginRateLimit(clientIp)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.', retryAfterMs: rateLimit.retryAfterMs },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
      )
    }
    return null // Let the route handler proceed
  }

  // Public write routes that have their own validation + rate limiting via checkRateLimit
  // We still apply a general write limit at middleware level for defense-in-depth
  const options = isWrite ? WRITE_RATE_LIMIT : READ_RATE_LIMIT
  const rlKey = `${method}:${pathname}:${clientIp}`
  const result = checkRateLimit(rlKey, options)

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          ...rateLimitHeaders(result),
        },
      }
    )
  }

  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── API routes: rate limiting + security headers ──
  if (pathname.startsWith('/api/')) {
    // Apply rate limiting
    const rateLimited = applyApiRateLimit(request)
    if (rateLimited) {
      return rateLimited
    }

    const response = NextResponse.next()
    // API-specific security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    return response
  }

  // ── Embed routes: allow framing for embeds ──
  if (pathname === '/embed' || pathname.startsWith('/embed/')) {
    const response = NextResponse.next()
    return addSecurityHeaders(response, pathname)
  }

  // ── Auth routes: no locale handling ──
  if (pathname.startsWith('/auth/')) {
    const response = NextResponse.next()
    return addSecurityHeaders(response, pathname)
  }

  // ── Admin routes: no locale handling ──
  if (pathname.startsWith('/admin')) {
    const response = NextResponse.next()
    return addSecurityHeaders(response, pathname)
  }

  // ── Invalid manufacturer sub-routes (compare, etc.) ──
  // /manufacturers/[slug]/compare is not a valid route — redirect to manufacturer page
  const mfrCompareMatch = pathname.match(/^\/(en|fr)\/manufacturers\/([^/]+)\/compare$/);
  if (mfrCompareMatch) {
    const locale = mfrCompareMatch[1];
    const slug = mfrCompareMatch[2];
    return NextResponse.redirect(new URL(`/${locale}/manufacturers/${slug}`, request.url));
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
