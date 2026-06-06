/**
 * P24.1 — Analytics Service
 *
 * Server-side analytics service for querying aggregated analytics data.
 * Tracks page views, popular yachts, search trends, comparison patterns.
 * All data is aggregated and anonymized — no PII stored.
 */

import { pool } from "./db";

// ─── Types ──────────────────────────────────────────────────────

export type AnalyticsEventType =
  | "page_view"
  | "search"
  | "compare"
  | "yacht_view"
  | "manufacturer_view"
  | "guide_view"
  | "cta_click"
  | "share"
  | "filter_use"
  | "rating"
  | "email_yacht"
  | "featured_view";

export interface AnalyticsEventInput {
  eventType: AnalyticsEventType;
  page: string;
  entityId?: number;
  entityType?: "yacht" | "manufacturer" | "guide" | "comparison";
  sessionId: string;
  metadata?: Record<string, unknown>;
  referrer?: string;
  userAgent?: string;
  country?: string;
}

export interface AnalyticsSummary {
  totalPageViews: number;
  uniqueSessions: number;
  totalSearches: number;
  totalComparisons: number;
  totalYachtViews: number;
  avgSessionLength: number;
  bounceRate: number;
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface PopularYacht {
  yachtModelId: number;
  modelName: string;
  manufacturerName: string;
  viewCount: number;
}

export interface PopularSearch {
  query: string;
  count: number;
  resultCount: number | null;
  lastSearched: string;
}

export interface ComparisonPattern {
  yachtIds: number[];
  yachtNames: string[];
  count: number;
}

export interface PageViewBreakdown {
  page: string;
  views: number;
  uniqueViews: number;
}

// ─── Event Insertion ──────────────────────────────────────────────

/**
 * Insert a batch of analytics events.
 */
export async function insertAnalyticsEvents(
  events: AnalyticsEventInput[],
): Promise<number> {
  if (events.length === 0) return 0;

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let paramIdx = 1;

  for (const event of events) {
    placeholders.push(
      `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7})`,
    );
    values.push(
      event.eventType,
      event.page,
      event.entityId ?? null,
      event.entityType ?? null,
      event.sessionId,
      event.metadata ? JSON.stringify(event.metadata) : null,
      event.referrer ?? null,
      event.userAgent ?? null,
    );
    paramIdx += 8;
  }

  const result = await pool.query(
    `INSERT INTO analytics_events (event_type, page, entity_id, entity_type, session_id, metadata, referrer, user_agent)
     VALUES ${placeholders.join(", ")}`,
    values,
  );

  return result.rowCount ?? 0;
}

/**
 * Insert a single analytics event.
 */
export async function insertAnalyticsEvent(
  event: AnalyticsEventInput,
): Promise<void> {
  await pool.query(
    `INSERT INTO analytics_events (event_type, page, entity_id, entity_type, session_id, metadata, referrer, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      event.eventType,
      event.page,
      event.entityId ?? null,
      event.entityType ?? null,
      event.sessionId,
      event.metadata ? JSON.stringify(event.metadata) : null,
      event.referrer ?? null,
      event.userAgent ?? null,
    ],
  );
}

// ─── Query Functions ──────────────────────────────────────────────

/**
 * Get overall analytics summary for a time period.
 */
export async function getAnalyticsSummary(
  days: number = 30,
): Promise<AnalyticsSummary> {
  const interval = `${days} days`;

  const [viewsRes, sessionsRes, searchesRes, comparisonsRes, yachtViewsRes] =
    await Promise.all([
      pool.query(
        `SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '${interval}'`,
      ),
      pool.query(
        `SELECT COUNT(DISTINCT session_id) as count FROM analytics_events WHERE created_at > NOW() - INTERVAL '${interval}'`,
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'search' AND created_at > NOW() - INTERVAL '${interval}'`,
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'compare' AND created_at > NOW() - INTERVAL '${interval}'`,
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'yacht_view' AND created_at > NOW() - INTERVAL '${interval}'`,
      ),
    ]);

  return {
    totalPageViews: parseInt(viewsRes.rows[0]?.count || "0", 10),
    uniqueSessions: parseInt(sessionsRes.rows[0]?.count || "0", 10),
    totalSearches: parseInt(searchesRes.rows[0]?.count || "0", 10),
    totalComparisons: parseInt(comparisonsRes.rows[0]?.count || "0", 10),
    totalYachtViews: parseInt(yachtViewsRes.rows[0]?.count || "0", 10),
    avgSessionLength: 0,
    bounceRate: 0,
  };
}

/**
 * Get daily trend data for a given event type.
 */
export async function getEventTrend(
  eventType: AnalyticsEventType | "all",
  days: number = 30,
): Promise<TrendDataPoint[]> {
  const interval = `${days} days`;
  const typeFilter =
    eventType === "all" ? "" : `AND event_type = '${eventType}'`;

  const result = await pool.query(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '${interval}' ${typeFilter}
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
  );

  return result.rows.map((row) => ({
    date: row.date,
    count: parseInt(row.count, 10),
  }));
}

/**
 * Get multi-metric trend data (page views, searches, comparisons) in one query.
 */
export async function getMultiMetricTrend(
  days: number = 30,
): Promise<
  Record<"pageViews" | "searches" | "comparisons" | "yachtViews", TrendDataPoint[]>
> {
  const interval = `${days} days`;

  const result = await pool.query(
    `SELECT DATE(created_at) as date, event_type, COUNT(*) as count
     FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '${interval}'
       AND event_type IN ('page_view', 'search', 'compare', 'yacht_view')
     GROUP BY DATE(created_at), event_type
     ORDER BY date ASC`,
  );

  const data: Record<string, TrendDataPoint[]> = {
    pageViews: [],
    searches: [],
    comparisons: [],
    yachtViews: [],
  };

  for (const row of result.rows) {
    const point = { date: row.date, count: parseInt(row.count, 10) };
    switch (row.event_type) {
      case "page_view":
        data.pageViews.push(point);
        break;
      case "search":
        data.searches.push(point);
        break;
      case "compare":
        data.comparisons.push(point);
        break;
      case "yacht_view":
        data.yachtViews.push(point);
        break;
    }
  }

  return data as Record<
    "pageViews" | "searches" | "comparisons" | "yachtViews",
    TrendDataPoint[]
  >;
}

/**
 * Get most popular yachts by view count.
 */
export async function getPopularYachts(
  days: number = 30,
  limit: number = 10,
): Promise<PopularYacht[]> {
  const result = await pool.query(
    `SELECT
       ae.entity_id as yacht_model_id,
       ym.model_name,
       m.name as manufacturer_name,
       COUNT(*) as view_count
     FROM analytics_events ae
     LEFT JOIN yacht_models ym ON ae.entity_id = ym.id
     LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
     WHERE ae.event_type = 'yacht_view'
       AND ae.created_at > NOW() - INTERVAL '${days} days'
     GROUP BY ae.entity_id, ym.model_name, m.name
     ORDER BY view_count DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    yachtModelId: row.yacht_model_id,
    modelName: row.model_name || "Unknown",
    manufacturerName: row.manufacturer_name || "Unknown",
    viewCount: parseInt(row.view_count, 10),
  }));
}

/**
 * Get popular search queries.
 */
export async function getPopularSearches(
  days: number = 30,
  limit: number = 20,
): Promise<PopularSearch[]> {
  const result = await pool.query(
    `SELECT
       metadata->>'query' as query,
       COUNT(*) as count,
       metadata->>'resultCount' as result_count,
       MAX(created_at) as last_searched
     FROM analytics_events
     WHERE event_type = 'search'
       AND created_at > NOW() - INTERVAL '${days} days'
       AND metadata->>'query' IS NOT NULL
     GROUP BY metadata->>'query', metadata->>'resultCount'
     ORDER BY count DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    query: row.query,
    count: parseInt(row.count, 10),
    resultCount: row.result_count ? parseInt(row.result_count, 10) : null,
    lastSearched: row.last_searched,
  }));
}

/**
 * Get comparison patterns (most compared yacht combinations).
 */
export async function getComparisonPatterns(
  days: number = 30,
  limit: number = 10,
): Promise<ComparisonPattern[]> {
  const result = await pool.query(
    `SELECT
       ae.entity_id,
       ae.metadata->>'yachtIds' as yacht_ids,
       ae.metadata->>'yachtNames' as yacht_names,
       COUNT(*) as count
     FROM analytics_events ae
     WHERE ae.event_type = 'compare'
       AND ae.created_at > NOW() - INTERVAL '${days} days'
       AND ae.metadata->>'yachtIds' IS NOT NULL
     GROUP BY ae.entity_id, ae.metadata->>'yachtIds', ae.metadata->>'yachtNames'
     ORDER BY count DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    yachtIds: row.yacht_ids ? JSON.parse(row.yacht_ids) : [],
    yachtNames: row.yacht_names ? JSON.parse(row.yacht_names) : [],
    count: parseInt(row.count, 10),
  }));
}

/**
 * Get page view breakdown by page.
 */
export async function getPageViewBreakdown(
  days: number = 30,
  limit: number = 20,
): Promise<PageViewBreakdown[]> {
  const result = await pool.query(
    `SELECT
       page,
       COUNT(*) as views,
       COUNT(DISTINCT session_id) as unique_views
     FROM analytics_events
     WHERE event_type = 'page_view'
       AND created_at > NOW() - INTERVAL '${days} days'
     GROUP BY page
     ORDER BY views DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    page: row.page,
    views: parseInt(row.views, 10),
    uniqueViews: parseInt(row.unique_views, 10),
  }));
}

/**
 * Get top referrers.
 */
export async function getTopReferrers(
  days: number = 30,
  limit: number = 10,
): Promise<{ referrer: string; count: number }[]> {
  const result = await pool.query(
    `SELECT
       referrer,
       COUNT(*) as count
     FROM analytics_events
     WHERE event_type = 'page_view'
       AND created_at > NOW() - INTERVAL '${days} days'
       AND referrer IS NOT NULL
       AND referrer != ''
     GROUP BY referrer
     ORDER BY count DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    referrer: row.referrer,
    count: parseInt(row.count, 10),
  }));
}

/**
 * Get event counts by type for a period.
 */
export async function getEventCountsByType(
  days: number = 30,
): Promise<{ eventType: string; count: number }[]> {
  const result = await pool.query(
    `SELECT event_type, COUNT(*) as count
     FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '${days} days'
     GROUP BY event_type
     ORDER BY count DESC`,
  );

  return result.rows.map((row) => ({
    eventType: row.event_type,
    count: parseInt(row.count, 10),
  }));
}

/**
 * Get analytics data for the admin dashboard — all in one call.
 */
export async function getAdminAnalyticsDashboard(days: number = 30) {
  const [
    summary,
    trends,
    popularYachts,
    popularSearches,
    comparisons,
    pageBreakdown,
    topReferrers,
    eventCounts,
  ] = await Promise.all([
    getAnalyticsSummary(days),
    getMultiMetricTrend(days),
    getPopularYachts(days, 10),
    getPopularSearches(days, 15),
    getComparisonPatterns(days, 10),
    getPageViewBreakdown(days, 15),
    getTopReferrers(days, 10),
    getEventCountsByType(days),
  ]);

  return {
    summary,
    trends,
    popularYachts,
    popularSearches,
    comparisons,
    pageBreakdown,
    topReferrers,
    eventCounts,
    period: { days },
  };
}
