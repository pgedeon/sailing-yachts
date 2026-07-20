/**
 * Verification API — run yacht data verification pipeline.
 *
 * POST /api/admin/verify-models?limit=20
 * GET /api/admin/verify-models  (status)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  runVerificationPipeline,
  getVerificationStatus,
} from "@/lib/enrichment/verification-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for verification runs

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getVerificationStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get status", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10) || 20,
      50,
    );
    const dryRun = searchParams.get("dryRun") === "true";

    const stats = await runVerificationPipeline({ limit, dryRun });

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Verification failed", details: error.message },
      { status: 500 },
    );
  }
}
