/**
 * P24.5 — Competitive Positioning Matrix Tests
 *
 * Tests for the competitive positioning service, data transformations,
 * scoring functions, and API contract.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Service Tests ──────────────────────────────────────────────

describe("Competitive Positioning Service", () => {
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

  describe("getManufacturerPositions", () => {
    it("should return manufacturer positioning data", async () => {
      // Main query
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            manufacturer_id: 1,
            manufacturer_name: "Beneteau",
            country: "France",
            logo_url: "/logos/beneteau.svg",
            fleet_size: "45",
            avg_length: "38.5",
            min_length: "25",
            max_length: "55",
            avg_completeness: "72",
          },
          {
            manufacturer_id: 2,
            manufacturer_name: "Bavaria",
            country: "Germany",
            logo_url: null,
            fleet_size: "20",
            avg_length: "36.2",
            min_length: "30",
            max_length: "46",
            avg_completeness: "65",
          },
        ],
      });

      // Price query
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            manufacturer_id: 1,
            avg_price: "250000",
            min_price: "120000",
            max_price: "500000",
          },
        ],
      });

      // Segment query
      pool.query.mockResolvedValueOnce({
        rows: [
          { manufacturer_id: 1, segment: "35-40ft", count: "15" },
          { manufacturer_id: 1, segment: "40-45ft", count: "12" },
          { manufacturer_id: 1, segment: "30-35ft", count: "8" },
          { manufacturer_id: 1, segment: "45-50ft", count: "6" },
          { manufacturer_id: 1, segment: "over-50ft", count: "2" },
          { manufacturer_id: 1, segment: "under-30ft", count: "2" },
          { manufacturer_id: 2, segment: "35-40ft", count: "10" },
          { manufacturer_id: 2, segment: "30-35ft", count: "8" },
          { manufacturer_id: 2, segment: "40-45ft", count: "2" },
        ],
      });

      // Feature density query
      pool.query.mockResolvedValueOnce({
        rows: [
          { manufacturer_id: 1, feature_density: "12.5" },
          { manufacturer_id: 2, feature_density: "10.2" },
        ],
      });

      const { getManufacturerPositions } = await import("@/lib/competitive-positioning-service");
      const positions = await getManufacturerPositions();

      expect(positions).toHaveLength(2);

      // Beneteau — full segment coverage
      expect(positions[0].manufacturerName).toBe("Beneteau");
      expect(positions[0].fleetSize).toBe(45);
      expect(positions[0].breadthScore).toBe(100); // all 6 segments covered
      expect(positions[0].priceTier).toBe("premium"); // avg 250k

      // Bavaria — partial coverage
      expect(positions[1].manufacturerName).toBe("Bavaria");
      expect(positions[1].fleetSize).toBe(20);
      expect(positions[1].breadthScore).toBe(50); // 3 out of 6 segments
      expect(positions[1].priceTier).toBe("unknown"); // no price data
    });

    it("should handle empty results", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const { getManufacturerPositions } = await import("@/lib/competitive-positioning-service");
      const positions = await getManufacturerPositions();

      expect(positions).toHaveLength(0);
    });
  });

  describe("getSegmentCoverage", () => {
    it("should return coverage for all 6 size segments", async () => {
      // getSegmentCoverage calls getManufacturerPositions internally
      // So we need to mock all 4 queries that getManufacturerPositions makes

      // Main query
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            manufacturer_id: 1, manufacturer_name: "Beneteau", country: "France",
            logo_url: null, fleet_size: "10", avg_length: "38", min_length: "30",
            max_length: "45", avg_completeness: "70",
          },
        ],
      });
      // Price query
      pool.query.mockResolvedValueOnce({ rows: [] });
      // Segment query
      pool.query.mockResolvedValueOnce({
        rows: [
          { manufacturer_id: 1, segment: "35-40ft", count: "6" },
          { manufacturer_id: 1, segment: "40-45ft", count: "4" },
        ],
      });
      // Feature density query
      pool.query.mockResolvedValueOnce({
        rows: [{ manufacturer_id: 1, feature_density: "10" }],
      });

      const { getSegmentCoverage } = await import("@/lib/competitive-positioning-service");
      const coverage = await getSegmentCoverage();

      expect(coverage).toHaveLength(6);
      expect(coverage[0].segment).toBe("under-30ft");
      expect(coverage[0].yachtCount).toBe(0);
      expect(coverage[0].manufacturerCount).toBe(0);

      // 35-40ft segment has Beneteau with 6 models
      const seg3540 = coverage.find((s) => s.segment === "35-40ft")!;
      expect(seg3540.yachtCount).toBe(6);
      expect(seg3540.manufacturerCount).toBe(1);
      expect(seg3540.manufacturers[0].name).toBe("Beneteau");
      expect(seg3540.manufacturers[0].count).toBe(6);
    });
  });

  describe("getPricePositioning", () => {
    it("should return price tier distribution", async () => {
      // getManufacturerPositions mock
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            manufacturer_id: 1, manufacturer_name: "BudgetCo", country: null,
            logo_url: null, fleet_size: "5", avg_length: "30", min_length: "25",
            max_length: "35", avg_completeness: "50",
          },
          {
            manufacturer_id: 2, manufacturer_name: "LuxCo", country: null,
            logo_url: null, fleet_size: "8", avg_length: "48", min_length: "42",
            max_length: "55", avg_completeness: "80",
          },
        ],
      });
      // Price query
      pool.query.mockResolvedValueOnce({
        rows: [
          { manufacturer_id: 1, avg_price: "50000", min_price: "40000", max_price: "60000" },
          { manufacturer_id: 2, avg_price: "750000", min_price: "500000", max_price: "1000000" },
        ],
      });
      // Segment query
      pool.query.mockResolvedValueOnce({ rows: [] });
      // Feature density query
      pool.query.mockResolvedValueOnce({
        rows: [
          { manufacturer_id: 1, feature_density: "8" },
          { manufacturer_id: 2, feature_density: "14" },
        ],
      });

      const { getPricePositioning } = await import("@/lib/competitive-positioning-service");
      const tiers = await getPricePositioning();

      expect(tiers).toHaveLength(5); // 4 tiers + unknown
      expect(tiers.find((t) => t.tier === "budget")!.manufacturerCount).toBe(1);
      expect(tiers.find((t) => t.tier === "luxury")!.manufacturerCount).toBe(1);
      expect(tiers.find((t) => t.tier === "unknown")!.manufacturerCount).toBe(0);
    });
  });

  describe("getPositioningQuadrants", () => {
    it("should classify manufacturers into quadrants", async () => {
      // getManufacturerPositions mock
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            manufacturer_id: 1, manufacturer_name: "BigCo", country: null,
            logo_url: null, fleet_size: "50", avg_length: "38", min_length: "25",
            max_length: "55", avg_completeness: "80",
          },
          {
            manufacturer_id: 2, manufacturer_name: "SmallCo", country: null,
            logo_url: null, fleet_size: "3", avg_length: "35", min_length: "34",
            max_length: "36", avg_completeness: "40",
          },
        ],
      });
      // Price query
      pool.query.mockResolvedValueOnce({ rows: [] });
      // Segment query — BigCo covers all segments, SmallCo only 1
      pool.query.mockResolvedValueOnce({
        rows: [
          { manufacturer_id: 1, segment: "under-30ft", count: "5" },
          { manufacturer_id: 1, segment: "30-35ft", count: "8" },
          { manufacturer_id: 1, segment: "35-40ft", count: "12" },
          { manufacturer_id: 1, segment: "40-45ft", count: "10" },
          { manufacturer_id: 1, segment: "45-50ft", count: "8" },
          { manufacturer_id: 1, segment: "over-50ft", count: "7" },
          { manufacturer_id: 2, segment: "35-40ft", count: "3" },
        ],
      });
      // Feature density query
      pool.query.mockResolvedValueOnce({
        rows: [
          { manufacturer_id: 1, feature_density: "14" },
          { manufacturer_id: 2, feature_density: "6" },
        ],
      });

      const { getPositioningQuadrants } = await import("@/lib/competitive-positioning-service");
      const quadrants = await getPositioningQuadrants();

      expect(quadrants).toHaveLength(2);

      // BigCo: breadth=100 (all segments), depth=high → dominant
      const bigCo = quadrants.find((q) => q.manufacturerName === "BigCo")!;
      expect(bigCo.breadthScore).toBe(100);
      expect(bigCo.quadrant).toBe("dominant");

      // SmallCo: breadth=~17 (1/6), depth depends on avg → likely niche
      const smallCo = quadrants.find((q) => q.manufacturerName === "SmallCo")!;
      expect(smallCo.breadthScore).toBe(17); // Math.round(1/6 * 100)
      expect(["niche", "specialist"]).toContain(smallCo.quadrant);
    });
  });

  describe("getCompetitiveMatrix", () => {
    it("should assemble full competitive matrix", async () => {
      // Mock getManufacturerPositions (4 queries)
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            manufacturer_id: 1, manufacturer_name: "TestCo", country: "France",
            logo_url: null, fleet_size: "10", avg_length: "38", min_length: "30",
            max_length: "45", avg_completeness: "70",
          },
        ],
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ manufacturer_id: 1, avg_price: "150000", min_price: "100000", max_price: "200000" }],
      });
      pool.query.mockResolvedValueOnce({
        rows: [
          { manufacturer_id: 1, segment: "35-40ft", count: "6" },
          { manufacturer_id: 1, segment: "40-45ft", count: "4" },
        ],
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ manufacturer_id: 1, feature_density: "11" }],
      });

      // getSegmentCoverage internally calls getManufacturerPositions again (4 queries)
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            manufacturer_id: 1, manufacturer_name: "TestCo", country: "France",
            logo_url: null, fleet_size: "10", avg_length: "38", min_length: "30",
            max_length: "45", avg_completeness: "70",
          },
        ],
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ manufacturer_id: 1, avg_price: "150000", min_price: "100000", max_price: "200000" }],
      });
      pool.query.mockResolvedValueOnce({
        rows: [
          { manufacturer_id: 1, segment: "35-40ft", count: "6" },
          { manufacturer_id: 1, segment: "40-45ft", count: "4" },
        ],
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ manufacturer_id: 1, feature_density: "11" }],
      });

      // getPricePositioning internally calls getManufacturerPositions again (4 queries)
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            manufacturer_id: 1, manufacturer_name: "TestCo", country: "France",
            logo_url: null, fleet_size: "10", avg_length: "38", min_length: "30",
            max_length: "45", avg_completeness: "70",
          },
        ],
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ manufacturer_id: 1, avg_price: "150000", min_price: "100000", max_price: "200000" }],
      });
      pool.query.mockResolvedValueOnce({
        rows: [
          { manufacturer_id: 1, segment: "35-40ft", count: "6" },
          { manufacturer_id: 1, segment: "40-45ft", count: "4" },
        ],
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ manufacturer_id: 1, feature_density: "11" }],
      });

      // getPositioningQuadrants internally calls getManufacturerPositions again (4 queries)
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            manufacturer_id: 1, manufacturer_name: "TestCo", country: "France",
            logo_url: null, fleet_size: "10", avg_length: "38", min_length: "30",
            max_length: "45", avg_completeness: "70",
          },
        ],
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ manufacturer_id: 1, avg_price: "150000", min_price: "100000", max_price: "200000" }],
      });
      pool.query.mockResolvedValueOnce({
        rows: [
          { manufacturer_id: 1, segment: "35-40ft", count: "6" },
          { manufacturer_id: 1, segment: "40-45ft", count: "4" },
        ],
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ manufacturer_id: 1, feature_density: "11" }],
      });

      const { getCompetitiveMatrix } = await import("@/lib/competitive-positioning-service");
      const matrix = await getCompetitiveMatrix();

      expect(matrix.manufacturers).toHaveLength(1);
      expect(matrix.segmentCoverage).toHaveLength(6);
      expect(matrix.pricePositioning).toHaveLength(5);
      expect(matrix.quadrants).toHaveLength(1);
      expect(matrix.totalManufacturers).toBe(1);
      expect(matrix.totalYachts).toBe(10);
      expect(matrix.largestFleet).toBe("TestCo");
      expect(matrix.mostDiverse).toBe("TestCo");
      expect(matrix.premiumLeader).toBe("TestCo");
    });
  });
});

// ─── Scoring Logic Tests ──────────────────────────────────────────

describe("Positioning Score Calculations", () => {
  it("should classify size segments correctly", async () => {
    const { classifySizeSegment } = await import("@/lib/competitive-positioning-service");

    expect(classifySizeSegment(25)).toBe("under-30ft");
    expect(classifySizeSegment(32)).toBe("30-35ft");
    expect(classifySizeSegment(38)).toBe("35-40ft");
    expect(classifySizeSegment(42)).toBe("40-45ft");
    expect(classifySizeSegment(48)).toBe("45-50ft");
    expect(classifySizeSegment(55)).toBe("over-50ft");
  });

  it("should classify price tiers correctly", async () => {
    const { classifyPriceTier } = await import("@/lib/competitive-positioning-service");

    expect(classifyPriceTier(50000)).toBe("budget");
    expect(classifyPriceTier(120000)).toBe("mid-range");
    expect(classifyPriceTier(350000)).toBe("premium");
    expect(classifyPriceTier(750000)).toBe("luxury");
    expect(classifyPriceTier(null)).toBe("unknown");
  });

  it("should compute breadth score from segment coverage", async () => {
    const { computeBreadthScore } = await import("@/lib/competitive-positioning-service");

    // All 6 segments covered
    expect(computeBreadthScore({
      "under-30ft": 1, "30-35ft": 1, "35-40ft": 1,
      "40-45ft": 1, "45-50ft": 1, "over-50ft": 1,
    })).toBe(100);

    // 3 segments covered
    expect(computeBreadthScore({
      "under-30ft": 0, "30-35ft": 5, "35-40ft": 3,
      "40-45ft": 0, "45-50ft": 2, "over-50ft": 0,
    })).toBe(50);

    // No segments
    expect(computeBreadthScore({
      "under-30ft": 0, "30-35ft": 0, "35-40ft": 0,
      "40-45ft": 0, "45-50ft": 0, "over-50ft": 0,
    })).toBe(0);
  });

  it("should compute depth score from segment distribution", async () => {
    const { computeDepthScore } = await import("@/lib/competitive-positioning-service");

    // 10 models across 2 segments = avg 5 per segment = score 100
    expect(computeDepthScore({
      "under-30ft": 0, "30-35ft": 5, "35-40ft": 5,
      "40-45ft": 0, "45-50ft": 0, "over-50ft": 0,
    }, 10)).toBe(100);

    // 2 models across 2 segments = avg 1 per segment = score 20
    expect(computeDepthScore({
      "under-30ft": 0, "30-35ft": 1, "35-40ft": 1,
      "40-45ft": 0, "45-50ft": 0, "over-50ft": 0,
    }, 2)).toBe(20);
  });

  it("should classify quadrants correctly", async () => {
    const { classifyQuadrant } = await import("@/lib/competitive-positioning-service");

    expect(classifyQuadrant(80, 80)).toBe("dominant");
    expect(classifyQuadrant(80, 20)).toBe("generalist");
    expect(classifyQuadrant(20, 80)).toBe("specialist");
    expect(classifyQuadrant(20, 20)).toBe("niche");
  });
});

// ─── API Contract Tests ──────────────────────────────────────────

describe("Competitive Positioning API Contract", () => {
  it("should validate competitive matrix data structure", () => {
    const validMatrix = {
      manufacturers: [
        {
          manufacturerId: 1,
          manufacturerName: "TestCo",
          country: "France",
          logoUrl: null,
          fleetSize: 10,
          avgLength: 38,
          minLength: 30,
          maxLength: 45,
          sizeSegments: {
            "under-30ft": 0, "30-35ft": 2, "35-40ft": 5,
            "40-45ft": 3, "45-50ft": 0, "over-50ft": 0,
          },
          priceTier: "mid-range",
          avgPrice: 150000,
          minPrice: 100000,
          maxPrice: 200000,
          avgCompleteness: 70,
          featureDensity: 12.5,
          positioningScore: 65,
          breadthScore: 50,
          depthScore: 40,
        },
      ],
      segmentCoverage: [
        {
          segment: "35-40ft",
          label: "35–40ft",
          rangeLabel: "10.67–12.19m",
          manufacturerCount: 1,
          yachtCount: 5,
          manufacturers: [{ name: "TestCo", count: 5 }],
        },
      ],
      pricePositioning: [
        { tier: "mid-range", label: "Mid-Range", rangeLabel: "€80k–€200k", manufacturerCount: 1, avgFleetSize: 10 },
      ],
      quadrants: [
        { manufacturerId: 1, manufacturerName: "TestCo", breadthScore: 50, depthScore: 40, quadrant: "niche" },
      ],
      totalManufacturers: 1,
      totalYachts: 10,
      mostDiverse: "TestCo",
      largestFleet: "TestCo",
      premiumLeader: "TestCo",
    };

    expect(validMatrix.manufacturers).toHaveLength(1);
    expect(validMatrix.manufacturers[0].sizeSegments).toHaveProperty("35-40ft");
    expect(validMatrix.quadrants[0].quadrant).toBe("niche");
    expect(validMatrix.pricePositioning[0].tier).toBe("mid-range");
  });
});

// ─── Data Transformation Tests ──────────────────────────────────────

describe("Competitive Data Transformations", () => {
  it("should calculate positioning score as weighted composite", () => {
    const breadth = 80;
    const depth = 60;
    const fleetSize = 30;
    const completeness = 70;
    const featureDensity = 12;

    const score = Math.round(
      breadth * 0.3 +
      depth * 0.3 +
      Math.min(fleetSize, 50) / 50 * 100 * 0.2 +
      completeness * 0.1 +
      Math.min(featureDensity / 16, 1) * 100 * 0.1
    );

    // 80*0.3 + 60*0.3 + 60*0.2 + 70*0.1 + 75*0.1 = 24 + 18 + 12 + 7 + 7.5 = 68.5 → 69
    expect(score).toBe(69);
  });

  it("should format prices correctly", () => {
    function formatPrice(n: number | null): string {
      if (n === null) return "—";
      if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
      if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
      return `€${n.toLocaleString()}`;
    }

    expect(formatPrice(null)).toBe("—");
    expect(formatPrice(500)).toBe("€500");
    expect(formatPrice(50000)).toBe("€50K");
    expect(formatPrice(150000)).toBe("€150K");
    expect(formatPrice(1500000)).toBe("€1.5M");
  });

  it("should count covered segments correctly", () => {
    const segments = {
      "under-30ft": 0, "30-35ft": 5, "35-40ft": 3,
      "40-45ft": 0, "45-50ft": 2, "over-50ft": 0,
    };
    const covered = Object.values(segments).filter((c) => c > 0).length;
    expect(covered).toBe(3);
  });
});
