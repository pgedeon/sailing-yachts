import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { validate, revenueEventsSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/**
 * Revenue Events API Endpoint (P8.6)
 *
 * Receives batched revenue analytics events from the client
 * and stores them in the database for analysis.
 */

interface RevenueEventPayload {
  type: string;
  page: string;
  source: string;
  metadata?: Record<string, string | number | boolean | null>;
  timestamp: number;
  sessionId: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const validation = validate(revenueEventsSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const batch = validation.data.events;

    // Insert events into database
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIdx = 1;

    for (const event of batch) {
      placeholders.push(
        `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5})`
      );
      values.push(
        event.type,
        event.page,
        event.source,
        event.metadata ? JSON.stringify(event.metadata) : null,
        event.sessionId,
        new Date(event.timestamp).toISOString()
      );
      paramIdx += 6;
    }

    await pool.query(
      `INSERT INTO revenue_events (event_type, page, source, metadata, session_id, created_at)
       VALUES ${placeholders.join(", ")}`,
      values
    );

    return NextResponse.json({
      success: true,
      processed: batch.length,
    });
  } catch (error: any) {
    // If table doesn't exist yet, log to console instead of failing
    if (error?.message?.includes("revenue_events")) {
      console.log("[revenue-events] Table not found, logging to console:", {
        eventCount: (0),
      });
      return NextResponse.json({ success: true, processed: 0, fallback: true });
    }

    console.error("[revenue-events] Error processing events:", error);
    return NextResponse.json(
      { error: "Failed to process events" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/revenue-events — Get event summary for admin dashboard.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sp = request.nextUrl.searchParams;
    const days = parseInt(sp.get("days") || "30", 10);
    const eventType = sp.get("type");

    let whereClause = `WHERE created_at > NOW() - INTERVAL '1 day' * $1`;
    const params: any[] = [days];

    if (eventType) {
      whereClause += ` AND event_type = $${params.length + 1}`;
      params.push(eventType);
    }

    // Event counts by type
    const typeCounts = await pool.query(
      `SELECT event_type, COUNT(*) as count
       FROM revenue_events ${whereClause}
       GROUP BY event_type ORDER BY count DESC`,
      params
    );

    // Event counts by page
    const pageCounts = await pool.query(
      `SELECT page, COUNT(*) as count
       FROM revenue_events ${whereClause}
       GROUP BY page ORDER BY count DESC LIMIT 20`,
      params
    );

    // Daily event volume
    const dailyVolume = await pool.query(
      `SELECT DATE(created_at) as date, event_type, COUNT(*) as count
       FROM revenue_events ${whereClause}
       GROUP BY DATE(created_at), event_type
       ORDER BY date DESC, count DESC`,
      params
    );

    // Unique sessions
    const sessionCount = await pool.query(
      `SELECT COUNT(DISTINCT session_id) as count
       FROM revenue_events ${whereClause}`,
      params
    );

    return NextResponse.json({
      byType: typeCounts.rows,
      byPage: pageCounts.rows,
      daily: dailyVolume.rows,
      uniqueSessions: parseInt(sessionCount.rows[0]?.count || "0", 10),
      period: { days },
    });
  } catch (error: any) {
    console.error("[revenue-events] Error fetching summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch event summary" },
      { status: 500 }
    );
  }
}
