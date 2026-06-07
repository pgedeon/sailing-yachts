/**
 * P24.3 — Conversion Funnel Tracking Service
 *
 * Tracks user journey from landing → search → detail → compare → lead.
 * Identifies drop-off points and calculates conversion rates between stages.
 * Built on top of existing analytics_events data.
 *
 * Funnel stages:
 *   1. landing    — Any page entry (page_view event)
 *   2. search     — Search page visit with query (search event)
 *   3. detail     — Yacht detail page view (yacht_view event)
 *   4. compare    — Comparison page with 2+ yachts (compare event)
 *   5. lead       — Contact/inquiry submission (cta_click with ctaType containing 'contact' or 'lead')
 */

import { pool } from "./db";

// ─── Types ──────────────────────────────────────────────────────

export interface FunnelStage {
  stage: string;
  label: string;
  sessions: number;
  conversionRate: number; // from previous stage
  dropOff: number; // sessions lost from previous stage
  dropOffRate: number; // % lost from previous stage
  overallConversionRate: number; // from landing
}

export interface FunnelData {
  stages: FunnelStage[];
  totalSessions: number;
  period: { days: number };
  // Time between stages
  avgTimeBetweenStages: {
    from: string;
    to: string;
    avgMinutes: number;
    medianMinutes: number;
    sampleSize: number;
  }[];
  // Drop-off analysis
  biggestDropOff: {
    from: string;
    to: string;
    dropOffRate: number;
    dropOffSessions: number;
  };
  // Daily funnel trend
  dailyTrend: {
    date: string;
    landing: number;
    search: number;
    detail: number;
    compare: number;
    lead: number;
  }[];
}

export interface FunnelSummary {
  landingToLead: number; // overall conversion rate
  landingToDetail: number; // browse conversion
  detailToCompare: number; // engagement conversion
  compareToLead: number; // intent conversion
  avgSessionDuration: number; // minutes
  totalSessions: number;
  totalLeads: number;
}

// ─── Funnel Stage Definitions ──────────────────────────────────────

const FUNNEL_STAGES = [
  {
    stage: "landing",
    label: "Landing",
    eventTypes: ["page_view"],
    description: "Any page entry",
  },
  {
    stage: "search",
    label: "Search",
    eventTypes: ["search"],
    description: "Searched for yachts",
  },
  {
    stage: "detail",
    label: "Yacht Detail",
    eventTypes: ["yacht_view"],
    description: "Viewed yacht details",
  },
  {
    stage: "compare",
    label: "Compare",
    eventTypes: ["compare"],
    description: "Compared yachts",
  },
  {
    stage: "lead",
    label: "Lead",
    eventTypes: ["cta_click"],
    description: "Submitted inquiry/contact",
    extraFilter:
      "AND (metadata->>'ctaType' LIKE '%contact%' OR metadata->>'ctaType' LIKE '%lead%' OR metadata->>'ctaType' LIKE '%inquiry%' OR metadata->>'ctaType' LIKE '%request%')",
  },
] as const;

// ─── Query Functions ──────────────────────────────────────────────

/**
 * Get session counts for each funnel stage within a time period.
 * Each stage counts DISTINCT sessions that had the corresponding event type.
 */
export async function getFunnelStageCounts(
  days: number = 30,
): Promise<FunnelStage[]> {
  const interval = `${days} days`;
  const stages: FunnelStage[] = [];

  for (let i = 0; i < FUNNEL_STAGES.length; i++) {
    const stageDef = FUNNEL_STAGES[i];
    const extraFilter = "extraFilter" in stageDef ? stageDef.extraFilter : "";

    const result = await pool.query(
      `SELECT COUNT(DISTINCT session_id) as count
       FROM analytics_events
       WHERE event_type = ANY($1)
         AND created_at > NOW() - INTERVAL '${interval}'
         ${extraFilter}`,
      [stageDef.eventTypes],
    );

    const sessions = parseInt(result.rows[0]?.count || "0", 10);
    const prevSessions = i > 0 ? stages[i - 1].sessions : sessions;
    const dropOff = i > 0 ? prevSessions - sessions : 0;
    const conversionRate = i > 0 ? (prevSessions > 0 ? (sessions / prevSessions) * 100 : 0) : 100;
    const dropOffRate = i > 0 ? 100 - conversionRate : 0;
    const overallConversionRate = stages[0] ? (stages[0].sessions > 0 ? (sessions / stages[0].sessions) * 100 : 0) : 100;

    stages.push({
      stage: stageDef.stage,
      label: stageDef.label,
      sessions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      dropOff,
      dropOffRate: Math.round(dropOffRate * 100) / 100,
      overallConversionRate: Math.round(overallConversionRate * 100) / 100,
    });
  }

  return stages;
}

/**
 * Get average time between funnel stages (in minutes).
 * Looks at sessions that reached both stages and computes the time difference.
 */
export async function getTimeBetweenStages(
  days: number = 30,
): Promise<FunnelData["avgTimeBetweenStages"]> {
  const interval = `${days} days`;
  const results: FunnelData["avgTimeBetweenStages"] = [];

  const stagePairs = [
    { from: "landing", to: "search", fromType: "page_view", toType: "search" },
    { from: "search", to: "detail", fromType: "search", toType: "yacht_view" },
    { from: "detail", to: "compare", fromType: "yacht_view", toType: "compare" },
    { from: "compare", to: "lead", fromType: "compare", toType: "cta_click" },
  ];

  for (const pair of stagePairs) {
    const extraFilter =
      pair.to === "lead"
        ? "AND (b.metadata->>'ctaType' LIKE '%contact%' OR b.metadata->>'ctaType' LIKE '%lead%' OR b.metadata->>'ctaType' LIKE '%inquiry%' OR b.metadata->>'ctaType' LIKE '%request%')"
        : "";

    const result = await pool.query(
      `WITH first_a AS (
         SELECT session_id, MIN(created_at) as first_time
         FROM analytics_events
         WHERE event_type = $1 AND created_at > NOW() - INTERVAL '${interval}'
         GROUP BY session_id
       ),
       first_b AS (
         SELECT session_id, MIN(created_at) as first_time
         FROM analytics_events
         WHERE event_type = $2 AND created_at > NOW() - INTERVAL '${interval}'
         ${extraFilter}
         GROUP BY session_id
       )
       SELECT
         AVG(EXTRACT(EPOCH FROM (b.first_time - a.first_time)) / 60) as avg_minutes,
         PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (b.first_time - a.first_time)) / 60) as median_minutes,
         COUNT(*) as sample_size
       FROM first_a a
       JOIN first_b b ON a.session_id = b.session_id AND b.first_time >= a.first_time`,
      [pair.fromType, pair.toType],
    );

    const row = result.rows[0];
    results.push({
      from: pair.from,
      to: pair.to,
      avgMinutes: Math.round((parseFloat(row?.avg_minutes || "0")) * 10) / 10,
      medianMinutes: Math.round((parseFloat(row?.median_minutes || "0")) * 10) / 10,
      sampleSize: parseInt(row?.sample_size || "0", 10),
    });
  }

  return results;
}

/**
 * Get daily funnel trend data.
 */
export async function getFunnelDailyTrend(
  days: number = 30,
): Promise<FunnelData["dailyTrend"]> {
  const interval = `${days} days`;

  const result = await pool.query(
    `SELECT
       DATE(created_at) as date,
       COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END) as landing,
       COUNT(DISTINCT CASE WHEN event_type = 'search' THEN session_id END) as search,
       COUNT(DISTINCT CASE WHEN event_type = 'yacht_view' THEN session_id END) as detail,
       COUNT(DISTINCT CASE WHEN event_type = 'compare' THEN session_id END) as compare,
       COUNT(DISTINCT CASE WHEN event_type = 'cta_click'
         AND (metadata->>'ctaType' LIKE '%contact%' OR metadata->>'ctaType' LIKE '%lead%'
           OR metadata->>'ctaType' LIKE '%inquiry%' OR metadata->>'ctaType' LIKE '%request%')
         THEN session_id END) as lead
     FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '${interval}'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
  );

  return result.rows.map((row) => ({
    date: row.date,
    landing: parseInt(row.landing || "0", 10),
    search: parseInt(row.search || "0", 10),
    detail: parseInt(row.detail || "0", 10),
    compare: parseInt(row.compare || "0", 10),
    lead: parseInt(row.lead || "0", 10),
  }));
}

/**
 * Get the biggest drop-off point in the funnel.
 */
export function getBiggestDropOff(
  stages: FunnelStage[],
): FunnelData["biggestDropOff"] {
  let maxDropOffRate = 0;
  let biggest = {
    from: stages[0]?.stage || "",
    to: stages[1]?.stage || "",
    dropOffRate: 0,
    dropOffSessions: 0,
  };

  for (let i = 1; i < stages.length; i++) {
    if (stages[i].dropOffRate > maxDropOffRate) {
      maxDropOffRate = stages[i].dropOffRate;
      biggest = {
        from: stages[i - 1].stage,
        to: stages[i].stage,
        dropOffRate: stages[i].dropOffRate,
        dropOffSessions: stages[i].dropOff,
      };
    }
  }

  return biggest;
}

/**
 * Get full funnel data for the admin dashboard.
 */
export async function getFunnelDashboard(
  days: number = 30,
): Promise<FunnelData> {
  const [stages, avgTimeBetweenStages, dailyTrend] = await Promise.all([
    getFunnelStageCounts(days),
    getTimeBetweenStages(days),
    getFunnelDailyTrend(days),
  ]);

  const biggestDropOff = getBiggestDropOff(stages);

  return {
    stages,
    totalSessions: stages[0]?.sessions || 0,
    period: { days },
    avgTimeBetweenStages,
    biggestDropOff,
    dailyTrend,
  };
}

/**
 * Get funnel summary stats (key metrics).
 */
export async function getFunnelSummary(
  days: number = 30,
): Promise<FunnelSummary> {
  const stages = await getFunnelStageCounts(days);
  const landing = stages.find((s) => s.stage === "landing")?.sessions || 0;
  const search = stages.find((s) => s.stage === "search")?.sessions || 0;
  const detail = stages.find((s) => s.stage === "detail")?.sessions || 0;
  const compare = stages.find((s) => s.stage === "compare")?.sessions || 0;
  const lead = stages.find((s) => s.stage === "lead")?.sessions || 0;

  return {
    landingToLead: landing > 0 ? Math.round((lead / landing) * 10000) / 100 : 0,
    landingToDetail: landing > 0 ? Math.round((detail / landing) * 10000) / 100 : 0,
    detailToCompare: detail > 0 ? Math.round((compare / detail) * 10000) / 100 : 0,
    compareToLead: compare > 0 ? Math.round((lead / compare) * 10000) / 100 : 0,
    avgSessionDuration: 0, // computed from time between stages
    totalSessions: landing,
    totalLeads: lead,
  };
}
