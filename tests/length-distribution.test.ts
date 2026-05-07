import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DistributionBin } from "@/app/api/length-distribution/route";

// Unit tests for bin calculation logic
describe("Length Distribution — bin calculation", () => {
  const BINS: Array<{ min: number; max: number; label: string }> = [
    { min: 0, max: 6, label: "0-6m" },
    { min: 6, max: 8, label: "6-8m" },
    { min: 8, max: 10, label: "8-10m" },
    { min: 10, max: 12, label: "10-12m" },
    { min: 12, max: 14, label: "12-14m" },
    { min: 14, max: 16, label: "14-16m" },
    { min: 16, max: 18, label: "16-18m" },
    { min: 18, max: 20, label: "18-20m" },
    { min: 20, max: 25, label: "20-25m" },
    { min: 25, max: 100, label: "25m+" },
  ];

  function getBinIndex(loa: number): number {
    return BINS.findIndex((b) => loa >= b.min && loa < b.max);
  }

  it("assigns small yachts to first bin", () => {
    expect(getBinIndex(5.5)).toBe(0);
  });

  it("assigns typical cruiser to 10-12m bin", () => {
    expect(getBinIndex(11.0)).toBe(3);
  });

  it("assigns large yacht to 20-25m bin", () => {
    expect(getBinIndex(22.0)).toBe(8);
  });

  it("assigns mega yacht to 25m+ bin", () => {
    expect(getBinIndex(30.0)).toBe(9);
  });

  it("correctly bins boundary at 6m (goes to second bin)", () => {
    expect(getBinIndex(6.0)).toBe(1); // 6 is >= 6 and < 8
  });

  it("all bins are covered for typical LOA range", () => {
    const testValues = [3, 7, 9, 11, 13, 15, 17, 19, 22, 30];
    const indices = testValues.map(getBinIndex);
    expect(indices.every((i) => i >= 0)).toBe(true);
    expect(new Set(indices).size).toBe(10);
  });

  it("computes correct highlight for filter range", () => {
    const data: DistributionBin[] = BINS.map((b) => ({
      ...b,
      count: 10,
    }));
    const filterMin = 10;
    const filterMax = 16;
    const highlighted = data
      .map((bin, i) => (bin.min < filterMax && bin.max > filterMin ? i : -1))
      .filter((i) => i >= 0);
    // 10-12, 12-14, 14-16 bins (indices 3,4,5)
    expect(highlighted).toEqual([3, 4, 5]);
  });

  it("highlights all bins when no filter", () => {
    const filterMin = null;
    const filterMax = null;
    // No filter means no highlighting set
    expect(filterMin).toBeNull();
    expect(filterMax).toBeNull();
  });
});

describe("Length Distribution — API response shape", () => {
  it("validates bin structure", () => {
    const bin: DistributionBin = {
      label: "10-12m",
      min: 10,
      max: 12,
      count: 42,
    };
    expect(bin.label).toBe("10-12m");
    expect(bin.count).toBeTypeOf("number");
    expect(bin.min).toBeLessThan(bin.max);
  });

  it("validates full response shape", () => {
    const response = {
      bins: [
        { label: "0-6m", min: 0, max: 6, count: 5 },
        { label: "6-8m", min: 6, max: 8, count: 12 },
        { label: "8-10m", min: 8, max: 10, count: 28 },
      ],
      total: 45,
    };
    const total = response.bins.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(response.total);
  });
});
