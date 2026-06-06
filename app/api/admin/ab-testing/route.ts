import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getAbTestingDashboard } from "@/lib/ab-testing-service";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /api/admin/ab-testing
 *
 * Returns full A/B testing dashboard data with statistical analysis.
 * Query params:
 *   ?period=7d|30d|90d|all (default: all)
 */
export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") || "all";

  const client = await pool.connect();
  try {
    let since: string | undefined;
    const now = new Date();
    switch (period) {
      case "7d":
        since = new Date(now.getTime() - 7 * 86400000).toISOString();
        break;
      case "30d":
        since = new Date(now.getTime() - 30 * 86400000).toISOString();
        break;
      case "90d":
        since = new Date(now.getTime() - 90 * 86400000).toISOString();
        break;
    }

    const dashboard = await getAbTestingDashboard(
      (sql, params) => client.query(sql, params),
    );

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("[AB Testing Admin] Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch A/B testing data" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
