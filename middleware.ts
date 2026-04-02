import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Only apply to embed routes
  if (request.nextUrl.pathname.startsWith("/embed")) {
    const response = NextResponse.next();

    // Allow embedding from sailboats.fr and same origin
    response.headers.set(
      "X-Frame-Options",
      "ALLOW-FROM https://sailboats.fr"
    );
    response.headers.set(
      "Content-Security-Policy",
      "frame-ancestors 'self' https://sailboats.fr https://*.sailboats.fr http://localhost:*"
    );

    // CORS headers for API-like access
    response.headers.set(
      "Access-Control-Allow-Origin",
      "https://sailboats.fr"
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET"
    );

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/embed/:path*"],
};
