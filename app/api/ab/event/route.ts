import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { insertAbEvent } from "@/lib/ab-testing-service";
import { validateBody, abEventSchema } from "@/lib/api-validate";

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
    const validation = validateBody(abEventSchema, body);
    if (!validation.ok) return validation.response;

    const { experimentId, variantId, userId, eventType, metadata } = validation.data;

    const client = await pool.connect();
    try {
      await insertAbEvent(
        (sql, params) => client.query(sql, params),
        {
          experimentId,
          variantId,
          userId,
          eventType,
          metadata: metadata as Record<string, string> | undefined,
        },
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
