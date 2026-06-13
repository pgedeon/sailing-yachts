/**
 * P26.3: Affiliate Link Optimization Engine
 *
 * A/B tests affiliate link placements. Tracks revenue per placement/variant.
 * Auto-rotates to the best-performing partner when statistical significance is reached.
 */

import { pool } from "./db";

// --- Types ---

export interface AffiliatePlacement {
  id: number;
  placementKey: string;
  label: string;
  pagePattern: string;
  position: string;
  isActive: boolean;
  rotationStrategy: "ab_test" | "best_performer" | "round_robin";
  autoOptimize: boolean;
  minSampleSize: number;
  confidenceThreshold: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateVariant {
  id: number;
  placementId: number;
  variantKey: string;
  partnerName: string;
  linkText: string;
  linkUrl: string;
  affiliateTag: string | null;
  displayOrder: number;
  trafficWeight: number;
  isActive: boolean;
  isWinner: boolean;
  clicks: number;
  conversions: number;
  estimatedRevenue: string;
  impressions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlacementWithVariants extends AffiliatePlacement {
  variants: AffiliateVariant[];
}

export interface VariantStats {
  variantId: number;
  variantKey: string;
  partnerName: string;
  impressions: number;
  clicks: number;
  clickRate: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenuePerClick: number;
  isSignificant: boolean;
  isWinner: boolean;
  confidence: number;
}

// --- Statistical Significance (Two-proportion Z-test) ---

/**
 * Calculate z-score for two-proportion test.
 * Returns the z-statistic and p-value (one-sided).
 */
export function calculateZTest(
  clicks1: number,
  impressions1: number,
  clicks2: number,
  impressions2: number
): { zScore: number; pValue: number } {
  if (impressions1 < 10 || impressions2 < 10) {
    return { zScore: 0, pValue: 1 };
  }

  const p1 = clicks1 / impressions1;
  const p2 = clicks2 / impressions2;
  const pPool = (clicks1 + clicks2) / (impressions1 + impressions2);

  if (pPool === 0 || pPool === 1) {
    return { zScore: 0, pValue: 1 };
  }

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / impressions1 + 1 / impressions2));
  if (se === 0) return { zScore: 0, pValue: 1 };

  const zScore = (p1 - p2) / se;

  // Approximate normal CDF using error function
  const pValue = 1 - normalCDF(zScore);

  return { zScore, pValue };
}

/**
 * Approximate cumulative distribution function of the standard normal distribution.
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// --- Variant Selection ---

/**
 * Select which variant to show for a given placement.
 * Respects rotation strategy: ab_test (weighted random), best_performer, round_robin.
 */
export function selectVariant(
  placement: AffiliatePlacement,
  variants: AffiliateVariant[]
): AffiliateVariant | null {
  const activeVariants = variants.filter((v) => v.isActive);
  if (activeVariants.length === 0) return null;
  if (activeVariants.length === 1) return activeVariants[0];

  switch (placement.rotationStrategy) {
    case "best_performer": {
      // Return the winner if set, otherwise the one with highest conversion rate
      const winner = activeVariants.find((v) => v.isWinner);
      if (winner) return winner;

      // Fall back to highest revenue-per-click
      const sorted = [...activeVariants].sort((a, b) => {
        const rpcA = a.clicks > 0 ? parseFloat(a.estimatedRevenue) / a.clicks : 0;
        const rpcB = b.clicks > 0 ? parseFloat(b.estimatedRevenue) / b.clicks : 0;
        return rpcB - rpcA;
      });
      return sorted[0];
    }

    case "round_robin": {
      // Simple round-robin based on current impression counts
      const sorted = [...activeVariants].sort((a, b) => a.impressions - b.impressions);
      return sorted[0];
    }

    case "ab_test":
    default: {
      // Weighted random selection based on trafficWeight
      const totalWeight = activeVariants.reduce((sum, v) => sum + v.trafficWeight, 0);
      if (totalWeight === 0) return activeVariants[0];

      let random = Math.random() * totalWeight;
      for (const variant of activeVariants) {
        random -= variant.trafficWeight;
        if (random <= 0) return variant;
      }
      return activeVariants[activeVariants.length - 1];
    }
  }
}

// --- Auto-Optimization ---

/**
 * Check if any variant in a placement should be declared the winner
 * based on statistical significance. If so, mark it and update strategy.
 */
export async function checkAutoOptimization(placementId: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    // Get placement
    const placementResult = await client.query(
      "SELECT * FROM affiliate_placements WHERE id = $1 AND auto_optimize = true AND is_active = true",
      [placementId]
    );
    if (placementResult.rows.length === 0) return false;
    const placement = placementResult.rows[0];

    // Get active variants
    const variantsResult = await client.query(
      "SELECT * FROM affiliate_variants WHERE placement_id = $1 AND is_active = true ORDER BY clicks DESC",
      [placementId]
    );
    const variants = variantsResult.rows;
    if (variants.length < 2) return false;

    const minSample = placement.min_sample_size || 100;
    const threshold = parseFloat(placement.confidence_threshold) || 0.95;

    // Check if all variants have enough impressions
    const allHaveSample = variants.every((v: any) => v.impressions >= minSample);
    if (!allHaveSample) return false;

    // Compare best vs second-best (by conversion rate)
    const sorted = [...variants].sort((a: any, b: any) => {
      const rateA = a.impressions > 0 ? a.clicks / a.impressions : 0;
      const rateB = b.impressions > 0 ? b.clicks / b.impressions : 0;
      return rateB - rateA;
    });

    const best = sorted[0];
    const second = sorted[1];

    const { pValue } = calculateZTest(
      best.clicks,
      best.impressions,
      second.clicks,
      second.impressions
    );

    // pValue is one-sided; we want confidence that best > second
    // pValue < (1 - threshold) means best is significantly better
    if (pValue < (1 - threshold)) {
      // Mark winner
      await client.query("BEGIN");

      await client.query(
        "UPDATE affiliate_variants SET is_winner = false WHERE placement_id = $1",
        [placementId]
      );
      await client.query(
        "UPDATE affiliate_variants SET is_winner = true WHERE id = $1",
        [best.id]
      );
      // Switch to best_performer strategy
      await client.query(
        "UPDATE affiliate_placements SET rotation_strategy = 'best_performer', updated_at = NOW() WHERE id = $1",
        [placementId]
      );

      await client.query("COMMIT");
      return true;
    }

    return false;
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Auto-optimization error:", error);
    return false;
  } finally {
    client.release();
  }
}

// --- Tracking ---

/**
 * Record an affiliate tracking event (impression, click, or conversion).
 */
export async function recordTrackingEvent(params: {
  variantId: number;
  placementId: number;
  eventType: "impression" | "click" | "conversion";
  sessionId?: string;
  page?: string;
  yachtId?: number;
  revenue?: number;
  metadata?: Record<string, string | number | null>;
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert event
    await client.query(
      `INSERT INTO affiliate_tracking_events (variant_id, placement_id, event_type, session_id, page, yacht_id, revenue, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        params.variantId,
        params.placementId,
        params.eventType,
        params.sessionId || null,
        params.page || null,
        params.yachtId || null,
        params.revenue || null,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ]
    );

    // Update variant counters
    if (params.eventType === "impression") {
      await client.query(
        "UPDATE affiliate_variants SET impressions = impressions + 1, updated_at = NOW() WHERE id = $1",
        [params.variantId]
      );
    } else if (params.eventType === "click") {
      await client.query(
        "UPDATE affiliate_variants SET clicks = clicks + 1, updated_at = NOW() WHERE id = $1",
        [params.variantId]
      );
    } else if (params.eventType === "conversion") {
      const revenueVal = params.revenue || 0;
      await client.query(
        "UPDATE affiliate_variants SET conversions = conversions + 1, estimated_revenue = estimated_revenue + $2, updated_at = NOW() WHERE id = $1",
        [params.variantId, revenueVal.toFixed(2)]
      );
    }

    await client.query("COMMIT");

    // Trigger auto-optimization check on click events (not every impression, too noisy)
    if (params.eventType === "click") {
      checkAutoOptimization(params.placementId).catch(() => {});
    }
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Affiliate tracking error:", error);
    throw error;
  } finally {
    client.release();
  }
}

// --- Query Helpers ---

/**
 * Get all placements with their active variants.
 */
export async function getPlacementsWithVariants(): Promise<PlacementWithVariants[]> {
  const client = await pool.connect();
  try {
    const placementsResult = await client.query(
      "SELECT * FROM affiliate_placements ORDER BY created_at DESC"
    );

    const result: PlacementWithVariants[] = [];
    for (const placement of placementsResult.rows) {
      const variantsResult = await client.query(
        "SELECT * FROM affiliate_variants WHERE placement_id = $1 ORDER BY display_order, created_at",
        [placement.id]
      );
      result.push({
        ...placement,
        variants: variantsResult.rows,
      });
    }

    return result;
  } finally {
    client.release();
  }
}

/**
 * Get stats for all variants of a placement.
 */
export async function getPlacementStats(placementId: number): Promise<VariantStats[]> {
  const client = await pool.connect();
  try {
    const variantsResult = await client.query(
      "SELECT * FROM affiliate_variants WHERE placement_id = $1 AND is_active = true",
      [placementId]
    );

    const placementResult = await client.query(
      "SELECT * FROM affiliate_placements WHERE id = $1",
      [placementId]
    );
    const threshold = placementResult.rows.length > 0
      ? parseFloat(placementResult.rows[0].confidence_threshold) || 0.95
      : 0.95;

    const stats: VariantStats[] = variantsResult.rows.map((v: any) => ({
      variantId: v.id,
      variantKey: v.variant_key,
      partnerName: v.partner_name,
      impressions: v.impressions,
      clicks: v.clicks,
      clickRate: v.impressions > 0 ? v.clicks / v.impressions : 0,
      conversions: v.conversions,
      conversionRate: v.clicks > 0 ? v.conversions / v.clicks : 0,
      revenue: parseFloat(v.estimated_revenue || "0"),
      revenuePerClick: v.clicks > 0 ? parseFloat(v.estimated_revenue || "0") / v.clicks : 0,
      isSignificant: false, // will be computed below
      isWinner: v.is_winner,
      confidence: 0,
    }));

    // Compute pairwise significance if we have 2+ variants
    if (stats.length >= 2) {
      const sorted = [...stats].sort((a, b) => b.clickRate - a.clickRate);
      const best = sorted[0];
      const second = sorted[1];

      const { pValue } = calculateZTest(
        best.clicks,
        best.impressions,
        second.clicks,
        second.impressions
      );

      best.confidence = 1 - pValue;
      best.isSignificant = best.confidence >= threshold;
    }

    return stats;
  } finally {
    client.release();
  }
}

/**
 * Get overall affiliate performance summary.
 */
export async function getAffiliateSummary(): Promise<{
  totalPlacements: number;
  activePlacements: number;
  totalVariants: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  overallCtr: number;
  overallConversionRate: number;
  topPerformingPlacement: string | null;
  topPerformingPartner: string | null;
}> {
  const client = await pool.connect();
  try {
    const statsResult = await client.query(`
      SELECT
        COUNT(DISTINCT p.id) as total_placements,
        COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END) as active_placements,
        COUNT(v.id) as total_variants,
        COALESCE(SUM(v.impressions), 0) as total_impressions,
        COALESCE(SUM(v.clicks), 0) as total_clicks,
        COALESCE(SUM(v.conversions), 0) as total_conversions,
        COALESCE(SUM(v.estimated_revenue::numeric), 0) as total_revenue
      FROM affiliate_placements p
      LEFT JOIN affiliate_variants v ON v.placement_id = p.id
    `);

    const row = statsResult.rows[0];
    const totalClicks = parseInt(row.total_clicks) || 0;
    const totalImpressions = parseInt(row.total_impressions) || 0;
    const totalConversions = parseInt(row.total_conversions) || 0;

    // Top placement
    const topPlacementResult = await client.query(`
      SELECT p.placement_key, SUM(v.estimated_revenue::numeric) as revenue
      FROM affiliate_placements p
      JOIN affiliate_variants v ON v.placement_id = p.id
      GROUP BY p.placement_key
      ORDER BY revenue DESC
      LIMIT 1
    `);

    // Top partner
    const topPartnerResult = await client.query(`
      SELECT partner_name, SUM(estimated_revenue::numeric) as revenue
      FROM affiliate_variants
      GROUP BY partner_name
      ORDER BY revenue DESC
      LIMIT 1
    `);

    return {
      totalPlacements: parseInt(row.total_placements) || 0,
      activePlacements: parseInt(row.active_placements) || 0,
      totalVariants: parseInt(row.total_variants) || 0,
      totalImpressions,
      totalClicks,
      totalConversions,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      overallCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      overallConversionRate: totalClicks > 0 ? totalConversions / totalClicks : 0,
      topPerformingPlacement: topPlacementResult.rows[0]?.placement_key || null,
      topPerformingPartner: topPartnerResult.rows[0]?.partner_name || null,
    };
  } finally {
    client.release();
  }
}

/**
 * Get daily trends for affiliate performance (last 30 days).
 */
export async function getAffiliateTrends(days = 30): Promise<Array<{
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}>> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(CASE WHEN event_type = 'impression' THEN 1 END) as impressions,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks,
        COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as conversions,
        COALESCE(SUM(CASE WHEN event_type = 'conversion' THEN revenue::numeric ELSE 0 END), 0) as revenue
      FROM affiliate_tracking_events
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    return result.rows.map((row: any) => ({
      date: row.date,
      impressions: parseInt(row.impressions) || 0,
      clicks: parseInt(row.clicks) || 0,
      conversions: parseInt(row.conversions) || 0,
      revenue: parseFloat(row.revenue) || 0,
    }));
  } finally {
    client.release();
  }
}

/**
 * Seed default placements if none exist.
 */
export async function seedDefaultPlacements(): Promise<void> {
  const client = await pool.connect();
  try {
    const existing = await client.query("SELECT COUNT(*) FROM affiliate_placements");
    if (parseInt(existing.rows[0].count) > 0) return;

    const defaults = [
      { key: "yacht_detail_sidebar", label: "Yacht Detail — Sidebar", pagePattern: "/yachts/[slug]", position: "sidebar" },
      { key: "yacht_detail_footer", label: "Yacht Detail — Footer Gear", pagePattern: "/yachts/[slug]", position: "footer" },
      { key: "compare_page_sidebar", label: "Compare — Sidebar", pagePattern: "/compare", position: "sidebar" },
      { key: "search_results_top", label: "Search — Top Banner", pagePattern: "/search", position: "inline" },
      { key: "manufacturer_detail", label: "Manufacturer Detail — Inline", pagePattern: "/manufacturers/[slug]", position: "inline" },
    ];

    for (const d of defaults) {
      await client.query(
        `INSERT INTO affiliate_placements (placement_key, label, page_pattern, position)
         VALUES ($1, $2, $3, $4)`,
        [d.key, d.label, d.pagePattern, d.position]
      );
    }
  } finally {
    client.release();
  }
}
