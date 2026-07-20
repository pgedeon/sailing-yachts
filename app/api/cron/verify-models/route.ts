/**
 * Cron: Yacht model data verification.
 *
 * Runs daily, verifies a batch of models against sailwiki.com and other sources.
 * Protected by CRON_SECRET.
 *
 * Schedule: Daily at 06:00 UTC (configured in vercel.json)
 */

import { NextRequest, NextResponse } from "next/server";
import { runVerificationPipeline } from "@/lib/enrichment/verification-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await runVerificationPipeline({ limit: 20 });
    return NextResponse.json({ success: true, ...stats });
  } catch (error: any) {
    console.error("[Cron] Verification error:", error.message);
    return NextResponse.json(
      { error: "Verification failed", details: error.message },
      { status: 500 },
    );
  }
}
