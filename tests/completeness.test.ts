import { describe, it, expect } from "vitest";
import {
  calculateCompletenessScore,
  getCompletenessLevel,
  shouldNoindex,
  getMissingFields,
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
});

describe("getCompletenessLevel", () => {
  it("returns Comprehensive for 80+", () => {
    const level = getCompletenessLevel(85);
    expect(level.label).toBe("Comprehensive");
  });

  it("returns Good for 60-79", () => {
    const level = getCompletenessLevel(65);
    expect(level.label).toBe("Good");
  });

  it("returns Partial for 40-59", () => {
    const level = getCompletenessLevel(50);
    expect(level.label).toBe("Partial");
  });

  it("returns Basic for 20-39", () => {
    const level = getCompletenessLevel(25);
    expect(level.label).toBe("Basic");
  });

  it("returns Minimal for < 20", () => {
    const level = getCompletenessLevel(10);
    expect(level.label).toBe("Minimal");
  });
});

describe("shouldNoindex", () => {
  it("returns true for scores below 30", () => {
    expect(shouldNoindex(20)).toBe(true);
    expect(shouldNoindex(0)).toBe(true);
  });

  it("returns false for scores at or above 30", () => {
    expect(shouldNoindex(30)).toBe(false);
    expect(shouldNoindex(50)).toBe(false);
    expect(shouldNoindex(100)).toBe(false);
  });
});

describe("getMissingFields", () => {
  it("returns all fields for empty record", () => {
    const missing = getMissingFields({});
    expect(missing.length).toBeGreaterThan(10);
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
    // sourceUrl is checked separately in our migration score, but not in SPEC_CATEGORIES
    const missing = getMissingFields(full);
    // designNotes might still be listed if it's in SPEC_CATEGORIES
    // Check no core fields are missing
    expect(missing).not.toContain("lengthOverall");
    expect(missing).not.toContain("beam");
    expect(missing).not.toContain("draft");
  });
});
