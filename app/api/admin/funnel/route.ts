/**
 * P24.3 — Funnel Tracking API
 *
 * GET /api/admin/funnel?days=30
 * Returns conversion funnel data with stages, drop-off analysis, and daily trends.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFunnelDashboard, getFunnelSummary } from "@/lib/funnel-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = request.nextUrl.searchParams.get("days");
  const days = Math.min(Math.max(parseInt(daysParam || "30", 10) || 30, 1), 365);

  const viewParam = request.nextUrl.searchParams.get("view");
  const isSummary = viewParam === "summary";

  try {
    const data = isSummary
      ? await getFunnelSummary(days)
      : await getFunnelDashboard(days);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Funnel API] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to load funnel data", details: error.message },
      { status: 500 },
    );
  }
}
