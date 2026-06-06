import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { insertAbEvent } from "@/lib/ab-testing-service";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * POST /api/ab/event
 *
 * Log an A/B test event (impression, conversion, or click).
 * Body: { experimentId, variantId, userId, eventType, metadata? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { experimentId, variantId, userId, eventType, metadata } = body;

    if (!experimentId || !variantId || !userId || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields: experimentId, variantId, userId, eventType" },
        { status: 400 },
      );
    }

    if (!["impression", "conversion", "click"].includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid eventType. Must be: impression, conversion, or click" },
        { status: 400 },
      );
    }

    const client = await pool.connect();
    try {
      await insertAbEvent(
        (sql, params) => client.query(sql, params),
        { experimentId, variantId, userId, eventType, metadata },
      );
    } finally {
      client.release();
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[AB Event] Error logging event:", error);
    return NextResponse.json(
      { error: "Failed to log event" },
      { status: 500 },
    );
  }
}
