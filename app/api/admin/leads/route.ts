import { NextRequest, NextResponse } from "next/server";
import { db, leads } from "@/lib/db";
import { desc, sql, eq, and, isNotNull } from "drizzle-orm";
import { scoreLead, explainScore, DEFAULT_ROUTING } from "@/lib/lead-scoring";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/leads?action=scored | insights | priority | score-all
 * - scored: returns scored leads sorted by score desc
 * - insights: returns score distribution stats
 * - priority: returns hot leads (score >= 60)
 * - score-all: rescores all unscored leads
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "scored";

  try {
    switch (action) {
      case "score-all": {
        // Find all unscored leads
        const unscored = await db.select().from(leads).where(sql`${leads.score} IS NULL`).limit(500);
        let scored = 0;

        for (const lead of unscored) {
          // Count existing leads from same email
          const existingCount = await db.select({ count: sql<number>`count(*)::int` })
            .from(leads)
            .where(and(eq(leads.email, lead.email), sql`${leads.id} < ${lead.id}`));

          const result = scoreLead({
            leadType: lead.leadType,
            yachtIds: lead.yachtIds,
            utmSource: lead.utmSource,
            utmMedium: lead.utmMedium,
            phone: lead.phone,
            message: lead.message,
            email: lead.email,
            createdAt: lead.createdAt,
            existingLeadCount: existingCount[0]?.count ?? 0,
          });

          await db.update(leads)
            .set({
              score: result.total,
              scoredAt: new Date(),
              status: result.tier === "hot" ? DEFAULT_ROUTING.autoPriorityStatus : lead.status,
            })
            .where(eq(leads.id, lead.id));

          scored++;
        }

        return NextResponse.json({ scored, message: `Scored ${scored} leads` });
      }

      case "priority": {
        const hot = await db.select().from(leads)
          .where(sql`${leads.score} >= ${DEFAULT_ROUTING.hotMinScore}`)
          .orderBy(desc(leads.score))
          .limit(50);

        return NextResponse.json({ leads: hot, count: hot.length });
      }

      case "insights": {
        const stats = await db.select({
          total: sql<number>`count(*)::int`,
          scored: sql<number>`count(${leads.score})::int`,
          avgScore: sql<number>`round(avg(${leads.score})::numeric, 1)`,
          hotCount: sql<number>`count(*) filter (where ${leads.score} >= 60)`,
          warmCount: sql<number>`count(*) filter (where ${leads.score} >= 35 and ${leads.score} < 60)`,
          coldCount: sql<number>`count(*) filter (where ${leads.score} < 35 and ${leads.score} is not null)`,
          unscoredCount: sql<number>`count(*) filter (where ${leads.score} is null)`,
        }).from(leads);

        return NextResponse.json(stats[0]);
      }

      case "scored":
      default: {
        const scored = await db.select().from(leads)
          .where(isNotNull(leads.score))
          .orderBy(desc(leads.score))
          .limit(100);

        const enriched = scored.map((lead: any) => ({
          ...lead,
          tier: (lead.score ?? 0) >= 60 ? "hot" : (lead.score ?? 0) >= 35 ? "warm" : "cold",
          explanation: explainScore(scoreLead({
            leadType: lead.leadType,
            yachtIds: lead.yachtIds,
            utmSource: lead.utmSource,
            utmMedium: lead.utmMedium,
            phone: lead.phone,
            message: lead.message,
            email: lead.email,
            createdAt: lead.createdAt,
          })),
        }));

        return NextResponse.json({ leads: enriched, count: enriched.length });
      }
    }
  } catch (error) {
    console.error("Lead scoring error:", error);
    return NextResponse.json({ error: "Failed to process leads" }, { status: 500 });
  }
}

/**
 * POST /api/admin/leads — Score a single lead by ID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId required" }, { status: 400 });
    }

    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const existingCount = await db.select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(and(eq(leads.email, lead.email), sql`${leads.id} < ${lead.id}`));

    const result = scoreLead({
      leadType: lead.leadType,
      yachtIds: lead.yachtIds,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      phone: lead.phone,
      message: lead.message,
      email: lead.email,
      createdAt: lead.createdAt,
      existingLeadCount: existingCount[0]?.count ?? 0,
    });

    await db.update(leads)
      .set({
        score: result.total,
        scoredAt: new Date(),
        ...(result.tier === "hot" ? { status: DEFAULT_ROUTING.autoPriorityStatus } : {}),
      })
      .where(eq(leads.id, lead.id));

    return NextResponse.json({
      leadId,
      score: result.total,
      tier: result.tier,
      signals: result.signals,
      explanation: explainScore(result),
    });
  } catch (error) {
    console.error("Lead scoring error:", error);
    return NextResponse.json({ error: "Failed to score lead" }, { status: 500 });
  }
}
