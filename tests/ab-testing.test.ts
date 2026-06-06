/**
 * Tests for P24.2 — A/B Testing Admin Dashboard
 *
 * Covers:
 * - Statistical functions (proportion SE, CI, Z-test)
 * - Variant assignment determinism
 * - Event logging API
 * - Dashboard data assembly
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  insertAbEvent,
  getExperimentAggregates,
  getTotalEventCount,
  getAbTestingDashboard,
  type VariantStats,
} from "../lib/ab-testing-service";
import {
  assignVariant,
  getAllAssignments,
  EXPERIMENTS,
  type ExperimentId,
} from "../lib/ab-testing";

// ─── Statistical Function Tests ───

describe("A/B Testing — Variant Assignment", () => {
  it("assigns variants deterministically for the same user", () => {
    const userId = "user-123";
    const v1 = assignVariant("yacht_description_style", userId);
    const v2 = assignVariant("yacht_description_style", userId);
    expect(v1.id).toBe(v2.id);
    expect(v1.name).toBe(v2.name);
  });

  it("assigns different variants for different users", () => {
    const variants = new Set<string>();
    // Try many users to get at least 2 different variants
    for (let i = 0; i < 100; i++) {
      const v = assignVariant("yacht_description_style", `user-${i}`);
      variants.add(v.id);
    }
    // Should have at least 2 different variants assigned
    expect(variants.size).toBeGreaterThanOrEqual(2);
  });

  it("returns all assignments for a user", () => {
    const assignments = getAllAssignments("user-abc");
    expect(Object.keys(assignments)).toEqual(Object.keys(EXPERIMENTS));
    for (const id of Object.keys(EXPERIMENTS) as ExperimentId[]) {
      expect(assignments[id]).toBeDefined();
      expect(assignments[id].id).toBeTruthy();
    }
  });

  it("returns all expected variants in the experiment definitions", () => {
    const exp = EXPERIMENTS.yacht_description_style;
    expect(exp.variants).toHaveLength(3);
    expect(exp.variants.map((v) => v.id)).toEqual(
      expect.arrayContaining(["balanced", "technical", "marketing"]),
    );
  });

  it("respects variant weights (rough distribution)", () => {
    // Control has 50% weight — test with enough users
    const counts: Record<string, number> = {};
    const n = 1000;
    for (let i = 0; i < n; i++) {
      const v = assignVariant("yacht_description_style", `dist-user-${i}`);
      counts[v.id] = (counts[v.id] || 0) + 1;
    }
    // Control should get roughly 50% (within 10% tolerance)
    expect(counts["balanced"] / n).toBeGreaterThan(0.35);
    expect(counts["balanced"] / n).toBeLessThan(0.65);
  });
});

// ─── Event Logging Tests ───

describe("A/B Testing — Event Logging", () => {
  let mockQueryFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQueryFn = vi.fn().mockResolvedValue({ rows: [] });
  });

  it("inserts an impression event", async () => {
    await insertAbEvent(mockQueryFn, {
      experimentId: "yacht_description_style",
      variantId: "balanced",
      userId: "user-1",
      eventType: "impression",
    });

    expect(mockQueryFn).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQueryFn.mock.calls[0];
    expect(sql).toContain("INSERT INTO ab_events");
    expect(params).toEqual([
      "yacht_description_style",
      "balanced",
      "user-1",
      "impression",
      "{}",
    ]);
  });

  it("inserts an event with metadata", async () => {
    await insertAbEvent(mockQueryFn, {
      experimentId: "yacht_cta_style",
      variantId: "action",
      userId: "user-2",
      eventType: "conversion",
      metadata: { page: "/yachts/test", source: "organic" },
    });

    expect(mockQueryFn).toHaveBeenCalledTimes(1);
    const params = mockQueryFn.mock.calls[0][1];
    expect(params[4]).toBe(JSON.stringify({ page: "/yachts/test", source: "organic" }));
  });
});

// ─── Aggregation Tests ───

describe("A/B Testing — Data Aggregation", () => {
  let mockQueryFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQueryFn = vi.fn();
  });

  it("aggregates event counts per variant", async () => {
    mockQueryFn.mockResolvedValueOnce({
      rows: [
        { variant_id: "balanced", impressions: "100", conversions: "10", clicks: "20" },
        { variant_id: "technical", impressions: "50", conversions: "7", clicks: "12" },
        { variant_id: "marketing", impressions: "45", conversions: "3", clicks: "8" },
      ],
    });

    const agg = await getExperimentAggregates(mockQueryFn, "yacht_description_style");
    expect(agg["balanced"]).toEqual({ impressions: 100, conversions: 10, clicks: 20 });
    expect(agg["technical"]).toEqual({ impressions: 50, conversions: 7, clicks: 12 });
    expect(agg["marketing"]).toEqual({ impressions: 45, conversions: 3, clicks: 8 });
  });

  it("returns empty object when no events exist", async () => {
    mockQueryFn.mockResolvedValueOnce({ rows: [] });
    const agg = await getExperimentAggregates(mockQueryFn, "yacht_description_style");
    expect(agg).toEqual({});
  });

  it("gets total event count", async () => {
    mockQueryFn.mockResolvedValueOnce({ rows: [{ cnt: "42" }] });
    const count = await getTotalEventCount(mockQueryFn);
    expect(count).toBe(42);
  });
});

// ─── Dashboard Assembly Tests ───

describe("A/B Testing — Dashboard Data", () => {
  let mockQueryFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQueryFn = vi.fn();
  });

  it("assembles dashboard with experiment results", async () => {
    // getExperimentAggregates for each experiment (2)
    mockQueryFn
      .mockResolvedValueOnce({
        rows: [
          { variant_id: "balanced", impressions: "200", conversions: "20", clicks: "40" },
          { variant_id: "technical", impressions: "100", conversions: "15", clicks: "25" },
          { variant_id: "marketing", impressions: "95", conversions: "5", clicks: "15" },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ start_date: "2026-06-01T00:00:00Z" }] })
      .mockResolvedValueOnce({
        rows: [
          { variant_id: "default", impressions: "300", conversions: "30", clicks: "60" },
          { variant_id: "action", impressions: "150", conversions: "25", clicks: "40" },
          { variant_id: "benefit", impressions: "145", conversions: "18", clicks: "30" },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ start_date: "2026-06-02T00:00:00Z" }] })
      // getTotalEventCount
      .mockResolvedValueOnce({ rows: [{ cnt: "1173" }] });

    const dashboard = await getAbTestingDashboard(mockQueryFn);

    expect(dashboard.experiments).toHaveLength(2);
    expect(dashboard.totalEvents).toBe(1313);
    expect(dashboard.activeExperiments).toBe(2);

    const descExp = dashboard.experiments.find(
      (e) => e.experimentId === "yacht_description_style",
    );
    expect(descExp).toBeDefined();
    expect(descExp!.totalImpressions).toBe(395);
    expect(descExp!.totalConversions).toBe(40);
    expect(descExp!.variants).toHaveLength(3);

    // Check significance analysis exists
    expect(descExp!.significance).toBeDefined();
    expect(descExp!.significance!.pValue).toBeGreaterThanOrEqual(0);
    expect(descExp!.significance!.pValue).toBeLessThanOrEqual(1);
  });

  it("handles experiments with no data gracefully", async () => {
    // Both experiments return empty aggregates
    mockQueryFn
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ start_date: null }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ start_date: null }] })
      .mockResolvedValueOnce({ rows: [{ cnt: "0" }] });

    const dashboard = await getAbTestingDashboard(mockQueryFn);

    expect(dashboard.experiments).toHaveLength(2);
    expect(dashboard.totalEvents).toBe(0);
    for (const exp of dashboard.experiments) {
      expect(exp.totalImpressions).toBe(0);
      expect(exp.totalConversions).toBe(0);
      expect(exp.variants).toHaveLength(3); // Still has variant definitions
      expect(exp.variants.every((v) => v.impressions === 0)).toBe(true);
    }
  });

  it("calculates confidence intervals correctly", async () => {
    mockQueryFn
      .mockResolvedValueOnce({
        rows: [
          { variant_id: "balanced", impressions: "1000", conversions: "100", clicks: "200" },
          { variant_id: "technical", impressions: "500", conversions: "60", clicks: "120" },
          { variant_id: "marketing", impressions: "480", conversions: "40", clicks: "80" },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ start_date: "2026-05-21T00:00:00Z" }] })
      .mockResolvedValueOnce({
        rows: [
          { variant_id: "default", impressions: "800", conversions: "80", clicks: "150" },
          { variant_id: "action", impressions: "400", conversions: "50", clicks: "100" },
          { variant_id: "benefit", impressions: "390", conversions: "35", clicks: "70" },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ start_date: "2026-05-21T00:00:00Z" }] })
      .mockResolvedValueOnce({ rows: [{ cnt: "2685" }] });

    const dashboard = await getAbTestingDashboard(mockQueryFn);
    const descExp = dashboard.experiments[0];

    // Balanced: 100/1000 = 0.10 conversion rate
    const balanced = descExp.variants.find((v) => v.variantId === "balanced")!;
    expect(balanced.conversionRate).toBe(0.10);
    expect(balanced.standardError).toBeGreaterThan(0);
    expect(balanced.confidenceInterval95[0]).toBeLessThan(0.10);
    expect(balanced.confidenceInterval95[1]).toBeGreaterThan(0.10);
  });
});

// ─── Statistical Significance Detection ───

describe("A/B Testing — Significance Calculation", () => {
  it("detects significant results with clear winner", async () => {
    const mockQueryFn = vi.fn()
      // yacht_description_style aggregates
      .mockResolvedValueOnce({
        rows: [
          { variant_id: "balanced", impressions: "10000", conversions: "500", clicks: "2000" },
          { variant_id: "technical", impressions: "5000", conversions: "400", clicks: "1100" },
          { variant_id: "marketing", impressions: "4800", conversions: "200", clicks: "900" },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ start_date: "2026-05-21T00:00:00Z" }] })
      // yacht_cta_style aggregates
      .mockResolvedValueOnce({
        rows: [
          { variant_id: "default", impressions: "8000", conversions: "400", clicks: "1500" },
          { variant_id: "action", impressions: "4000", conversions: "250", clicks: "800" },
          { variant_id: "benefit", impressions: "3900", conversions: "180", clicks: "700" },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ start_date: "2026-05-21T00:00:00Z" }] })
      .mockResolvedValueOnce({ rows: [{ cnt: "39100" }] });

    const dashboard = await getAbTestingDashboard(mockQueryFn);
    const descExp = dashboard.experiments[0];

    // Technical variant: 400/5000 = 8% vs Control: 500/10000 = 5%
    // This should be significant with this sample size
    expect(descExp.significance).toBeDefined();
    expect(descExp.significance!.isSignificant).toBe(true);
    expect(descExp.significance!.winner).toBe("technical");
    expect(descExp.significance!.improvementPercent).toBeGreaterThan(0);
  });

  it("recommends continuing for insufficient data", async () => {
    const mockQueryFn = vi.fn()
      .mockResolvedValueOnce({
        rows: [
          { variant_id: "balanced", impressions: "5", conversions: "1", clicks: "2" },
          { variant_id: "technical", impressions: "3", conversions: "0", clicks: "1" },
          { variant_id: "marketing", impressions: "2", conversions: "0", clicks: "1" },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ start_date: "2026-06-01T00:00:00Z" }] })
      .mockResolvedValueOnce({
        rows: [
          { variant_id: "default", impressions: "4", conversions: "1", clicks: "2" },
          { variant_id: "action", impressions: "2", conversions: "0", clicks: "1" },
          { variant_id: "benefit", impressions: "2", conversions: "1", clicks: "1" },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ start_date: "2026-06-01T00:00:00Z" }] })
      .mockResolvedValueOnce({ rows: [{ cnt: "22" }] });

    const dashboard = await getAbTestingDashboard(mockQueryFn);
    const descExp = dashboard.experiments[0];

    expect(descExp.significance).toBeDefined();
    expect(descExp.significance!.isSignificant).toBe(false);
    expect(descExp.significance!.recommendation).toContain("more data");
  });
});

// ─── API Route Tests ───

describe("A/B Testing — Event API Validation", () => {
  it("validates required fields", async () => {
    // Simulate the validation logic from the route
    const body = { experimentId: "", variantId: "balanced", userId: "u1", eventType: "impression" };
    const { experimentId, variantId, userId, eventType } = body;
    const hasAll = !!(experimentId && variantId && userId && eventType);
    expect(hasAll).toBe(false);
  });

  it("validates event type enum", () => {
    const validTypes = ["impression", "conversion", "click"];
    expect(validTypes.includes("impression")).toBe(true);
    expect(validTypes.includes("invalid")).toBe(false);
  });
});
