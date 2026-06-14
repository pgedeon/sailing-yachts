import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, newsletterCampaigns, newsletterSponsorSlots } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

// GET — single campaign with sponsor slots and stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const sponsors = await db
      .select()
      .from(newsletterSponsorSlots)
      .where(eq(newsletterSponsorSlots.campaignId, campaignId));

    // Get open rate and click rate
    const openRate =
      campaign.recipientCount && campaign.recipientCount > 0
        ? ((campaign.openCount ?? 0) / campaign.recipientCount) * 100
        : 0;
    const clickRate =
      campaign.recipientCount && campaign.recipientCount > 0
        ? ((campaign.clickCount ?? 0) / campaign.recipientCount) * 100
        : 0;

    return NextResponse.json({
      campaign,
      sponsors,
      metrics: {
        openRate: Number(openRate.toFixed(1)),
        clickRate: Number(clickRate.toFixed(1)),
        revenue: Number(campaign.revenue ?? 0),
      },
    });
  } catch (error) {
    console.error("[newsletter/campaigns/[id]] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}

// PATCH — update campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const campaignId = parseInt(id, 10);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.preheader !== undefined) updates.preheader = body.preheader;
    if (body.bodyMarkdown !== undefined) updates.bodyMarkdown = body.bodyMarkdown;
    if (body.status !== undefined) updates.status = body.status;
    if (body.targetSegment !== undefined) updates.targetSegment = body.targetSegment;
    if (body.scheduledFor !== undefined) {
      updates.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
    }
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(newsletterCampaigns)
      .set(updates)
      .where(eq(newsletterCampaigns.id, campaignId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign: updated });
  } catch (error) {
    console.error("[newsletter/campaigns/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

// DELETE — delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const campaignId = parseInt(id, 10);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, campaignId));

    return NextResponse.json({ message: "Campaign deleted" });
  } catch (error) {
    console.error("[newsletter/campaigns/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
