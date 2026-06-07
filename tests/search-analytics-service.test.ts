/**
 * P24.4 — Search Analytics Service Tests
 *
 * Tests for search query analytics, zero-result analysis,
 * filter usage, content gap detection, and trend data.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "@/lib/db";
import {
  getSearchAnalyticsSummary,
  getTopQueries,
  getZeroResultQueries,
  getFilterUsage,
  getFilterCombinations,
  getSearchDailyTrend,
  getContentGaps,
  getSearchAnalyticsDashboard,
} from "@/lib/search-analytics-service";

const mockQuery = pool.query as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockQuery.mockReset();
});

// ─── Summary Tests ────────────────────────────────────────────

describe("getSearchAnalyticsSummary", () => {
  it("returns summary with correct calculations", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total_searches: "1000",
            unique_queries: "350",
            zero_result_searches: "150",
            avg_result_count: "12.5",
            searches_with_filters: "400",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ hour: "14", count: "120" }],
      });

    const summary = await getSearchAnalyticsSummary(30);

    expect(summary.totalSearches).toBe(1000);
    expect(summary.uniqueQueries).toBe(350);
    expect(summary.zeroResultSearches).toBe(150);
    expect(summary.zeroResultRate).toBe(15);
    expect(summary.avgResultCount).toBe(13);
    expect(summary.topSearchHour).toBe(14);
    expect(summary.searchesWithFilters).toBe(400);
  });

  it("handles empty data gracefully", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total_searches: "0",
            unique_queries: "0",
            zero_result_searches: "0",
            avg_result_count: null,
            searches_with_filters: "0",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [],
      });

    const summary = await getSearchAnalyticsSummary(30);

    expect(summary.totalSearches).toBe(0);
    expect(summary.zeroResultRate).toBe(0);
    expect(summary.avgResultCount).toBe(0);
    expect(summary.topSearchHour).toBe(12);
  });
});

// ─── Top Queries Tests ──────────────────────────────────────────

describe("getTopQueries", () => {
  it("returns top queries with intent page cross-reference", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            query: "beneteau oceanis",
            count: "50",
            avg_result_count: "15",
            zero_result_count: "2",
            last_searched_at: "2026-06-07T10:00:00Z",
          },
          {
            query: "bluewater cruiser",
            count: "30",
            avg_result_count: "0",
            zero_result_count: "30",
            last_searched_at: "2026-06-07T09:00:00Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { slug: "beneteau-oceanis", search_query: "beneteau oceanis" },
        ],
      });

    const queries = await getTopQueries(30);

    expect(queries).toHaveLength(2);
    expect(queries[0].query).toBe("beneteau oceanis");
    expect(queries[0].count).toBe(50);
    expect(queries[0].avgResultCount).toBe(15);
    expect(queries[0].hasIntentPage).toBe(true);
    expect(queries[0].intentPageSlug).toBe("beneteau-oceanis");
    expect(queries[1].hasIntentPage).toBe(false);
  });

  it("returns empty array when no queries exist", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const queries = await getTopQueries(30);
    expect(queries).toHaveLength(0);
  });
});

// ─── Zero Result Queries Tests ──────────────────────────────────

describe("getZeroResultQueries", () => {
  it("returns zero-result queries with similar queries", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            query: "luxury catamaran",
            count: "15",
            last_searched_at: "2026-06-07T08:00:00Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ q: "catamaran luxury" }, { q: "luxury sailing catamaran" }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const queries = await getZeroResultQueries(30);

    expect(queries).toHaveLength(1);
    expect(queries[0].query).toBe("luxury catamaran");
    expect(queries[0].count).toBe(15);
    expect(queries[0].similarQueries).toHaveLength(2);
    expect(queries[0].suggestedIntentPage).toBeNull();
  });

  it("finds existing intent page for zero-result query", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            query: "fast racer",
            count: "5",
            last_searched_at: "2026-06-07T08:00:00Z",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ q: "fast racing" }] })
      .mockResolvedValueOnce({
        rows: [{ slug: "fast-racer" }],
      });

    const queries = await getZeroResultQueries(30);
    expect(queries[0].suggestedIntentPage).toBe("fast-racer");
  });
});

// ─── Filter Usage Tests ──────────────────────────────────────────

describe("getFilterUsage", () => {
  it("parses filter usage from metadata", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { filters: '{"lengthMin": "30", "lengthMax": "45"}' },
        { filters: '{"lengthMin": "35", "keelType": "fin"}' },
        { filters: '{"lengthMin": "30", "cabinsMin": "3"}' },
      ],
    });

    const usage = await getFilterUsage(30);

    expect(usage.length).toBeGreaterThanOrEqual(3);
    expect(usage[0].filterKey).toBe("lengthMin");
    expect(usage[0].count).toBe(3);
    expect(usage[0].percentage).toBe(100);

    const lengthMin = usage.find((f: any) => f.filterKey === "lengthMin");
    expect(lengthMin).toBeDefined();
    expect(lengthMin!.topValues.length).toBeGreaterThan(0);
  });

  it("handles empty filter data", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const usage = await getFilterUsage(30);
    expect(usage).toHaveLength(0);
  });

  it("handles invalid JSON in filters", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { filters: "not json" },
        { filters: '{"lengthMin": "30"}' },
      ],
    });

    const usage = await getFilterUsage(30);
    expect(usage).toHaveLength(1);
    expect(usage[0].filterKey).toBe("lengthMin");
  });
});

// ─── Filter Combinations Tests ──────────────────────────────────

describe("getFilterCombinations", () => {
  it("finds common filter combinations", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          filters:
            '{"lengthMin": "30", "lengthMax": "45", "cabinsMin": "3"}',
          result_count: "12",
        },
        {
          filters:
            '{"lengthMin": "30", "lengthMax": "45", "keelType": "fin"}',
          result_count: "8",
        },
        {
          filters: '{"lengthMin": "30"}',
          result_count: "50",
        },
      ],
    });

    const combos = await getFilterCombinations(30);

    expect(combos.length).toBeGreaterThanOrEqual(1);
    expect(combos[0].filters.length).toBeGreaterThanOrEqual(2);
    expect(combos[0].count).toBeGreaterThan(0);
  });

  it("returns empty when no combos exist", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const combos = await getFilterCombinations(30);
    expect(combos).toHaveLength(0);
  });
});

// ─── Daily Trend Tests ──────────────────────────────────────────

describe("getSearchDailyTrend", () => {
  it("returns daily trend data", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          date: "2026-06-05",
          total_searches: "45",
          unique_queries: "20",
          zero_result_rate: "11.11",
        },
        {
          date: "2026-06-06",
          total_searches: "62",
          unique_queries: "35",
          zero_result_rate: "16.13",
        },
        {
          date: "2026-06-07",
          total_searches: "38",
          unique_queries: "18",
          zero_result_rate: "13.16",
        },
      ],
    });

    const trend = await getSearchDailyTrend(30);

    expect(trend).toHaveLength(3);
    expect(trend[0].totalSearches).toBe(45);
    expect(trend[1].uniqueQueries).toBe(35);
    expect(trend[2].zeroResultRate).toBe(13.16);
  });
});

// ─── Content Gaps Tests ──────────────────────────────────────────

describe("getContentGaps", () => {
  it("identifies high-priority content gaps", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            query: "luxury catamaran 50ft",
            search_count: "8",
            avg_result_count: "0",
          },
          {
            query: "beneteau first",
            search_count: "15",
            avg_result_count: "3",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ slug: "beneteau-first", search_query: "beneteau first" }],
      });

    const gaps = await getContentGaps(30);

    const catGap = gaps.find((g: any) => g.query === "luxury catamaran 50ft");
    expect(catGap).toBeDefined();
    expect(catGap!.priority).toBe("high");
    expect(catGap!.suggestedAction).toBe("create_intent");

    const beneGap = gaps.find((g: any) => g.query === "beneteau first");
    expect(beneGap).toBeDefined();
    expect(beneGap!.existingIntentSlug).toBe("beneteau-first");
    expect(beneGap!.suggestedAction).toBe("improve_matching");
  });

  it("filters out low-priority monitor items", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            query: "oceanis 40",
            search_count: "2",
            avg_result_count: "25",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });

    const gaps = await getContentGaps(30);
    expect(gaps).toHaveLength(0);
  });
});

// ─── Dashboard Integration Test ──────────────────────────────────

describe("getSearchAnalyticsDashboard", () => {
  it("assembles full dashboard data from all sections", async () => {
    // Promise.all runs queries in parallel, so mock order is non-deterministic.
    // Use a default return value for all calls, with specific overrides for summary.
    let summaryCallCount = 0;
    mockQuery.mockImplementation((sql: string) => {
      const s = typeof sql === "string" ? sql : "";
      // Summary main query (has searches_with_filters)
      if (s.includes("searches_with_filters")) {
        return Promise.resolve({
          rows: [{
            total_searches: "200",
            unique_queries: "80",
            zero_result_searches: "30",
            avg_result_count: "10",
            searches_with_filters: "100",
          }],
        });
      }
      // Peak hour query
      if (s.includes("EXTRACT(HOUR")) {
        return Promise.resolve({ rows: [{ hour: "15", count: "50" }] });
      }
      // Default: empty rows
      return Promise.resolve({ rows: [] });
    });

    const dashboard = await getSearchAnalyticsDashboard(30);

    expect(dashboard.summary.totalSearches).toBe(200);
    expect(dashboard.topQueries).toEqual([]);
    expect(dashboard.zeroResultQueries).toEqual([]);
    expect(dashboard.filterUsage).toEqual([]);
    expect(dashboard.filterCombinations).toEqual([]);
    expect(dashboard.dailyTrend).toEqual([]);
    expect(dashboard.contentGaps).toEqual([]);
    expect(dashboard.period).toEqual({ days: 30 });
  });
});
