import { NextRequest, NextResponse } from "next/server";

const AUTH_USER = "admin";
const AUTH_PASS = "SailBoatAdmin!";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin")) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return unauthorizedResponse();

    const [scheme, encoded] = authHeader.split(" ");
    if (scheme !== "Basic" || !encoded) return unauthorizedResponse();

    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [user, pass] = decoded.split(":");
      if (user !== AUTH_USER || pass !== AUTH_PASS) return unauthorizedResponse();
    } catch {
      return unauthorizedResponse();
    }
  }

  return NextResponse.next();
}

function unauthorizedResponse(): Response {
  return new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
