import { NextResponse } from "next/server";
import { benchmarkHotQueries } from "@/lib/query-timing";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/query-benchmark
 * Run EXPLAIN ANALYZE on hot queries and return timing results.
 * Admin-only: requires ADMIN_API_KEY header.
 */
export async function GET(request: Request) {
  const apiKey = request.headers.get("x-admin-api-key");
  if (
    !apiKey ||
    apiKey !== process.env.ADMIN_API_KEY
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await benchmarkHotQueries();

    const summary = {
      timestamp: new Date().toISOString(),
      totalQueries: results.length,
      queries: results.map((r) => ({
        query: r.query,
        durationMs: r.durationMs,
        rows: r.rows,
        planSummary: r.planSummary.split("\n")[0], // Top-level plan only
      })),
      slowest: results.reduce((a, b) =>
        a.durationMs > b.durationMs ? a : b,
      ).query,
      avgMs:
        Math.round(
          (results.reduce((sum, r) => sum + r.durationMs, 0) /
            results.length) *
            100,
        ) / 100,
    };

    return NextResponse.json(summary);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Benchmark failed", details: message },
      { status: 500 },
    );
  }
}
