import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, newsletterCampaigns, newsletterOpens, newsletterClicks, newsletterSubscribers, newsletterSponsorSlots } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET — newsletter monetization analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    await ensureSchema();

    // Overall stats
    const totalSubscribers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsletterSubscribers);

    const totalCampaigns = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsletterCampaigns);

    const sentCampaigns = await db
      .select({
        count: sql<number>`count(*)::int`,
        totalRecipients: sql<number>`COALESCE(sum(${newsletterCampaigns.recipientCount}), 0)::int`,
        totalOpens: sql<number>`COALESCE(sum(${newsletterCampaigns.openCount}), 0)::int`,
        totalClicks: sql<number>`COALESCE(sum(${newsletterCampaigns.clickCount}), 0)::int`,
        totalRevenue: sql<number>`COALESCE(sum(${newsletterCampaigns.revenue}), 0)::numeric(10,2)`,
      })
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.status, "sent"));

    const s = sentCampaigns[0];
    const overallOpenRate =
      s && s.totalRecipients > 0 ? Number(((s.totalOpens / s.totalRecipients) * 100).toFixed(1)) : 0;
    const overallClickRate =
      s && s.totalRecipients > 0 ? Number(((s.totalClicks / s.totalRecipients) * 100).toFixed(1)) : 0;

    // Revenue from sponsorships
    const sponsorshipRevenue = await db
      .select({
        total: sql<number>`COALESCE(sum(${newsletterSponsorSlots.revenue}), 0)::numeric(10,2)`,
        count: sql<number>`count(*)::int`,
      })
      .from(newsletterSponsorSlots);

    // Top engaging subscribers (by engagement score)
    const topSubscribers = await db
      .select({
        id: newsletterSubscribers.id,
        email: newsletterSubscribers.email,
        engagementScore: newsletterSubscribers.engagementScore,
        tags: newsletterSubscribers.tags,
      })
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.engagementScore))
      .limit(10);

    // Recent campaigns
    const recentCampaigns = await db
      .select({
        id: newsletterCampaigns.id,
        subject: newsletterCampaigns.subject,
        status: newsletterCampaigns.status,
        sentAt: newsletterCampaigns.sentAt,
        recipientCount: newsletterCampaigns.recipientCount,
        openCount: newsletterCampaigns.openCount,
        clickCount: newsletterCampaigns.clickCount,
        revenue: newsletterCampaigns.revenue,
      })
      .from(newsletterCampaigns)
      .orderBy(desc(newsletterCampaigns.createdAt))
      .limit(10);

    // Subscriber growth (last 30 days)
    const growth = await db.execute(sql`
      SELECT
        d::date as date,
        COUNT(s.id)::int as new_subscribers
      FROM generate_series(NOW() - INTERVAL '29 days', NOW(), '1 day') d
      LEFT JOIN newsletter_subscribers s ON DATE(s.created_at) = d::date
      GROUP BY d::date
      ORDER BY d::date
    `);

    // All unique tags with counts
    const tagStats = await db.execute(sql`
      SELECT tag, COUNT(*)::int as count
      FROM (
        SELECT unnest(tags) as tag FROM newsletter_subscribers WHERE tags != '{}'::text[]
      ) sub
      GROUP BY tag
      ORDER BY count DESC
    `);

    return NextResponse.json({
      overview: {
        totalSubscribers: totalSubscribers[0]?.count ?? 0,
        totalCampaigns: totalCampaigns[0]?.count ?? 0,
        sentCampaigns: s?.count ?? 0,
        totalRecipients: s?.totalRecipients ?? 0,
        totalOpens: s?.totalOpens ?? 0,
        totalClicks: s?.totalClicks ?? 0,
        overallOpenRate,
        overallClickRate,
        campaignRevenue: Number(s?.totalRevenue ?? 0),
        sponsorshipRevenue: Number(sponsorshipRevenue[0]?.total ?? 0),
        totalSponsors: sponsorshipRevenue[0]?.count ?? 0,
        totalRevenue: Number(s?.totalRevenue ?? 0) + Number(sponsorshipRevenue[0]?.total ?? 0),
      },
      recentCampaigns,
      topSubscribers,
      subscriberGrowth: (growth.rows as any[]).map((r) => ({
        date: r.date,
        newSubscribers: r.new_subscribers,
      })),
      tagDistribution: (tagStats.rows as any[]).map((r) => ({
        tag: r.tag,
        count: r.count,
      })),
    });
  } catch (error) {
    console.error("[newsletter/analytics] error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
