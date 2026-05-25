import { describe, it, expect } from "vitest";
import {
  SIZE_CATEGORIES,
  getSizeCategory,
  getSizeCategorySlugs,
  getSizeCategoryForLoa,
} from "@/lib/size-categories";

describe("size-categories", () => {
  describe("SIZE_CATEGORIES", () => {
    it("has 6 categories", () => {
      expect(SIZE_CATEGORIES).toHaveLength(6);
    });

    it("categories have contiguous ranges (no gaps)", () => {
      for (let i = 1; i < SIZE_CATEGORIES.length; i++) {
        expect(SIZE_CATEGORIES[i].loaMin).toBe(SIZE_CATEGORIES[i - 1].loaMax);
      }
    });

    it("each category has required fields", () => {
      for (const cat of SIZE_CATEGORIES) {
        expect(cat.slug).toBeTruthy();
        expect(cat.labelEn).toBeTruthy();
        expect(cat.labelFr).toBeTruthy();
        expect(cat.loaMin).toBeGreaterThanOrEqual(0);
        expect(cat.loaMax).toBeGreaterThan(cat.loaMin);
        expect(typeof cat.descriptionEn).toBe("function");
        expect(typeof cat.descriptionFr).toBe("function");
      }
    });

    it("slugs are unique", () => {
      const slugs = SIZE_CATEGORIES.map((c) => c.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });
  });

  describe("getSizeCategory", () => {
    it("returns category by slug", () => {
      expect(getSizeCategory("40-45ft")).toBeDefined();
      expect(getSizeCategory("40-45ft")!.labelEn).toBe("40–45ft");
    });

    it("returns undefined for unknown slug", () => {
      expect(getSizeCategory("nonexistent")).toBeUndefined();
    });
  });

  describe("getSizeCategorySlugs", () => {
    it("returns all slugs", () => {
      const slugs = getSizeCategorySlugs();
      expect(slugs).toHaveLength(6);
      expect(slugs).toContain("under-30ft");
      expect(slugs).toContain("over-50ft");
    });
  });

  describe("getSizeCategoryForLoa", () => {
    it("categorizes 8m as under-30ft", () => {
      const cat = getSizeCategoryForLoa(8);
      expect(cat?.slug).toBe("under-30ft");
    });

    it("categorizes 9.5m as 30-35ft", () => {
      const cat = getSizeCategoryForLoa(9.5);
      expect(cat?.slug).toBe("30-35ft");
    });

    it("categorizes 11m as 35-40ft", () => {
      const cat = getSizeCategoryForLoa(11);
      expect(cat?.slug).toBe("35-40ft");
    });

    it("categorizes 12.5m as 40-45ft", () => {
      const cat = getSizeCategoryForLoa(12.5);
      expect(cat?.slug).toBe("40-45ft");
    });

    it("categorizes 14m as 45-50ft", () => {
      const cat = getSizeCategoryForLoa(14);
      expect(cat?.slug).toBe("45-50ft");
    });

    it("categorizes 16m as over-50ft", () => {
      const cat = getSizeCategoryForLoa(16);
      expect(cat?.slug).toBe("over-50ft");
    });

    it("exact boundary: 9.14m is 30-35ft", () => {
      const cat = getSizeCategoryForLoa(9.14);
      expect(cat?.slug).toBe("30-35ft");
    });

    it("exact boundary: 12.19m is 40-45ft", () => {
      const cat = getSizeCategoryForLoa(12.19);
      expect(cat?.slug).toBe("40-45ft");
    });

    it("returns undefined for negative LOA", () => {
      expect(getSizeCategoryForLoa(-1)).toBeUndefined();
    });
  });

  describe("description generators", () => {
    it("generates English description with manufacturer and count", () => {
      const cat = getSizeCategory("40-45ft")!;
      const desc = cat.descriptionEn("Beneteau", 5);
      expect(desc).toContain("Beneteau");
      expect(desc).toContain("5");
      expect(desc).toContain("40");
      expect(desc).toContain("45");
    });

    it("generates French description", () => {
      const cat = getSizeCategory("35-40ft")!;
      const desc = cat.descriptionFr("Jeanneau", 3);
      expect(desc).toContain("Jeanneau");
      expect(desc).toContain("3");
    });
  });
});
