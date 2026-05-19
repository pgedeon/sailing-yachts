import { describe, it, expect } from "vitest";
import {
  calculateCompletenessScore,
  getCompletenessLevel,
  shouldNoindex,
  getMissingFields,
  calculateAverageScore,
  SPEC_CATEGORIES,
} from "../lib/completeness";

describe("calculateCompletenessScore", () => {
  it("returns 0 for empty record", () => {
    expect(calculateCompletenessScore({})).toBe(0);
  });

  it("returns 100 for fully populated record", () => {
    const full = {
      lengthOverall: 10.5,
      beam: 3.5,
      draft: 2.0,
      displacement: 6000,
      ballast: 2000,
      sailAreaMain: 65,
      rigType: "Sloop",
      keelType: "Fin keel",
      hullMaterial: "Fiberglass",
      cabins: 3,
      berths: 6,
      heads: 1,
      engineHp: 30,
      engineType: "Diesel",
      fuelCapacity: 120,
      waterCapacity: 160,
      description: "A fine yacht",
      designNotes: "Some notes",
      sourceUrl: "https://example.com",
    };
    expect(calculateCompletenessScore(full)).toBe(100);
  });

  it("returns high score for core dimensions only", () => {
    const partial = {
      lengthOverall: 10.5,
      beam: 3.5,
      draft: 2.0,
    };
    expect(calculateCompletenessScore(partial)).toBe(30);
  });

  it("ignores empty strings", () => {
    const withEmpty = {
      rigType: "",
      keelType: "   ",
    };
    expect(calculateCompletenessScore(withEmpty)).toBe(0);
  });

  it("returns partial score for half-filled record", () => {
    const half = {
      lengthOverall: 10.5,
      beam: 3.5,
      draft: 2.0,
      rigType: "Sloop",
      keelType: "Fin keel",
      hullMaterial: "Fiberglass",
      cabins: 3,
      engineHp: 30,
      fuelCapacity: 120,
      description: "A nice yacht",
    };
    const score = calculateCompletenessScore(half);
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThan(80);
  });

  it("returns consistent score regardless of field order", () => {
    const a = { lengthOverall: 10, beam: 3, draft: 2 };
    const b = { draft: 2, beam: 3, lengthOverall: 10 };
    expect(calculateCompletenessScore(a)).toBe(calculateCompletenessScore(b));
  });

  it("handles zero numeric values as populated", () => {
    const withZero = {
      cabins: 0,
      berths: 0,
      heads: 0,
    };
    const score = calculateCompletenessScore(withZero);
    expect(score).toBeGreaterThan(0);
  });
});

describe("getCompletenessLevel", () => {
  it("returns Comprehensive for 80+", () => {
    expect(getCompletenessLevel(85).label).toBe("Comprehensive");
    expect(getCompletenessLevel(100).label).toBe("Comprehensive");
    expect(getCompletenessLevel(80).label).toBe("Comprehensive");
  });

  it("returns Good for 60-79", () => {
    expect(getCompletenessLevel(65).label).toBe("Good");
    expect(getCompletenessLevel(60).label).toBe("Good");
    expect(getCompletenessLevel(79).label).toBe("Good");
  });

  it("returns Partial for 40-59", () => {
    expect(getCompletenessLevel(50).label).toBe("Partial");
    expect(getCompletenessLevel(40).label).toBe("Partial");
    expect(getCompletenessLevel(59).label).toBe("Partial");
  });

  it("returns Basic for 20-39", () => {
    expect(getCompletenessLevel(25).label).toBe("Basic");
    expect(getCompletenessLevel(20).label).toBe("Basic");
    expect(getCompletenessLevel(39).label).toBe("Basic");
  });

  it("returns Minimal for < 20", () => {
    expect(getCompletenessLevel(10).label).toBe("Minimal");
    expect(getCompletenessLevel(0).label).toBe("Minimal");
    expect(getCompletenessLevel(19).label).toBe("Minimal");
  });

  it("always returns all required display properties", () => {
    const level = getCompletenessLevel(50);
    expect(level).toHaveProperty("label");
    expect(level).toHaveProperty("color");
    expect(level).toHaveProperty("bgColor");
    expect(level).toHaveProperty("textColor");
  });
});

describe("shouldNoindex", () => {
  it("returns true for scores below 30", () => {
    expect(shouldNoindex(20)).toBe(true);
    expect(shouldNoindex(0)).toBe(true);
    expect(shouldNoindex(29)).toBe(true);
  });

  it("returns false for scores at or above 30", () => {
    expect(shouldNoindex(30)).toBe(false);
    expect(shouldNoindex(50)).toBe(false);
    expect(shouldNoindex(100)).toBe(false);
  });

  it("supports custom threshold", () => {
    expect(shouldNoindex(40, 50)).toBe(true);
    expect(shouldNoindex(50, 50)).toBe(false);
  });
});

describe("getMissingFields", () => {
  it("returns all fields for empty record", () => {
    const missing = getMissingFields({});
    const totalFields = Object.values(SPEC_CATEGORIES).reduce(
      (sum, cat) => sum + cat.fields.length,
      0
    );
    expect(missing.length).toBe(totalFields);
  });

  it("returns empty array for fully populated record", () => {
    const full = {
      lengthOverall: 10.5,
      beam: 3.5,
      draft: 2.0,
      displacement: 6000,
      ballast: 2000,
      sailAreaMain: 65,
      rigType: "Sloop",
      keelType: "Fin keel",
      hullMaterial: "Fiberglass",
      cabins: 3,
      berths: 6,
      heads: 1,
      engineHp: 30,
      engineType: "Diesel",
      fuelCapacity: 120,
      waterCapacity: 160,
      description: "A fine yacht",
      designNotes: "Some notes",
    };
    const missing = getMissingFields(full);
    expect(missing).toEqual([]);
  });

  it("returns only missing fields for partial record", () => {
    const partial = {
      lengthOverall: 10.5,
      beam: 3.5,
    };
    const missing = getMissingFields(partial);
    expect(missing).toContain("draft");
    expect(missing).toContain("displacement");
    expect(missing).not.toContain("lengthOverall");
    expect(missing).not.toContain("beam");
  });

  it("treats empty strings as missing", () => {
    const withEmpty = {
      rigType: "",
      keelType: "  ",
    };
    const missing = getMissingFields(withEmpty);
    expect(missing).toContain("rigType");
    expect(missing).toContain("keelType");
  });
});

describe("calculateAverageScore", () => {
  it("returns 0 for empty array", () => {
    expect(calculateAverageScore([])).toBe(0);
  });

  it("returns score of single yacht", () => {
    const yachts = [{ lengthOverall: 10.5, beam: 3.5, draft: 2.0 }];
    expect(calculateAverageScore(yachts)).toBe(30);
  });

  it("averages multiple yachts", () => {
    const yachts = [
      { lengthOverall: 10.5, beam: 3.5, draft: 2.0 }, // 30
      { lengthOverall: 10.5, beam: 3.5, draft: 2.0, displacement: 6000 }, // 30 + 4 = 34
    ];
    const avg = calculateAverageScore(yachts);
    expect(avg).toBe(32); // (30 + 34) / 2 = 32
  });
});

describe("SPEC_CATEGORIES", () => {
  it("has weights summing to 100", () => {
    const totalWeight = Object.values(SPEC_CATEGORIES).reduce(
      (sum, cat) => sum + cat.weight,
      0
    );
    expect(totalWeight).toBe(100);
  });

  it("has unique field names across categories", () => {
    const allFields: string[] = [];
    for (const cat of Object.values(SPEC_CATEGORIES)) {
      allFields.push(...cat.fields);
    }
    const uniqueFields = new Set(allFields);
    expect(uniqueFields.size).toBe(allFields.length);
  });
});
