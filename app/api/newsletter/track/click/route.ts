import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, newsletterCampaigns, newsletterClicks, newsletterSubscribers } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET — redirect and track click
export async function GET(request: NextRequest) {
  try {
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const campaignId = searchParams.get("c");
    const subscriberId = searchParams.get("s");
    const label = searchParams.get("label");

    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    const cId = campaignId ? parseInt(campaignId, 10) : null;
    const sId = subscriberId ? parseInt(subscriberId, 10) : null;

    // Record the click
    if (cId && !isNaN(cId)) {
      await db.insert(newsletterClicks).values({
        campaignId: cId,
        subscriberId: sId && !isNaN(sId) ? sId : null,
        url: url.slice(0, 500),
        linkLabel: label || null,
      });

      // Update campaign click count
      await db
        .update(newsletterCampaigns)
        .set({
          clickCount: sql`${newsletterCampaigns.clickCount} + 1`,
        })
        .where(eq(newsletterCampaigns.id, cId));

      // Update subscriber engagement
      if (sId && !isNaN(sId)) {
        await db
          .update(newsletterSubscribers)
          .set({
            engagementScore: sql`COALESCE(${newsletterSubscribers.engagementScore}, 0) + 3`,
          })
          .where(eq(newsletterSubscribers.id, sId));
      }
    }

    // Redirect to the actual URL
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    console.error("[newsletter/track/click] error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}
