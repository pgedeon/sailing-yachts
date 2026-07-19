import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAnalyticsDashboard } from "@/lib/analytics-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics — Get full analytics data for the admin dashboard.
 *
 * Query params:
 *   days: number (default 30) — lookback period in days
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const days = parseInt(
      request.nextUrl.searchParams.get("days") || "30",
      10,
    );
    const clampedDays = Math.max(1, Math.min(365, days));

    const data = await getAdminAnalyticsDashboard(clampedDays);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[admin/analytics] Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
