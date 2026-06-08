/**
 * P24.5 — Competitive Positioning Matrix API
 *
 * GET /api/admin/competitive-positioning
 * Returns competitive positioning data for all manufacturers.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCompetitiveMatrix } from "@/lib/competitive-positioning-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getCompetitiveMatrix();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Competitive Positioning API] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to load competitive data", details: error.message },
      { status: 500 },
    );
  }
}
