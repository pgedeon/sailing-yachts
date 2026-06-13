import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("@/lib/db", () => ({
  pool: {
    connect: vi.fn(),
  },
}));

// Import after mocking
import { calculateZTest, selectVariant } from "@/lib/affiliate-optimization";
import type { AffiliatePlacement, AffiliateVariant } from "@/lib/affiliate-optimization";

describe("calculateZTest", () => {
  it("returns pValue=1 when impressions are too low", () => {
    const result = calculateZTest(5, 5, 3, 5);
    expect(result.zScore).toBe(0);
    expect(result.pValue).toBe(1);
  });

  it("returns pValue=1 when both have zero conversions", () => {
    const result = calculateZTest(0, 1000, 0, 1000);
    expect(result.zScore).toBe(0);
    expect(result.pValue).toBe(1);
  });

  it("detects significant difference between variants", () => {
    // Variant A: 150 clicks / 1000 impressions (15%)
    // Variant B: 80 clicks / 1000 impressions (8%)
    const result = calculateZTest(150, 1000, 80, 1000);
    expect(result.zScore).toBeGreaterThan(3);
    expect(result.pValue).toBeLessThan(0.01);
  });

  it("detects no significant difference with similar rates", () => {
    // Variant A: 100 clicks / 1000 impressions (10%)
    // Variant B: 98 clicks / 1000 impressions (9.8%)
    const result = calculateZTest(100, 1000, 98, 1000);
    expect(Math.abs(result.zScore)).toBeLessThan(1);
    expect(result.pValue).toBeGreaterThan(0.3);
  });

  it("handles asymmetric sample sizes", () => {
    const result = calculateZTest(50, 200, 20, 200);
    expect(result.zScore).toBeGreaterThan(1);
    expect(result.pValue).toBeLessThan(0.2);
  });

  it("returns 0/1 when pooled proportion is exactly 0 or 1", () => {
    const result = calculateZTest(0, 100, 0, 100);
    expect(result.zScore).toBe(0);
    expect(result.pValue).toBe(1);
  });
});

describe("selectVariant", () => {
  const makePlacement = (overrides?: Partial<AffiliatePlacement>): AffiliatePlacement => ({
    id: 1,
    placementKey: "test_placement",
    label: "Test Placement",
    pagePattern: "/test",
    position: "sidebar",
    isActive: true,
    rotationStrategy: "ab_test",
    autoOptimize: true,
    minSampleSize: 100,
    confidenceThreshold: "0.95",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const makeVariant = (overrides?: Partial<AffiliateVariant> & { id?: number }): AffiliateVariant => ({
    id: overrides?.id || 1,
    placementId: 1,
    variantKey: "variant_a",
    partnerName: "amazon",
    linkText: "Test Link",
    linkUrl: "https://example.com",
    affiliateTag: null,
    displayOrder: 0,
    trafficWeight: 50,
    isActive: true,
    isWinner: false,
    clicks: 0,
    conversions: 0,
    estimatedRevenue: "0.00",
    impressions: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  it("returns null when no active variants", () => {
    const result = selectVariant(makePlacement(), []);
    expect(result).toBeNull();
  });

  it("returns the single variant when only one exists", () => {
    const v = makeVariant();
    const result = selectVariant(makePlacement(), [v]);
    expect(result?.id).toBe(v.id);
  });

  it("returns winner in best_performer strategy", () => {
    const winner = makeVariant({ id: 1, variantKey: "winner", isWinner: true });
    const loser = makeVariant({ id: 2, variantKey: "loser" });
    const result = selectVariant(makePlacement({ rotationStrategy: "best_performer" }), [winner, loser]);
    expect(result?.id).toBe(1);
  });

  it("falls back to revenue-per-click when no winner in best_performer", () => {
    const lowRpc = makeVariant({
      id: 1,
      variantKey: "low",
      clicks: 100,
      estimatedRevenue: "10.00",
    });
    const highRpc = makeVariant({
      id: 2,
      variantKey: "high",
      clicks: 100,
      estimatedRevenue: "50.00",
    });
    const result = selectVariant(makePlacement({ rotationStrategy: "best_performer" }), [lowRpc, highRpc]);
    expect(result?.id).toBe(2);
  });

  it("returns variant with fewest impressions in round_robin", () => {
    const more = makeVariant({ id: 1, impressions: 500 });
    const fewer = makeVariant({ id: 2, impressions: 100 });
    const result = selectVariant(makePlacement({ rotationStrategy: "round_robin" }), [more, fewer]);
    expect(result?.id).toBe(2);
  });

  it("returns one of the variants in ab_test mode", () => {
    const v1 = makeVariant({ id: 1, trafficWeight: 50 });
    const v2 = makeVariant({ id: 2, trafficWeight: 50 });
    const result = selectVariant(makePlacement({ rotationStrategy: "ab_test" }), [v1, v2]);
    expect([1, 2]).toContain(result?.id);
  });

  it("skips inactive variants", () => {
    const active = makeVariant({ id: 1, isActive: true });
    const inactive = makeVariant({ id: 2, isActive: false });
    const result = selectVariant(makePlacement(), [active, inactive]);
    expect(result?.id).toBe(1);
  });
});

describe("Affiliate Tracking API Schema", () => {
  it("should export schema types without errors", async () => {
    const schema = await import("../../drizzle/schema");
    expect(schema.affiliatePlacements).toBeDefined();
    expect(schema.affiliateVariants).toBeDefined();
    expect(schema.affiliateTrackingEvents).toBeDefined();
    expect(schema.insertAffiliatePlacementSchema).toBeDefined();
    expect(schema.insertAffiliateVariantSchema).toBeDefined();
    expect(schema.insertAffiliateTrackingEventSchema).toBeDefined();
  });
});
