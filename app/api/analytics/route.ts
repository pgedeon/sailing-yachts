import { NextRequest, NextResponse } from "next/server";
import { insertAnalyticsEvents } from "@/lib/analytics-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/analytics — Collect batched analytics events from the client.
 *
 * Accepts an array of events and inserts them into the database.
 * Rate-limited to 50 events per batch. Silently fails to avoid breaking UX.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const events = body.events;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "No events provided" },
        { status: 400 },
      );
    }

    // Limit batch size
    const batch = events.slice(0, 50);

    const processed = await insertAnalyticsEvents(
      batch.map((e: any) => ({
        eventType: e.eventType,
        page: e.page || "/",
        entityId: e.entityId,
        entityType: e.entityType,
        sessionId: e.sessionId || "unknown",
        metadata: e.metadata,
        referrer: e.referrer,
        userAgent: undefined, // Don't store user agents from client for privacy
      })),
    );

    return NextResponse.json({ success: true, processed });
  } catch (error: any) {
    // If table doesn't exist yet, log to console instead of failing
    if (error?.message?.includes("analytics_events")) {
      console.log("[analytics] Table not found, skipping events");
      return NextResponse.json({
        success: true,
        processed: 0,
        fallback: true,
      });
    }

    console.error("[analytics] Error processing events:", error);
    return NextResponse.json(
      { error: "Failed to process events" },
      { status: 500 },
    );
  }
}
