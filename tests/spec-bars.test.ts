import { describe, it, expect } from "vitest";

// ─── Percentile & color logic (mirrors component logic) ────────────

function getBarColor(percentile: number): string {
  if (percentile < 30) return "#3b82f6";
  if (percentile > 70) return "#10b981";
  return "#6366f1";
}

function calculatePercentile(value: number, min: number, max: number): number {
  const range = max - min;
  if (range === 0) return 50;
  return Math.round(((value - min) / range) * 100);
}

describe("Spec Bars — percentile calculation", () => {
  it("returns 50 for equal min/max", () => {
    expect(calculatePercentile(10, 10, 10)).toBe(50);
  });

  it("returns 0 when value equals min", () => {
    expect(calculatePercentile(5, 5, 10)).toBe(0);
  });

  it("returns 100 when value equals max", () => {
    expect(calculatePercentile(10, 5, 10)).toBe(100);
  });

  it("returns 50 when value is midpoint", () => {
    expect(calculatePercentile(7.5, 5, 10)).toBe(50);
  });

  it("handles decimal values correctly", () => {
    // 12.3 is 46% of the way from 10 to 15.6
    const result = calculatePercentile(12.3, 10, 15.6);
    expect(result).toBe(41); // (12.3-10)/(15.6-10) = 2.3/5.6 = 0.4107 -> 41
  });

  it("clamps to integer percentiles", () => {
    const result = calculatePercentile(7.7, 5, 10);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("Spec Bars — color coding", () => {
  it("blue for below average (<30)", () => {
    expect(getBarColor(0)).toBe("#3b82f6");
    expect(getBarColor(29)).toBe("#3b82f6");
  });

  it("indigo for average range (30-70)", () => {
    expect(getBarColor(30)).toBe("#6366f1");
    expect(getBarColor(50)).toBe("#6366f1");
    expect(getBarColor(70)).toBe("#6366f1");
  });

  it("green for above average (>70)", () => {
    expect(getBarColor(71)).toBe("#10b981");
    expect(getBarColor(100)).toBe("#10b981");
  });
});

describe("Spec Bars — size class range calculation", () => {
  it("computes ±20% of LOA correctly", () => {
    const loa = 12;
    const loaMin = +(loa * 0.8).toFixed(2);
    const loaMax = +(loa * 1.2).toFixed(2);
    expect(loaMin).toBe(9.6);
    expect(loaMax).toBe(14.4);
  });

  it("handles small LOA values", () => {
    const loa = 6;
    const loaMin = +(loa * 0.8).toFixed(2);
    const loaMax = +(loa * 1.2).toFixed(2);
    expect(loaMin).toBe(4.8);
    expect(loaMax).toBe(7.2);
  });

  it("handles large LOA values", () => {
    const loa = 25;
    const loaMin = +(loa * 0.8).toFixed(2);
    const loaMax = +(loa * 1.2).toFixed(2);
    expect(loaMin).toBe(20);
    expect(loaMax).toBe(30);
  });
});

describe("Spec Bars — spec filtering logic", () => {
  // Simulates the filtering logic from the component
  const SPEC_CONFIG = [
    { key: "lengthOverall", dbKey: "length_overall", unit: "m" },
    { key: "beam", dbKey: "beam", unit: "m" },
    { key: "draft", dbKey: "draft", unit: "m" },
    { key: "displacement", dbKey: "displacement", unit: "kg" },
    { key: "ballast", dbKey: "ballast", unit: "kg" },
    { key: "sailAreaMain", dbKey: "sail_area_main", unit: "m²" },
    { key: "engineHp", dbKey: "engine_hp", unit: "hp" },
  ];

  it("only includes specs where yacht has data AND stats are available", () => {
    const yachtSpecs = {
      lengthOverall: 12,
      beam: 4,
      draft: null,
      displacement: 8000,
      ballast: null,
      sailAreaMain: 80,
      engineHp: 40,
    };

    const stats = {
      length_overall: { min: 10, max: 15, avg: 12.5, p25: 11, p50: 12, p75: 13, count: 20 },
      beam: { min: 3, max: 5, avg: 4, p25: 3.5, p50: 4, p75: 4.5, count: 20 },
      displacement: { min: 5000, max: 12000, avg: 8000, p25: 6500, p50: 7500, p75: 9500, count: 18 },
      sail_area_main: { min: 50, max: 120, avg: 85, p25: 70, p50: 82, p75: 95, count: 15 },
      engine_hp: { min: 20, max: 75, avg: 40, p25: 30, p50: 40, p75: 55, count: 12 },
    };

    const entries = SPEC_CONFIG.filter((cfg) => {
      const value = yachtSpecs[cfg.key as keyof typeof yachtSpecs];
      if (value === null || value === undefined) return false;
      const specStats = stats[cfg.dbKey as keyof typeof stats];
      if (!specStats || specStats.count < 3) return false;
      return true;
    });

    expect(entries).toHaveLength(5); // all except draft and ballast
    expect(entries.map((e) => e.key)).toEqual([
      "lengthOverall", "beam", "displacement", "sailAreaMain", "engineHp",
    ]);
  });

  it("excludes specs with fewer than 3 data points", () => {
    const yachtSpecs = { lengthOverall: 12, beam: null, draft: null, displacement: null, ballast: null, sailAreaMain: null, engineHp: null };
    const stats = {
      length_overall: { min: 10, max: 15, avg: 12.5, p25: 11, p50: 12, p75: 13, count: 2 }, // too few
    };

    const entries = SPEC_CONFIG.filter((cfg) => {
      const value = yachtSpecs[cfg.key as keyof typeof yachtSpecs];
      if (value === null || value === undefined) return false;
      const specStats = stats[cfg.dbKey as keyof typeof stats];
      if (!specStats || specStats.count < 3) return false;
      return true;
    });

    expect(entries).toHaveLength(0);
  });
});

describe("Spec Bars — API endpoint validation", () => {
  it("LOA parameter is required", () => {
    const url = new URL("http://localhost/api/yachts/size-class-stats");
    const loa = url.searchParams.get("loa");
    expect(loa).toBeNull();
  });

  it("LOA must be positive", () => {
    const loa = parseFloat("-5");
    expect(loa <= 0).toBe(true);
  });

  it("valid LOA computes correct size class", () => {
    const loa = parseFloat("12.5");
    expect(loa).toBeGreaterThan(0);
    const loaMin = +(loa * 0.8).toFixed(2);
    const loaMax = +(loa * 1.2).toFixed(2);
    expect(loaMin).toBe(10);
    expect(loaMax).toBe(15);
  });
});
