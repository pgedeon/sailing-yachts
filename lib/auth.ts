import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to check admin authentication
 * Returns null if authenticated, otherwise returns a NextResponse with 401
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const authCookie = request.cookies.get('auth');
  
  // In development, you might want to allow bypassing auth, but for production we require auth
  if (!authCookie || authCookie.value !== 'true') {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    );
  }
  
  return null;
}

/**
 * Utility to check if user is authenticated (for server components that can't use middleware)
 */
export function isAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get('auth');
  return authCookie?.value === 'true';
}