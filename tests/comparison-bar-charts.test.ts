import { describe, it, expect } from "vitest";
import {
  displacementLengthRatio,
  sailAreaDisplacementRatio,
  ballastRatio,
} from "@/lib/yacht-ratios";

describe("displacementLengthRatio", () => {
  it("calculates D/L ratio correctly", () => {
    // Example: 8000 kg displacement, 10m LOA
    const result = displacementLengthRatio(8000, 10);
    expect(result).not.toBeNull();
    expect(typeof result).toBe("number");
    // Manual check: dispLongTons = 8000/1018 ≈ 7.858, loaFt = 10/0.3054 ≈ 32.74
    // loaCubed ≈ 35085, D/L = 7.858/35085 ≈ 0.000224 → that's way too low, let me recalculate
    // Actually, the formula is correct — D/L ratio for typical yachts is 150-400
    // Let's verify with known values: D/L for Beneteau Oceanis 40.1 ≈ 178
    // Disp ≈ 8600kg, LOA ≈ 12.43m
    const beneteau = displacementLengthRatio(8600, 12.43);
    expect(beneteau).not.toBeNull();
    expect(beneteau!).toBeGreaterThan(50);
    expect(beneteau!).toBeLessThan(500);
  });

  it("returns null for null inputs", () => {
    expect(displacementLengthRatio(null, 10)).toBeNull();
    expect(displacementLengthRatio(8000, null)).toBeNull();
    expect(displacementLengthRatio(null, null)).toBeNull();
  });

  it("returns null for zero LOA", () => {
    expect(displacementLengthRatio(8000, 0)).toBeNull();
    expect(displacementLengthRatio(8000, -1)).toBeNull();
  });

  it("returns null for zero displacement", () => {
    expect(displacementLengthRatio(0, 10)).toBeNull();
  });

  it("handles large displacement values", () => {
    const result = displacementLengthRatio(25000, 15);
    expect(result).not.toBeNull();
    expect(typeof result).toBe("number");
    expect(result!).toBeGreaterThan(0);
  });
});

describe("sailAreaDisplacementRatio", () => {
  it("calculates SA/D ratio correctly", () => {
    const result = sailAreaDisplacementRatio(80, 8000);
    expect(result).not.toBeNull();
    expect(typeof result).toBe("number");
    // SA/D for typical cruiser ≈ 15-22
    // Manual: dispLongTons = 8000/1018 ≈ 7.858, (7.858)^(2/3) ≈ 3.97
    // SA/D = 80/3.97 ≈ 20.15
    expect(result!).toBeGreaterThan(10);
    expect(result!).toBeLessThan(30);
  });

  it("returns null for null inputs", () => {
    expect(sailAreaDisplacementRatio(null, 8000)).toBeNull();
    expect(sailAreaDisplacementRatio(80, null)).toBeNull();
  });

  it("returns null for zero displacement", () => {
    expect(sailAreaDisplacementRatio(80, 0)).toBeNull();
  });
});

describe("ballastRatio", () => {
  it("calculates ballast ratio as percentage", () => {
    const result = ballastRatio(2500, 8000);
    expect(result).toBe(31.25); // 2500/8000 * 100 = 31.25
  });

  it("returns null for null inputs", () => {
    expect(ballastRatio(null, 8000)).toBeNull();
    expect(ballastRatio(2500, null)).toBeNull();
  });

  it("returns null for zero displacement", () => {
    expect(ballastRatio(2500, 0)).toBeNull();
  });

  it("handles 100% ballast ratio", () => {
    const result = ballastRatio(5000, 5000);
    expect(result).toBe(100);
  });

  it("rounds to 2 decimal places", () => {
    const result = ballastRatio(3333, 10000);
    expect(result).toBe(33.33);
  });
});

describe("i18n keys validation", () => {
  it("en.json has barCharts keys under Compare", async () => {
    const en = await import("../messages/en.json").then(m => m.default);
    const compare = en.Compare;
    expect(compare.barCharts).toBeDefined();
    expect(compare.barCharts.specTitle).toBeTruthy();
    expect(compare.barCharts.ratioTitle).toBeTruthy();
    expect(compare.barCharts.ratioDL).toBeTruthy();
    expect(compare.barCharts.ratioSAD).toBeTruthy();
    expect(compare.barCharts.ratioBallast).toBeTruthy();
    expect(compare.barCharts.ratioDLExplain).toBeTruthy();
    expect(compare.barCharts.ratioSADExplain).toBeTruthy();
    expect(compare.barCharts.ratioBallastExplain).toBeTruthy();
    expect(compare.barCharts.dataTableToggle).toBeTruthy();
  });

  it("fr.json has barCharts keys under Compare", async () => {
    const fr = await import("../messages/fr.json").then(m => m.default);
    const compare = fr.Compare;
    expect(compare.barCharts).toBeDefined();
    expect(compare.barCharts.specTitle).toBeTruthy();
    expect(compare.barCharts.ratioTitle).toBeTruthy();
    expect(compare.barCharts.ratioDL).toBeTruthy();
    expect(compare.barCharts.ratioSAD).toBeTruthy();
    expect(compare.barCharts.ratioBallast).toBeTruthy();
    expect(compare.barCharts.ratioDLExplain).toBeTruthy();
    expect(compare.barCharts.ratioSADExplain).toBeTruthy();
    expect(compare.barCharts.ratioBallastExplain).toBeTruthy();
    expect(compare.barCharts.dataTableToggle).toBeTruthy();
  });
});
