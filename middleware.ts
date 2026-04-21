import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { checkLoginRateLimit, getClientIp } from '@/lib/rate-limit'
import { logAudit, getUserAgent } from '@/lib/admin-audit'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIp = getClientIp(request)
  const userAgent = getUserAgent(request)

  // ── Rate limiting for admin login attempts ──
  // Intercept the NextAuth credentials callback to enforce lockout
  if (pathname === '/api/auth/callback/credentials' && request.method === 'POST') {
    const rateLimit = checkLoginRateLimit(clientIp)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.', retryAfterMs: rateLimit.retryAfterMs },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
      )
    }
  }

  // ── Protect admin API routes (except auth and login/logout) ──
  if (pathname.startsWith('/api/admin/') && 
      !pathname.startsWith('/api/auth/') &&
      pathname !== '/api/admin/login' && 
      pathname !== '/api/admin/logout') {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token || token.role !== 'admin') {
      // Log unauthorized access attempt
      await logAudit({
        userId: token?.sub ? Number(token.sub) : null,
        userEmail: (token?.email as string) ?? null,
        action: 'unauthorized_access',
        resourceType: 'admin_api',
        resourceId: pathname,
        ipAddress: clientIp,
        userAgent,
        statusCode: 401,
      }).catch(() => {})

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ── Protect admin page routes ──
  if (pathname.startsWith('/admin') && pathname !== '/admin') {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token || token.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/auth/callback/credentials',
  ]
}
