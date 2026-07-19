import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, newsletterCampaigns, newsletterSubscribers } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// POST — mark a campaign as sent, calculate recipients based on segment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await ensureSchema();
    const { id } = await params;
    const campaignId = parseInt(id, 10);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const [campaign] = await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "sent") {
      return NextResponse.json({ error: "Campaign already sent" }, { status: 400 });
    }

    // Calculate recipients based on target segment
    let recipientCount = 0;
    if (campaign.targetSegment && campaign.targetSegment !== "all") {
      // Count subscribers with the matching tag
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(newsletterSubscribers)
        .where(sql`${campaign.targetSegment} = ANY(${newsletterSubscribers.tags})`);
      recipientCount = result[0]?.count ?? 0;
    } else {
      // All subscribers
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(newsletterSubscribers);
      recipientCount = result[0]?.count ?? 0;
    }

    // Mark as sent
    const [updated] = await db
      .update(newsletterCampaigns)
      .set({
        status: "sent",
        sentAt: new Date(),
        recipientCount,
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, campaignId))
      .returning();

    return NextResponse.json({
      campaign: updated,
      recipientCount,
      message: `Campaign marked as sent to ${recipientCount} subscribers`,
    });
  } catch (error) {
    console.error("[newsletter/campaigns/[id]/send] error:", error);
    return NextResponse.json({ error: "Failed to send campaign" }, { status: 500 });
  }
}
