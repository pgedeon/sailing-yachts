import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, newsletterCampaigns, newsletterOpens, newsletterSubscribers } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

// GET — tracking pixel for email opens
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    await ensureSchema();
    const { campaignId } = await params;
    const cId = parseInt(campaignId, 10);

    if (isNaN(cId)) {
      return new NextResponse(null, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const subscriberId = searchParams.get("s");
    const sId = subscriberId ? parseInt(subscriberId, 10) : null;

    // Record the open
    await db.insert(newsletterOpens).values({
      campaignId: cId,
      subscriberId: sId && !isNaN(sId) ? sId : null,
      userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 45) || null,
    });

    // Update campaign open count
    await db
      .update(newsletterCampaigns)
      .set({
        openCount: sql`${newsletterCampaigns.openCount} + 1`,
      })
      .where(eq(newsletterCampaigns.id, cId));

    // Update subscriber engagement score
    if (sId && !isNaN(sId)) {
      await db
        .update(newsletterSubscribers)
        .set({
          engagementScore: sql`COALESCE(${newsletterSubscribers.engagementScore}, 0) + 1`,
        })
        .where(eq(newsletterSubscribers.id, sId));
    }

    // Return 1x1 transparent GIF
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );

    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    // Still return the pixel to avoid breaking emails
    console.error("[newsletter/track/open] error:", error);
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new NextResponse(pixel, {
      headers: { "Content-Type": "image/gif" },
    });
  }
}
