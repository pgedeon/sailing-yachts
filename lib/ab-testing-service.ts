/**
 * P24.2 — A/B Testing Admin Service
 *
 * Provides experiment management, event tracking, and statistical analysis.
 * Builds on the deterministic variant assignment in ab-testing.ts.
 */

import { EXPERIMENTS, type ExperimentId, type ExperimentDefinition } from "./ab-testing";

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

export interface AbEventRow {
  id: number;
  experiment_id: string;
  variant_id: string;
  user_id: string;
  event_type: "impression" | "conversion" | "click";
  metadata: Record<string, string>;
  created_at: string;
}

export interface VariantStats {
  variantId: string;
  variantName: string;
  impressions: number;
  conversions: number;
  clicks: number;
  conversionRate: number;
  clickRate: number;
  standardError: number;
  confidenceInterval95: [number, number];
}

export interface SignificanceResult {
  isSignificant: boolean;
  pValue: number;
  confidenceLevel: number;
  winner: string | null;
  improvementPercent: number | null;
  recommendation: string;
}

export interface ExperimentResult {
  experimentId: string;
  experimentName: string;
  description: string;
  isActive: boolean;
  startDate: string;
  totalImpressions: number;
  totalConversions: number;
  totalClicks: number;
  overallConversionRate: number;
  variants: VariantStats[];
  significance: SignificanceResult | null;
  daysRunning: number;
}

export interface DashboardData {
  experiments: ExperimentResult[];
  totalEvents: number;
  activeExperiments: number;
}

// ──────────────────────────────────────────
// Statistical Functions
// ──────────────────────────────────────────

/**
 * Calculate the standard error for a proportion.
 */
function proportionSE(p: number, n: number): number {
  if (n === 0) return 0;
  return Math.sqrt((p * (1 - p)) / n);
}

/**
 * Calculate the 95% confidence interval for a proportion.
 */
function confidenceInterval(p: number, n: number): [number, number] {
  const se = proportionSE(p, n);
  const z = 1.96; // 95% confidence
  return [
    Math.max(0, p - z * se),
    Math.min(1, p + z * se),
  ];
}

/**
 * Z-test for comparing two proportions.
 * Returns the two-tailed p-value.
 */
function twoProportionZTest(
  p1: number, n1: number,
  p2: number, n2: number,
): number {
  if (n1 === 0 || n2 === 0) return 1;

  const pPooled = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));

  if (se === 0) return 1;

  const z = (p1 - p2) / se;
  // Two-tailed p-value using normal CDF approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  return Math.round(pValue * 10000) / 10000; // 4 decimal places
}

/**
 * Approximation of the standard normal CDF using the error function.
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989422804014327; // 1/sqrt(2*pi)
  const p =
    d *
    Math.exp((-z * z) / 2) *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.8212560 + t * 1.3302744))));
  return 1 - p;
}

/**
 * Determine statistical significance between the control and best-performing variant.
 */
function calculateSignificance(variants: VariantStats[]): SignificanceResult | null {
  if (variants.length < 2) return null;

  const control = variants[0]; // First variant is control
  if (control.impressions < 30) {
    return {
      isSignificant: false,
      pValue: 1,
      confidenceLevel: 0,
      winner: null,
      improvementPercent: null,
      recommendation: "Need more data — at least 30 impressions per variant.",
    };
  }

  let bestVariant: VariantStats | null = null;
  let bestRate = 0;
  let pValue = 1;

  for (let i = 1; i < variants.length; i++) {
    const v = variants[i];
    if (v.conversions > bestRate * v.impressions) {
      bestRate = v.conversionRate;
      bestVariant = v;
    }
    // Compare each variant to control
    const pv = twoProportionZTest(
      v.conversionRate, v.impressions,
      control.conversionRate, control.impressions,
    );
    pValue = Math.min(pValue, pv);
  }

  if (!bestVariant) return null;

  const isSignificant = pValue < 0.05;
  const improvement =
    control.conversionRate > 0
      ? Math.round(((bestVariant.conversionRate - control.conversionRate) / control.conversionRate) * 100)
      : null;

  let recommendation: string;
  if (!isSignificant) {
    if (pValue < 0.1) {
      recommendation = "Approaching significance — continue running the experiment.";
    } else {
      recommendation = "Not yet significant — continue collecting data.";
    }
  } else {
    recommendation = `Significant result detected! Variant "${bestVariant.variantName}" outperforms control with ${Math.abs(improvement || 0)}% improvement. Consider promoting to default.`;
  }

  return {
    isSignificant,
    pValue,
    confidenceLevel: isSignificant ? (1 - pValue) * 100 : 0,
    winner: isSignificant ? bestVariant.variantId : null,
    improvementPercent: improvement,
    recommendation,
  };
}

// ──────────────────────────────────────────
// Database Operations
// ──────────────────────────────────────────

/**
 * Insert an A/B test event into the database.
 */
export async function insertAbEvent(
  queryFn: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>,
  event: {
    experimentId: string;
    variantId: string;
    userId: string;
    eventType: "impression" | "conversion" | "click";
    metadata?: Record<string, string>;
  },
): Promise<void> {
  await queryFn(
    `INSERT INTO ab_events (experiment_id, variant_id, user_id, event_type, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [event.experimentId, event.variantId, event.userId, event.eventType, JSON.stringify(event.metadata || {})],
  );
}

/**
 * Get aggregated event counts per variant for a given experiment.
 */
export async function getExperimentAggregates(
  queryFn: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>,
  experimentId: string,
  since?: string,
): Promise<Record<string, { impressions: number; conversions: number; clicks: number }>> {
  const sinceClause = since ? ` AND created_at >= '${since}'` : "";
  const result = await queryFn(`
    SELECT
      variant_id,
      COALESCE(SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END), 0) as impressions,
      COALESCE(SUM(CASE WHEN event_type = 'conversion' THEN 1 ELSE 0 END), 0) as conversions,
      COALESCE(SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END), 0) as clicks
    FROM ab_events
    WHERE experiment_id = $1${sinceClause}
    GROUP BY variant_id
  `, [experimentId]);

  const agg: Record<string, { impressions: number; conversions: number; clicks: number }> = {};
  for (const row of result.rows) {
    agg[row.variant_id as string] = {
      impressions: Number(row.impressions),
      conversions: Number(row.conversions),
      clicks: Number(row.clicks),
    };
  }
  return agg;
}

/**
 * Get total event count across all experiments.
 */
export async function getTotalEventCount(
  queryFn: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>,
): Promise<number> {
  const result = await queryFn(`SELECT COUNT(*) as cnt FROM ab_events`);
  return Number(result.rows[0]?.cnt || 0);
}

/**
 * Get the experiment start date from the first recorded event.
 */
export async function getExperimentStartDate(
  queryFn: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>,
  experimentId: string,
): Promise<string | null> {
  const result = await queryFn(
    `SELECT MIN(created_at) as start_date FROM ab_events WHERE experiment_id = $1`,
    [experimentId],
  );
  const d = result.rows[0]?.start_date;
  return d ? String(d) : null;
}

// ──────────────────────────────────────────
// Dashboard Data Assembly
// ──────────────────────────────────────────

/**
 * Build full dashboard data for all experiments.
 */
export async function getAbTestingDashboard(
  queryFn: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>,
): Promise<DashboardData> {
  const experimentIds = Object.keys(EXPERIMENTS) as ExperimentId[];
  const experiments: ExperimentResult[] = [];
  let totalEvents = 0;

  for (const id of experimentIds) {
    const def = EXPERIMENTS[id];
    const agg = await getExperimentAggregates(queryFn, id);
    const dbStart = await getExperimentStartDate(queryFn, id);

    let totalImpressions = 0;
    let totalConversions = 0;
    let totalClicks = 0;

    const variantStats: VariantStats[] = def.variants.map((v) => {
      const a = agg[v.id] || { impressions: 0, conversions: 0, clicks: 0 };
      totalImpressions += a.impressions;
      totalConversions += a.conversions;
      totalClicks += a.clicks;

      const convRate = a.impressions > 0 ? a.conversions / a.impressions : 0;
      const clickRate = a.impressions > 0 ? a.clicks / a.impressions : 0;

      return {
        variantId: v.id,
        variantName: v.name,
        impressions: a.impressions,
        conversions: a.conversions,
        clicks: a.clicks,
        conversionRate: Math.round(convRate * 10000) / 10000,
        clickRate: Math.round(clickRate * 10000) / 10000,
        standardError: Math.round(proportionSE(convRate, a.impressions) * 10000) / 10000,
        confidenceInterval95: confidenceInterval(convRate, a.impressions).map(
          (v) => Math.round(v * 10000) / 10000,
        ) as [number, number],
      };
    });

    totalEvents += totalImpressions + totalConversions + totalClicks;

    const startDate = dbStart || def.startDate;
    const daysRunning = Math.max(
      1,
      Math.ceil((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)),
    );

    experiments.push({
      experimentId: id,
      experimentName: def.name,
      description: def.description,
      isActive: def.isActive,
      startDate,
      totalImpressions,
      totalConversions,
      totalClicks,
      overallConversionRate:
        totalImpressions > 0
          ? Math.round((totalConversions / totalImpressions) * 10000) / 10000
          : 0,
      variants: variantStats,
      significance: calculateSignificance(variantStats),
      daysRunning,
    });
  }

  return {
    experiments,
    totalEvents: Math.max(totalEvents, await getTotalEventCount(queryFn)),
    activeExperiments: experiments.filter((e) => e.isActive).length,
  };
}
