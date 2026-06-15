import { NextRequest, NextResponse } from "next/server";
import { insertAnalyticsEvents } from "@/lib/analytics-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const analyticsEventSchema = z.object({
  eventType: z.enum([
    "page_view", "search", "compare", "yacht_view",
    "manufacturer_view", "guide_view", "cta_click",
    "share", "filter_use", "rating", "email_yacht", "featured_view",
  ]),
  page: z.string().max(2000).optional().default("/"),
  entityId: z.number().optional(),
  entityType: z.enum(["yacht", "manufacturer", "guide", "comparison"]).optional(),
  sessionId: z.string().max(200).optional().default("unknown"),
  metadata: z.record(z.string(), z.unknown()).optional(),
  referrer: z.string().max(2000).optional(),
});

const analyticsSchema = z.object({
  events: z.array(analyticsEventSchema).min(1).max(50),
});

/**
 * POST /api/analytics — Collect batched analytics events from the client.
 *
 * Accepts an array of events and inserts them into the database.
 * Rate-limited to 50 events per batch. Silently fails to avoid breaking UX.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const parsed = analyticsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid analytics payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const batch = parsed.data.events;

    const processed = await insertAnalyticsEvents(
      batch.map((e) => ({
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
