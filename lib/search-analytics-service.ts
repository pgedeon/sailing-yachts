/**
 * P24.4 — Search Intent Analysis Service
 *
 * Analyzes search queries, zero-result searches, popular filters,
 * and surfaces content gaps. Built on analytics_events data.
 *
 * Sections:
 *   - Top search queries with frequency & result counts
 *   - Zero-result search analysis & content gap detection
 *   - Popular filter usage & combinations
 *   - Daily/weekly trends for search volume
 */

import { pool } from "./db";

// ─── Types ──────────────────────────────────────────────────────

export interface TopQuery {
  query: string;
  count: number;
  avgResultCount: number;
  zeroResultCount: number;
  lastSearchedAt: string;
  hasIntentPage: boolean;
  intentPageSlug: string | null;
}

export interface ZeroResultQuery {
  query: string;
  count: number;
  lastSearchedAt: string;
  similarQueries: string[];
  suggestedIntentPage: string | null;
}

export interface FilterUsage {
  filterKey: string;
  filterLabel: string;
  count: number;
  percentage: number;
  topValues: { value: string; count: number }[];
}

export interface FilterCombination {
  filters: string[];
  count: number;
  avgResultCount: number;
}

export interface DailySearchTrend {
  date: string;
  totalSearches: number;
  uniqueQueries: number;
  zeroResultRate: number;
}

export interface SearchAnalyticsSummary {
  totalSearches: number;
  uniqueQueries: number;
  zeroResultSearches: number;
  zeroResultRate: number;
  avgResultCount: number;
  topSearchHour: number;
  searchesWithFilters: number;
}

export interface ContentGap {
  query: string;
  searchCount: number;
  avgResultCount: number;
  existingIntentSlug: string | null;
  suggestedAction: "create_intent" | "improve_matching" | "monitor";
  priority: "high" | "medium" | "low";
}

export interface SearchAnalyticsData {
  summary: SearchAnalyticsSummary;
  topQueries: TopQuery[];
  zeroResultQueries: ZeroResultQuery[];
  filterUsage: FilterUsage[];
  filterCombinations: FilterCombination[];
  dailyTrend: DailySearchTrend[];
  contentGaps: ContentGap[];
  period: { days: number };
}

// ─── Filter Labels ──────────────────────────────────────────────

const FILTER_LABELS: Record<string, string> = {
  query: "Search Query",
  lengthMin: "Min Length",
  lengthMax: "Max Length",
  cabinsMin: "Min Cabins",
  cabinsMax: "Max Cabins",
  keelType: "Keel Type",
  rigType: "Rig Type",
  hullMaterial: "Hull Material",
  displacementMin: "Min Displacement",
  displacementMax: "Max Displacement",
  yearMin: "Min Year",
  yearMax: "Max Year",
  manufacturerId: "Manufacturer",
  useCase: "Use Case",
  sortBy: "Sort By",
  sortDir: "Sort Direction",
};

// ─── Summary ──────────────────────────────────────────────────────

export async function getSearchAnalyticsSummary(
  days: number = 30,
): Promise<SearchAnalyticsSummary> {
  const interval = `${days} days`;

  const result = await pool.query(
    `SELECT
       COUNT(*) as total_searches,
       COUNT(DISTINCT metadata->>'query') as unique_queries,
       COUNT(*) FILTER (WHERE (metadata->>'resultCount')::int = 0 OR metadata->>'resultCount' IS NULL) as zero_result_searches,
       ROUND(AVG((metadata->>'resultCount')::int)) as avg_result_count,
       COUNT(*) FILTER (WHERE metadata->>'filters' IS NOT NULL AND metadata->>'filters' != '{}' AND metadata->>'filters' != 'undefined') as searches_with_filters
     FROM analytics_events
     WHERE event_type = 'search'
       AND created_at > NOW() - INTERVAL '${interval}'`,
  );

  // Get peak search hour
  const hourResult = await pool.query(
    `SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
     FROM analytics_events
     WHERE event_type = 'search'
       AND created_at > NOW() - INTERVAL '${interval}'
     GROUP BY hour
     ORDER BY count DESC
     LIMIT 1`,
  );

  const row = result.rows[0];
  const totalSearches = parseInt(row?.total_searches || "0", 10);
  const zeroResultSearches = parseInt(row?.zero_result_searches || "0", 10);

  return {
    totalSearches,
    uniqueQueries: parseInt(row?.unique_queries || "0", 10),
    zeroResultSearches,
    zeroResultRate:
      totalSearches > 0
        ? Math.round((zeroResultSearches / totalSearches) * 10000) / 100
        : 0,
    avgResultCount: Math.round(parseFloat(row?.avg_result_count || "0")),
    topSearchHour: parseInt(hourResult.rows[0]?.hour || "12", 10),
    searchesWithFilters: parseInt(row?.searches_with_filters || "0", 10),
  };
}

// ─── Top Queries ──────────────────────────────────────────────────

export async function getTopQueries(
  days: number = 30,
  limit: number = 25,
): Promise<TopQuery[]> {
  const interval = `${days} days`;

  const result = await pool.query(
    `SELECT
       metadata->>'query' as query,
       COUNT(*) as count,
       ROUND(AVG((metadata->>'resultCount')::int)) as avg_result_count,
       COUNT(*) FILTER (WHERE (metadata->>'resultCount')::int = 0) as zero_result_count,
       MAX(created_at) as last_searched_at
     FROM analytics_events
     WHERE event_type = 'search'
       AND created_at > NOW() - INTERVAL '${interval}'
       AND metadata->>'query' IS NOT NULL
       AND metadata->>'query' != ''
     GROUP BY metadata->>'query'
     ORDER BY count DESC
     LIMIT $1`,
    [limit],
  );

  // Check which queries have existing intent pages
  const queries = result.rows.map((row) => ({
    query: row.query,
    count: parseInt(row.count, 10),
    avgResultCount: Math.round(parseFloat(row.avg_result_count || "0")),
    zeroResultCount: parseInt(row.zero_result_count, 10),
    lastSearchedAt: row.last_searched_at,
    hasIntentPage: false,
    intentPageSlug: null as string | null,
  }));

  // Cross-reference with search_intents
  if (queries.length > 0) {
    const queryTerms = queries.map((q) => q.query.toLowerCase().trim());
    const intentResult = await pool.query(
      `SELECT slug, search_query FROM search_intents WHERE search_query IS NOT NULL`,
    );

    const intentMap = new Map<string, string>();
    for (const row of intentResult.rows) {
      if (row.search_query) {
        intentMap.set(row.search_query.toLowerCase().trim(), row.slug);
      }
    }

    for (const q of queries) {
      const slug = intentMap.get(q.query.toLowerCase());
      if (slug) {
        q.hasIntentPage = true;
        q.intentPageSlug = slug;
      }
    }
  }

  return queries;
}

// ─── Zero-Result Queries ─────────────────────────────────────────

export async function getZeroResultQueries(
  days: number = 30,
  limit: number = 20,
): Promise<ZeroResultQuery[]> {
  const interval = `${days} days`;

  const result = await pool.query(
    `SELECT
       metadata->>'query' as query,
       COUNT(*) as count,
       MAX(created_at) as last_searched_at
     FROM analytics_events
     WHERE event_type = 'search'
       AND created_at > NOW() - INTERVAL '${interval}'
       AND metadata->>'query' IS NOT NULL
       AND metadata->>'query' != ''
       AND ((metadata->>'resultCount')::int = 0 OR metadata->>'resultCount' IS NULL)
     GROUP BY metadata->>'query'
     ORDER BY count DESC
     LIMIT $1`,
    [limit],
  );

  // Find similar queries and check for existing intent pages
  const zeroQueries: ZeroResultQuery[] = [];

  for (const row of result.rows) {
    const query = row.query;
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length > 2);

    // Find similar queries
    let similarQueries: string[] = [];
    if (words.length > 0) {
      const params = words.map((w: string) => `%${w}%`);

      const similarResult = await pool.query(
        `SELECT DISTINCT metadata->>'query' as q
         FROM analytics_events
         WHERE event_type = 'search'
           AND metadata->>'query' ILIKE ANY($1)
           AND metadata->>'query' != $2
         LIMIT 5`,
        [params, query],
      );
      similarQueries = similarResult.rows.map((r) => r.q);
    }

    // Check for suggested intent page
    const slug = query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 100);

    const intentResult = await pool.query(
      `SELECT slug FROM search_intents WHERE slug = $1 OR search_query = $2`,
      [slug, query],
    );

    zeroQueries.push({
      query,
      count: parseInt(row.count, 10),
      lastSearchedAt: row.last_searched_at,
      similarQueries,
      suggestedIntentPage:
        intentResult.rows.length > 0 ? intentResult.rows[0].slug : null,
    });
  }

  return zeroQueries;
}

// ─── Filter Usage ─────────────────────────────────────────────────

export async function getFilterUsage(
  days: number = 30,
): Promise<FilterUsage[]> {
  const interval = `${days} days`;

  // Get all filter events
  const result = await pool.query(
    `SELECT metadata->>'filters' as filters
     FROM analytics_events
     WHERE event_type = 'search'
       AND created_at > NOW() - INTERVAL '${interval}'
       AND metadata->>'filters' IS NOT NULL
       AND metadata->>'filters' != '{}'
       AND metadata->>'filters' != 'undefined'`,
  );

  const filterCounts: Record<
    string,
    { count: number; values: Record<string, number> }
  > = {};

  for (const row of result.rows) {
    try {
      const filters =
        typeof row.filters === "string"
          ? JSON.parse(row.filters)
          : row.filters;
      if (!filters || typeof filters !== "object") continue;

      for (const [key, value] of Object.entries(filters)) {
        if (!filterCounts[key]) {
          filterCounts[key] = { count: 0, values: {} };
        }
        filterCounts[key].count++;
        const valStr = String(value);
        filterCounts[key].values[valStr] =
          (filterCounts[key].values[valStr] || 0) + 1;
      }
    } catch {
      // Invalid JSON — skip
    }
  }

  const totalWithFilters = result.rows.length;
  const filterUsage: FilterUsage[] = Object.entries(filterCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([key, data]) => ({
      filterKey: key,
      filterLabel: FILTER_LABELS[key] || key,
      count: data.count,
      percentage:
        totalWithFilters > 0
          ? Math.round((data.count / totalWithFilters) * 10000) / 100
          : 0,
      topValues: Object.entries(data.values)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count })),
    }));

  return filterUsage;
}

// ─── Filter Combinations ─────────────────────────────────────────

export async function getFilterCombinations(
  days: number = 30,
  limit: number = 10,
): Promise<FilterCombination[]> {
  const interval = `${days} days`;

  const result = await pool.query(
    `SELECT metadata->>'filters' as filters, metadata->>'resultCount' as result_count
     FROM analytics_events
     WHERE event_type = 'search'
       AND created_at > NOW() - INTERVAL '${interval}'
       AND metadata->>'filters' IS NOT NULL
       AND metadata->>'filters' != '{}'
       AND metadata->>'filters' != 'undefined'`,
  );

  const comboMap: Record<string, { count: number; totalResults: number }> = {};

  for (const row of result.rows) {
    try {
      const filters =
        typeof row.filters === "string"
          ? JSON.parse(row.filters)
          : row.filters;
      if (!filters || typeof filters !== "object") continue;

      const keys = Object.keys(filters).sort();
      if (keys.length < 2) continue; // Only combinations of 2+ filters

      const comboKey = keys.join(" + ");
      if (!comboMap[comboKey]) {
        comboMap[comboKey] = { count: 0, totalResults: 0 };
      }
      comboMap[comboKey].count++;
      comboMap[comboKey].totalResults += parseInt(
        row.result_count || "0",
        10,
      );
    } catch {
      // Invalid JSON — skip
    }
  }

  return Object.entries(comboMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([combo, data]) => ({
      filters: combo.split(" + "),
      count: data.count,
      avgResultCount:
        data.count > 0
          ? Math.round(data.totalResults / data.count)
          : 0,
    }));
}

// ─── Daily Trend ──────────────────────────────────────────────────

export async function getSearchDailyTrend(
  days: number = 30,
): Promise<DailySearchTrend[]> {
  const interval = `${days} days`;

  const result = await pool.query(
    `SELECT
       DATE(created_at) as date,
       COUNT(*) as total_searches,
       COUNT(DISTINCT metadata->>'query') as unique_queries,
       ROUND(
         COUNT(*) FILTER (WHERE (metadata->>'resultCount')::int = 0 OR metadata->>'resultCount' IS NULL)::numeric
         / NULLIF(COUNT(*), 0) * 100, 2
       ) as zero_result_rate
     FROM analytics_events
     WHERE event_type = 'search'
       AND created_at > NOW() - INTERVAL '${interval}'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
  );

  return result.rows.map((row) => ({
    date: row.date,
    totalSearches: parseInt(row.total_searches, 10),
    uniqueQueries: parseInt(row.unique_queries, 10),
    zeroResultRate: parseFloat(row.zero_result_rate || "0"),
  }));
}

// ─── Content Gaps ─────────────────────────────────────────────────

export async function getContentGaps(
  days: number = 30,
  limit: number = 15,
): Promise<ContentGap[]> {
  const interval = `${days} days`;

  // Find queries that have low result counts and high search frequency
  const result = await pool.query(
    `SELECT
       metadata->>'query' as query,
       COUNT(*) as search_count,
       ROUND(AVG((metadata->>'resultCount')::int)) as avg_result_count
     FROM analytics_events
     WHERE event_type = 'search'
       AND created_at > NOW() - INTERVAL '${interval}'
       AND metadata->>'query' IS NOT NULL
       AND metadata->>'query' != ''
       AND length(metadata->>'query') > 2
     GROUP BY metadata->>'query'
     HAVING COUNT(*) >= 2
     ORDER BY search_count DESC, avg_result_count ASC
     LIMIT $1`,
    [limit * 3], // Over-fetch to filter by intent pages
  );

  // Cross-reference with search_intents
  const intentResult = await pool.query(
    `SELECT slug, search_query FROM search_intents`,
  );
  const intentMap = new Map<string, string>();
  for (const row of intentResult.rows) {
    if (row.search_query) {
      intentMap.set(row.search_query.toLowerCase().trim(), row.slug);
    }
  }

  const gaps: ContentGap[] = result.rows
    .map((row) => {
      const query = row.query;
      const searchCount = parseInt(row.search_count, 10);
      const avgResultCount = Math.round(
        parseFloat(row.avg_result_count || "0"),
      );
      const existingSlug = intentMap.get(query.toLowerCase()) || null;

      let suggestedAction: ContentGap["suggestedAction"] = "monitor";
      let priority: ContentGap["priority"] = "low";

      if (avgResultCount === 0 && searchCount >= 3) {
        suggestedAction = "create_intent";
        priority = "high";
      } else if (avgResultCount > 0 && avgResultCount <= 3 && searchCount >= 5) {
        suggestedAction = "improve_matching";
        priority = "medium";
      } else if (avgResultCount === 0 && searchCount >= 2) {
        suggestedAction = "create_intent";
        priority = "medium";
      }

      return {
        query,
        searchCount,
        avgResultCount,
        existingIntentSlug: existingSlug,
        suggestedAction,
        priority,
      };
    })
    .filter((g) => g.suggestedAction !== "monitor")
    .slice(0, limit);

  return gaps;
}

// ─── Full Dashboard Data ─────────────────────────────────────────

export async function getSearchAnalyticsDashboard(
  days: number = 30,
): Promise<SearchAnalyticsData> {
  const [summary, topQueries, zeroResultQueries, filterUsage, filterCombinations, dailyTrend, contentGaps] =
    await Promise.all([
      getSearchAnalyticsSummary(days),
      getTopQueries(days),
      getZeroResultQueries(days),
      getFilterUsage(days),
      getFilterCombinations(days),
      getSearchDailyTrend(days),
      getContentGaps(days),
    ]);

  return {
    summary,
    topQueries,
    zeroResultQueries,
    filterUsage,
    filterCombinations,
    dailyTrend,
    contentGaps,
    period: { days },
  };
}
