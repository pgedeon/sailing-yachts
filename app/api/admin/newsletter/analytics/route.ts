import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, newsletterCampaigns, newsletterOpens, newsletterClicks, newsletterSubscribers, newsletterSponsorSlots } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET — newsletter monetization analytics dashboard data
// P27.1: Parallelized independent queries to reduce latency
export async function GET(request: NextRequest) {
  try {
    await ensureSchema();

    // P27.1: Run all independent queries in parallel
    const [
      totalSubscribersResult,
      totalCampaignsResult,
      sentCampaignsResult,
      sponsorshipRevenueResult,
      topSubscribers,
      recentCampaigns,
      growth,
      tagStats,
    ] = await Promise.all([
      // Total subscriber count
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(newsletterSubscribers),

      // Total campaign count
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(newsletterCampaigns),

      // Sent campaign aggregated stats
      db
        .select({
          count: sql<number>`count(*)::int`,
          totalRecipients: sql<number>`COALESCE(sum(${newsletterCampaigns.recipientCount}), 0)::int`,
          totalOpens: sql<number>`COALESCE(sum(${newsletterCampaigns.openCount}), 0)::int`,
          totalClicks: sql<number>`COALESCE(sum(${newsletterCampaigns.clickCount}), 0)::int`,
          totalRevenue: sql<number>`COALESCE(sum(${newsletterCampaigns.revenue}), 0)::numeric(10,2)`,
        })
        .from(newsletterCampaigns)
        .where(eq(newsletterCampaigns.status, "sent")),

      // Revenue from sponsorships
      db
        .select({
          total: sql<number>`COALESCE(sum(${newsletterSponsorSlots.revenue}), 0)::numeric(10,2)`,
          count: sql<number>`count(*)::int`,
        })
        .from(newsletterSponsorSlots),

      // Top engaging subscribers (by engagement score)
      db
        .select({
          id: newsletterSubscribers.id,
          email: newsletterSubscribers.email,
          engagementScore: newsletterSubscribers.engagementScore,
          tags: newsletterSubscribers.tags,
        })
        .from(newsletterSubscribers)
        .orderBy(desc(newsletterSubscribers.engagementScore))
        .limit(10),

      // Recent campaigns
      db
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
        .limit(10),

      // Subscriber growth (last 30 days)
      db.execute(sql`
        SELECT
          d::date as date,
          COUNT(s.id)::int as new_subscribers
        FROM generate_series(NOW() - INTERVAL '29 days', NOW(), '1 day') d
        LEFT JOIN newsletter_subscribers s ON DATE(s.created_at) = d::date
        GROUP BY d::date
        ORDER BY d::date
      `),

      // All unique tags with counts
      db.execute(sql`
        SELECT tag, COUNT(*)::int as count
        FROM (
          SELECT unnest(tags) as tag FROM newsletter_subscribers WHERE tags != '{}'::text[]
        ) sub
        GROUP BY tag
        ORDER BY count DESC
      `),
    ]);

    const s = sentCampaignsResult[0];
    const overallOpenRate =
      s && s.totalRecipients > 0 ? Number(((s.totalOpens / s.totalRecipients) * 100).toFixed(1)) : 0;
    const overallClickRate =
      s && s.totalRecipients > 0 ? Number(((s.totalClicks / s.totalRecipients) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      overview: {
        totalSubscribers: totalSubscribersResult[0]?.count ?? 0,
        totalCampaigns: totalCampaignsResult[0]?.count ?? 0,
        sentCampaigns: s?.count ?? 0,
        totalRecipients: s?.totalRecipients ?? 0,
        totalOpens: s?.totalOpens ?? 0,
        totalClicks: s?.totalClicks ?? 0,
        overallOpenRate,
        overallClickRate,
        campaignRevenue: Number(s?.totalRevenue ?? 0),
        sponsorshipRevenue: Number(sponsorshipRevenueResult[0]?.total ?? 0),
        totalSponsors: sponsorshipRevenueResult[0]?.count ?? 0,
        totalRevenue: Number(s?.totalRevenue ?? 0) + Number(sponsorshipRevenueResult[0]?.total ?? 0),
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
