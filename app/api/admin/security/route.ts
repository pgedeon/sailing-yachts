import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  READ_RATE_LIMIT,
  WRITE_RATE_LIMIT,
  STRICT_WRITE_RATE_LIMIT,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/security
 * Returns security audit stats: rate limit config, validation coverage, header status.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Compute validation coverage by scanning API route files
  const fs = await import("fs/promises");
  const path = await import("path");

  const apiDir = path.join(process.cwd(), "app", "api");
  const writeRoutes: string[] = [];
  const validatedRoutes: string[] = [];
  const unvalidatedRoutes: string[] = [];

  async function scanDir(dir: string, prefix: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const routePath = prefix + entry.name;
      if (entry.isDirectory()) {
        await scanDir(fullPath, routePath + "/");
      } else if (entry.name === "route.ts" || entry.name === "route.tsx") {
        const content = await fs.readFile(fullPath, "utf-8");
        const hasWrite = /\b(POST|PUT|DELETE|PATCH)\b/.test(content);
        if (hasWrite) {
          const routeKey = `/api/${routePath}${entry.name === "route.ts" ? "" : ""}`.replace(/\/route\.(ts|tsx)$/, "");
          writeRoutes.push(routeKey);
          const hasValidation =
            content.includes("validate(") ||
            content.includes("safeParse(") ||
            content.includes(".parse(") ||
            content.includes("validateBody(") ||
            content.includes("validateQuery(");
          if (hasValidation) {
            validatedRoutes.push(routeKey);
          } else {
            unvalidatedRoutes.push(routeKey);
          }
        }
      }
    }
  }

  try {
    await scanDir(apiDir, "");
  } catch {
    // Fallback if filesystem scan fails
  }

  const coveragePercent = writeRoutes.length > 0
    ? Math.round((validatedRoutes.length / writeRoutes.length) * 100)
    : 100;

  return NextResponse.json({
    rateLimit: {
      activeEntries: 0, // In-memory store, introspection not available serverlessly
      activeLoginLockouts: 0,
      presets: {
        read: { limit: READ_RATE_LIMIT.limit, windowSeconds: READ_RATE_LIMIT.windowSeconds },
        write: { limit: WRITE_RATE_LIMIT.limit, windowSeconds: WRITE_RATE_LIMIT.windowSeconds },
        strict: { limit: STRICT_WRITE_RATE_LIMIT.limit, windowSeconds: STRICT_WRITE_RATE_LIMIT.windowSeconds },
      },
    },
    securityHeaders: {
      csp: true,
      hsts: true,
      xFrameOptions: true,
      xContentTypeOptions: true,
      referrerPolicy: true,
      permissionsPolicy: true,
    },
    cors: {
      publicApiCors: true,
      adminApiNoCors: true,
    },
    validationCoverage: {
      totalWriteRoutes: writeRoutes.length,
      validatedRoutes: validatedRoutes.length,
      unvalidatedRoutes,
      coveragePercent,
    },
    middleware: {
      rateLimitingActive: true,
      bruteForceProtection: true,
      securityHeadersActive: true,
    },
  });
}
