import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to check admin authentication
 * Returns null if authenticated, otherwise returns a NextResponse with 401
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const authCookie = request.cookies.get('auth');
  const authHeader = request.headers.get('Authorization');

  // Support backward compatibility: accept 'true' as valid (old cookie format)
  if (authCookie && (authCookie.value === 'true' || authCookie.value.length > 0)) {
    return null;
  }

  // Check Authorization: Bearer token (any non-empty token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token.length > 0) {
      return null;
    }
  }
  
  return NextResponse.json(
    { error: "Unauthorized - Admin access required" },
    { status: 401 }
  );
}

/**
 * Utility to check if user is authenticated (for server components that can't use middleware)
 */
export function isAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get('auth');
  if (authCookie && authCookie.value.length > 0) return true;
  
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return token.length > 0;
  }
  
  return false;
}