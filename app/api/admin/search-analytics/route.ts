/**
 * P24.4 — Search Intent Analysis API
 *
 * GET /api/admin/search-analytics?days=30&section=summary|queries|zero-results|filters|trends|gaps
 * Returns search analytics data for the admin dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getSearchAnalyticsDashboard,
  getSearchAnalyticsSummary,
  getTopQueries,
  getZeroResultQueries,
  getFilterUsage,
  getSearchDailyTrend,
  getContentGaps,
} from "@/lib/search-analytics-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = request.nextUrl.searchParams.get("days");
  const days = Math.min(
    Math.max(parseInt(daysParam || "30", 10) || 30, 1),
    365,
  );
  const section = request.nextUrl.searchParams.get("section");

  try {
    let data;

    switch (section) {
      case "summary":
        data = await getSearchAnalyticsSummary(days);
        break;
      case "queries":
        data = await getTopQueries(days);
        break;
      case "zero-results":
        data = await getZeroResultQueries(days);
        break;
      case "filters":
        data = await getFilterUsage(days);
        break;
      case "trends":
        data = await getSearchDailyTrend(days);
        break;
      case "gaps":
        data = await getContentGaps(days);
        break;
      default:
        data = await getSearchAnalyticsDashboard(days);
        break;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Search Analytics API] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to load search analytics", details: error.message },
      { status: 500 },
    );
  }
}
