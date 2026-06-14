import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, newsletterCampaigns, newsletterSubscribers, newsletterSponsorSlots } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET — list all campaigns with stats
export async function GET(request: NextRequest) {
  try {
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // draft, scheduled, sent, or null for all

    let query = db.select().from(newsletterCampaigns).$dynamic();
    if (status) {
      query = query.where(eq(newsletterCampaigns.status, status));
    }

    const campaigns = await query.orderBy(desc(newsletterCampaigns.createdAt)).limit(100);

    // Compute aggregate stats
    const stats = {
      totalCampaigns: campaigns.length,
      totalSent: campaigns.filter((c: any) => c.status === "sent").length,
      totalRecipients: campaigns.reduce((sum: number, c: any) => sum + (c.recipientCount ?? 0), 0),
      totalOpens: campaigns.reduce((sum: number, c: any) => sum + (c.openCount ?? 0), 0),
      totalClicks: campaigns.reduce((sum: number, c: any) => sum + (c.clickCount ?? 0), 0),
      totalRevenue: campaigns.reduce((sum: number, c: any) => Number(c.revenue ?? 0) + sum, 0),
    };

    // Get subscriber stats
    const subscriberCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsletterSubscribers);
    const confirmedCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.confirmed, true));

    // Get all unique tags across subscribers
    const tagsResult = await db.execute(
      sql`SELECT DISTINCT unnest(tags) as tag FROM newsletter_subscribers WHERE tags != '{}'::text[] ORDER BY tag`
    );

    return NextResponse.json({
      campaigns,
      stats: {
        ...stats,
        totalSubscribers: subscriberCount[0]?.count ?? 0,
        confirmedSubscribers: confirmedCount[0]?.count ?? 0,
        availableTags: (tagsResult.rows as any[]).map((r) => r.tag),
      },
    });
  } catch (error) {
    console.error("[newsletter/campaigns] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

// POST — create a new campaign
export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const body = await request.json();
    const { subject, preheader, bodyMarkdown, targetSegment, scheduledFor, sponsorSlots } = body;

    if (!subject?.trim()) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!bodyMarkdown?.trim()) {
      return NextResponse.json({ error: "Body content is required" }, { status: 400 });
    }

    // Calculate total revenue from sponsor slots
    let totalRevenue = 0;
    if (sponsorSlots && Array.isArray(sponsorSlots)) {
      totalRevenue = sponsorSlots.reduce((sum: number, s: any) => sum + Number(s.revenue || 0), 0);
    }

    const [campaign] = await db
      .insert(newsletterCampaigns)
      .values({
        subject: subject.trim(),
        preheader: preheader?.trim() || null,
        bodyMarkdown: bodyMarkdown.trim(),
        status: scheduledFor ? "scheduled" : "draft",
        targetSegment: targetSegment || null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        revenue: totalRevenue.toFixed(2),
      })
      .returning();

    // Insert sponsor slots if provided
    if (sponsorSlots && Array.isArray(sponsorSlots) && sponsorSlots.length > 0) {
      for (const slot of sponsorSlots) {
        await db.insert(newsletterSponsorSlots).values({
          campaignId: campaign.id,
          sponsorName: slot.sponsorName,
          sponsorLogo: slot.sponsorLogo || null,
          headline: slot.headline,
          bodyText: slot.bodyText || null,
          ctaText: slot.ctaText || "Learn More",
          ctaUrl: slot.ctaUrl,
          slotPosition: slot.slotPosition || "middle",
          revenue: Number(slot.revenue || 0).toFixed(2),
        });
      }
    }

    return NextResponse.json({ campaign, message: "Campaign created" }, { status: 201 });
  } catch (error) {
    console.error("[newsletter/campaigns] POST error:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
