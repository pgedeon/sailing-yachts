import { describe, it, expect } from "vitest";
import {
  parseYear,
  EDITORIAL_YEARS,
  EDITORIAL_CONTENT,
  getBestYearSizeStaticParams,
} from "@/lib/best-year-size-landing";
import { getSizeCategorySlugs } from "@/lib/size-categories";

describe("parseYear", () => {
  it("parses valid editorial years", () => {
    expect(parseYear("2024")).toBe(2024);
    expect(parseYear("2025")).toBe(2025);
    expect(parseYear("2026")).toBe(2026);
  });

  it("returns null for invalid years", () => {
    expect(parseYear("2020")).toBeNull();
    expect(parseYear("abc")).toBeNull();
    expect(parseYear("")).toBeNull();
    expect(parseYear("2027")).toBeNull();
  });
});

describe("EDITORIAL_YEARS", () => {
  it("contains expected years", () => {
    expect(EDITORIAL_YEARS).toEqual([2024, 2025, 2026]);
  });
});

describe("EDITORIAL_CONTENT", () => {
  const sizeCategorySlugs = getSizeCategorySlugs();

  it("has content for every size category", () => {
    for (const slug of sizeCategorySlugs) {
      expect(EDITORIAL_CONTENT[slug]).toBeDefined();
      expect(EDITORIAL_CONTENT[slug].titleEn).toBeInstanceOf(Function);
      expect(EDITORIAL_CONTENT[slug].titleFr).toBeInstanceOf(Function);
      expect(EDITORIAL_CONTENT[slug].introEn).toBeInstanceOf(Function);
      expect(EDITORIAL_CONTENT[slug].introFr).toBeInstanceOf(Function);
      expect(EDITORIAL_CONTENT[slug].conclusionEn).toBeTruthy();
      expect(EDITORIAL_CONTENT[slug].conclusionFr).toBeTruthy();
    }
  });

  it("generates English titles correctly", () => {
    expect(EDITORIAL_CONTENT["40-45ft"].titleEn(2026, "40–45ft")).toBe(
      "Best 40–45ft Sailboats of 2026"
    );
  });

  it("generates French titles correctly", () => {
    expect(EDITORIAL_CONTENT["40-45ft"].titleFr(2026, "40–45 pieds")).toBe(
      "Meilleurs voiliers 40–45 pieds de 2026"
    );
  });

  it("generates English intros with year and count", () => {
    const intro = EDITORIAL_CONTENT["under-30ft"].introEn(2026, 15);
    expect(intro).toContain("2026");
    expect(intro).toContain("15");
  });

  it("generates French intros with year and count", () => {
    const intro = EDITORIAL_CONTENT["under-30ft"].introFr(2026, 15);
    expect(intro).toContain("2026");
    expect(intro).toContain("15");
  });

  it("conclusions are non-empty strings", () => {
    for (const slug of sizeCategorySlugs) {
      expect(typeof EDITORIAL_CONTENT[slug].conclusionEn).toBe("string");
      expect(typeof EDITORIAL_CONTENT[slug].conclusionFr).toBe("string");
      expect(EDITORIAL_CONTENT[slug].conclusionEn.length).toBeGreaterThan(50);
      expect(EDITORIAL_CONTENT[slug].conclusionFr.length).toBeGreaterThan(20);
    }
  });
});

describe("getBestYearSizeStaticParams", () => {
  it("generates params for all year+size combinations", () => {
    const params = getBestYearSizeStaticParams();
    const expectedCount = EDITORIAL_YEARS.length * getSizeCategorySlugs().length;
    expect(params).toHaveLength(expectedCount);
  });

  it("includes string year values", () => {
    const params = getBestYearSizeStaticParams();
    const years = [...new Set(params.map((p) => p.year))];
    expect(years.sort()).toEqual(["2024", "2025", "2026"]);
  });

  it("includes all size category slugs", () => {
    const params = getBestYearSizeStaticParams();
    const slugs = [...new Set(params.map((p) => p.sizeCategory))];
    expect(slugs.sort()).toEqual(getSizeCategorySlugs().sort());
  });

  it("every param has year and sizeCategory", () => {
    const params = getBestYearSizeStaticParams();
    for (const p of params) {
      expect(p.year).toBeTruthy();
      expect(p.sizeCategory).toBeTruthy();
    }
  });
});
