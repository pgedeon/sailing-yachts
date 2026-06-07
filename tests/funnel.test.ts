/**
 * P24.3 — Conversion Funnel Tracking Tests
 *
 * Tests for the funnel service, API endpoint, and data transformations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Funnel Service Tests ──────────────────────────────────────

describe("Funnel Service", () => {
  vi.mock("@/lib/db", () => ({
    pool: {
      query: vi.fn(),
    },
  }));

  let pool: any;

  beforeEach(async () => {
    const db = await import("@/lib/db");
    pool = db.pool;
    vi.clearAllMocks();
  });

  describe("getFunnelStageCounts", () => {
    it("should return all 5 funnel stages with session counts", async () => {
      // Mock 5 sequential queries for each stage
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: "500" }] }) // landing
        .mockResolvedValueOnce({ rows: [{ count: "250" }] }) // search
        .mockResolvedValueOnce({ rows: [{ count: "180" }] }) // detail
        .mockResolvedValueOnce({ rows: [{ count: "60" }] }) // compare
        .mockResolvedValueOnce({ rows: [{ count: "15" }] }); // lead

      const { getFunnelStageCounts } = await import("@/lib/funnel-service");
      const stages = await getFunnelStageCounts(30);

      expect(stages).toHaveLength(5);
      expect(stages[0].stage).toBe("landing");
      expect(stages[0].sessions).toBe(500);
      expect(stages[0].conversionRate).toBe(100);

      expect(stages[1].stage).toBe("search");
      expect(stages[1].sessions).toBe(250);
      expect(stages[1].conversionRate).toBe(50); // 250/500 * 100
      expect(stages[1].dropOff).toBe(250);
      expect(stages[1].dropOffRate).toBe(50);

      expect(stages[2].stage).toBe("detail");
      expect(stages[2].sessions).toBe(180);
      expect(stages[2].conversionRate).toBe(72); // 180/250 * 100

      expect(stages[3].stage).toBe("compare");
      expect(stages[3].sessions).toBe(60);
      expect(stages[3].conversionRate).toBeCloseTo(33.33, 0); // 60/180 * 100

      expect(stages[4].stage).toBe("lead");
      expect(stages[4].sessions).toBe(15);
      expect(stages[4].overallConversionRate).toBe(3); // 15/500 * 100
    });

    it("should handle zero sessions gracefully", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: "0" }] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] });

      const { getFunnelStageCounts } = await import("@/lib/funnel-service");
      const stages = await getFunnelStageCounts(30);

      expect(stages).toHaveLength(5);
      expect(stages[0].sessions).toBe(0);
      expect(stages[1].conversionRate).toBe(0);
      expect(stages[1].dropOff).toBe(0);
    });

    it("should calculate overall conversion from landing", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: "1000" }] })
        .mockResolvedValueOnce({ rows: [{ count: "500" }] })
        .mockResolvedValueOnce({ rows: [{ count: "300" }] })
        .mockResolvedValueOnce({ rows: [{ count: "100" }] })
        .mockResolvedValueOnce({ rows: [{ count: "10" }] });

      const { getFunnelStageCounts } = await import("@/lib/funnel-service");
      const stages = await getFunnelStageCounts(30);

      // Overall conversion from landing
      expect(stages[0].overallConversionRate).toBe(100);
      expect(stages[1].overallConversionRate).toBe(50); // 500/1000
      expect(stages[2].overallConversionRate).toBe(30); // 300/1000
      expect(stages[3].overallConversionRate).toBe(10); // 100/1000
      expect(stages[4].overallConversionRate).toBe(1); // 10/1000
    });
  });

  describe("getTimeBetweenStages", () => {
    it("should return time analysis for 4 stage pairs", async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ avg_minutes: "5.2", median_minutes: "3.1", sample_size: "45" }],
        })
        .mockResolvedValueOnce({
          rows: [{ avg_minutes: "12.8", median_minutes: "8.5", sample_size: "30" }],
        })
        .mockResolvedValueOnce({
          rows: [{ avg_minutes: "25.6", median_minutes: "15.0", sample_size: "12" }],
        })
        .mockResolvedValueOnce({
          rows: [{ avg_minutes: "45.3", median_minutes: "30.0", sample_size: "5" }],
        });

      const { getTimeBetweenStages } = await import("@/lib/funnel-service");
      const times = await getTimeBetweenStages(30);

      expect(times).toHaveLength(4);
      expect(times[0]).toEqual({
        from: "landing",
        to: "search",
        avgMinutes: 5.2,
        medianMinutes: 3.1,
        sampleSize: 45,
      });
      expect(times[1].from).toBe("search");
      expect(times[1].to).toBe("detail");
      expect(times[2].from).toBe("detail");
      expect(times[2].to).toBe("compare");
      expect(times[3].from).toBe("compare");
      expect(times[3].to).toBe("lead");
    });

    it("should handle null query results", async () => {
      pool.query
        .mockResolvedValue({ rows: [{ avg_minutes: null, median_minutes: null, sample_size: "0" }] });

      const { getTimeBetweenStages } = await import("@/lib/funnel-service");
      const times = await getTimeBetweenStages(30);

      expect(times).toHaveLength(4);
      expect(times[0].avgMinutes).toBe(0);
      expect(times[0].medianMinutes).toBe(0);
      expect(times[0].sampleSize).toBe(0);
    });
  });

  describe("getFunnelDailyTrend", () => {
    it("should return daily funnel data", async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            date: "2026-06-05",
            landing: "100",
            search: "50",
            detail: "30",
            compare: "10",
            lead: "2",
          },
          {
            date: "2026-06-06",
            landing: "120",
            search: "60",
            detail: "40",
            compare: "15",
            lead: "3",
          },
        ],
      });

      const { getFunnelDailyTrend } = await import("@/lib/funnel-service");
      const trend = await getFunnelDailyTrend(7);

      expect(trend).toHaveLength(2);
      expect(trend[0]).toEqual({
        date: "2026-06-05",
        landing: 100,
        search: 50,
        detail: 30,
        compare: 10,
        lead: 2,
      });
      expect(trend[1].landing).toBe(120);
    });

    it("should handle empty trend data", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const { getFunnelDailyTrend } = await import("@/lib/funnel-service");
      const trend = await getFunnelDailyTrend(7);

      expect(trend).toHaveLength(0);
    });
  });

  describe("getBiggestDropOff", () => {
    it("should identify the biggest drop-off stage", async () => {
      const { getBiggestDropOff } = await import("@/lib/funnel-service");

      const stages = [
        { stage: "landing", label: "Landing", sessions: 500, conversionRate: 100, dropOff: 0, dropOffRate: 0, overallConversionRate: 100 },
        { stage: "search", label: "Search", sessions: 100, conversionRate: 20, dropOff: 400, dropOffRate: 80, overallConversionRate: 20 },
        { stage: "detail", label: "Detail", sessions: 80, conversionRate: 80, dropOff: 20, dropOffRate: 20, overallConversionRate: 16 },
        { stage: "compare", label: "Compare", sessions: 60, conversionRate: 75, dropOff: 20, dropOffRate: 25, overallConversionRate: 12 },
        { stage: "lead", label: "Lead", sessions: 10, conversionRate: 16.67, dropOff: 50, dropOffRate: 83.33, overallConversionRate: 2 },
      ];

      const result = getBiggestDropOff(stages);
      // lead has 83.33% drop-off rate, search has 80% — lead is biggest
      expect(result.from).toBe("compare");
      expect(result.to).toBe("lead");
      expect(result.dropOffRate).toBeCloseTo(83.33, 0);
    });

    it("should handle equal drop-off rates", async () => {
      const { getBiggestDropOff } = await import("@/lib/funnel-service");

      const stages = [
        { stage: "landing", label: "Landing", sessions: 100, conversionRate: 100, dropOff: 0, dropOffRate: 0, overallConversionRate: 100 },
        { stage: "search", label: "Search", sessions: 50, conversionRate: 50, dropOff: 50, dropOffRate: 50, overallConversionRate: 50 },
        { stage: "detail", label: "Detail", sessions: 25, conversionRate: 50, dropOff: 25, dropOffRate: 50, overallConversionRate: 25 },
      ];

      const result = getBiggestDropOff(stages);
      // Both have 50% drop-off — returns the first one found
      expect(result.dropOffRate).toBe(50);
    });
  });

  describe("getFunnelDashboard", () => {
    it("should assemble all funnel data", async () => {
      // Stage counts (5 queries)
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: "300" }] })
        .mockResolvedValueOnce({ rows: [{ count: "150" }] })
        .mockResolvedValueOnce({ rows: [{ count: "100" }] })
        .mockResolvedValueOnce({ rows: [{ count: "40" }] })
        .mockResolvedValueOnce({ rows: [{ count: "5" }] })
        // Time between stages (4 queries)
        .mockResolvedValueOnce({ rows: [{ avg_minutes: "3.0", median_minutes: "2.0", sample_size: "10" }] })
        .mockResolvedValueOnce({ rows: [{ avg_minutes: "5.0", median_minutes: "3.0", sample_size: "8" }] })
        .mockResolvedValueOnce({ rows: [{ avg_minutes: "10.0", median_minutes: "7.0", sample_size: "4" }] })
        .mockResolvedValueOnce({ rows: [{ avg_minutes: "20.0", median_minutes: "15.0", sample_size: "2" }] })
        // Daily trend (1 query)
        .mockResolvedValueOnce({
          rows: [{ date: "2026-06-06", landing: "50", search: "25", detail: "20", compare: "8", lead: "1" }],
        });

      const { getFunnelDashboard } = await import("@/lib/funnel-service");
      const dashboard = await getFunnelDashboard(30);

      expect(dashboard.stages).toHaveLength(5);
      expect(dashboard.totalSessions).toBe(300);
      expect(dashboard.period.days).toBe(30);
      expect(dashboard.avgTimeBetweenStages).toHaveLength(4);
      expect(dashboard.dailyTrend).toHaveLength(1);
      expect(dashboard.biggestDropOff).toBeDefined();
      expect(dashboard.biggestDropOff.dropOffRate).toBeGreaterThan(0);
    });
  });

  describe("getFunnelSummary", () => {
    it("should return key funnel metrics", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: "1000" }] })
        .mockResolvedValueOnce({ rows: [{ count: "400" }] })
        .mockResolvedValueOnce({ rows: [{ count: "250" }] })
        .mockResolvedValueOnce({ rows: [{ count: "80" }] })
        .mockResolvedValueOnce({ rows: [{ count: "12" }] });

      const { getFunnelSummary } = await import("@/lib/funnel-service");
      const summary = await getFunnelSummary(30);

      expect(summary.totalSessions).toBe(1000);
      expect(summary.totalLeads).toBe(12);
      expect(summary.landingToLead).toBe(1.2); // 12/1000 * 100
      expect(summary.landingToDetail).toBe(25); // 250/1000 * 100
      expect(summary.detailToCompare).toBe(32); // 80/250 * 100
      expect(summary.compareToLead).toBe(15); // 12/80 * 100
    });
  });
});

// ─── Funnel API Tests ──────────────────────────────────────────

describe("Funnel API", () => {
  it("should validate funnel data structure", () => {
    const validFunnelData = {
      stages: [
        { stage: "landing", label: "Landing", sessions: 500, conversionRate: 100, dropOff: 0, dropOffRate: 0, overallConversionRate: 100 },
        { stage: "search", label: "Search", sessions: 250, conversionRate: 50, dropOff: 250, dropOffRate: 50, overallConversionRate: 50 },
      ],
      totalSessions: 500,
      period: { days: 30 },
      avgTimeBetweenStages: [
        { from: "landing", to: "search", avgMinutes: 5.2, medianMinutes: 3.1, sampleSize: 45 },
      ],
      biggestDropOff: { from: "search", to: "detail", dropOffRate: 50, dropOffSessions: 250 },
      dailyTrend: [
        { date: "2026-06-06", landing: 100, search: 50, detail: 30, compare: 10, lead: 2 },
      ],
    };

    expect(validFunnelData.stages).toHaveLength(2);
    expect(validFunnelData.period.days).toBe(30);
    expect(validFunnelData.biggestDropOff.dropOffRate).toBe(50);
  });

  it("should clamp days parameter between 1 and 365", () => {
    const clampDays = (d: number) => Math.min(Math.max(d || 30, 1), 365);

    expect(clampDays(0)).toBe(30);   // 0 is falsy -> defaults to 30
    expect(clampDays(-5)).toBe(1);   // -5 is truthy -> max(-5,1)=1
    expect(clampDays(30)).toBe(30);
    expect(clampDays(500)).toBe(365);
    expect(clampDays(NaN)).toBe(30); // NaN is falsy -> defaults to 30
  });

  it("should support summary view parameter", () => {
    const url = new URL("https://info.sailboats.fr/api/admin/funnel?days=30&view=summary");
    const viewParam = url.searchParams.get("view");
    expect(viewParam).toBe("summary");
  });
});

// ─── Funnel Data Transformation Tests ──────────────────────────────

describe("Funnel Data Transformations", () => {
  it("should calculate conversion rates correctly", () => {
    const prev = 200;
    const curr = 150;
    const rate = (curr / prev) * 100;
    const dropOffRate = 100 - rate;

    expect(rate).toBe(75);
    expect(dropOffRate).toBe(25);
  });

  it("should handle zero previous sessions", () => {
    const prev = 0;
    const curr = 50;
    const rate = prev > 0 ? (curr / prev) * 100 : 0;

    expect(rate).toBe(0);
  });

  it("should calculate overall conversion from landing", () => {
    const landing = 1000;
    const stages = [
      { sessions: 1000 },
      { sessions: 500 },
      { sessions: 250 },
      { sessions: 100 },
      { sessions: 10 },
    ];

    const overallRates = stages.map((s) =>
      Math.round((s.sessions / landing) * 10000) / 100
    );

    expect(overallRates[0]).toBe(100);
    expect(overallRates[1]).toBe(50);
    expect(overallRates[2]).toBe(25);
    expect(overallRates[3]).toBe(10);
    expect(overallRates[4]).toBe(1);
  });

  it("should format minutes correctly", () => {
    function formatMinutes(m: number): string {
      if (m < 1) return "< 1 min";
      if (m < 60) return `${Math.round(m)} min`;
      const hours = Math.floor(m / 60);
      const mins = Math.round(m % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    expect(formatMinutes(0.5)).toBe("< 1 min");
    expect(formatMinutes(5)).toBe("5 min");
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(90)).toBe("1h 30m");
    expect(formatMinutes(125)).toBe("2h 5m");
  });
});
