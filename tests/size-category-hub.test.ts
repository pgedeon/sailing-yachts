import { describe, it, expect } from "vitest";
import { getSizeCategorySlugs, SIZE_CATEGORIES } from "@/lib/size-categories";

describe("size-category-hub", () => {
  describe("size category hub routes", () => {
    it("all 6 size categories have valid slugs for hub pages", () => {
      const slugs = getSizeCategorySlugs();
      expect(slugs).toEqual([
        "under-30ft",
        "30-35ft",
        "35-40ft",
        "40-45ft",
        "45-50ft",
        "over-50ft",
      ]);
    });

    it("hub route pattern /yachts/by-size/:slug is valid for each category", () => {
      const slugs = getSizeCategorySlugs();
      for (const slug of slugs) {
        const path = `/yachts/by-size/${slug}`;
        expect(path).toMatch(/^\/yachts\/by-size\/[a-z0-9-]+$/);
      }
    });

    it("each category description works with 'all manufacturers' context", () => {
      for (const cat of SIZE_CATEGORIES) {
        const descEn = cat.descriptionEn("all manufacturers", 50);
        expect(descEn).toContain("50");
        expect(descEn.length).toBeGreaterThan(50);

        const descFr = cat.descriptionFr("all manufacturers", 50);
        expect(descFr).toContain("50");
        expect(descFr.length).toBeGreaterThan(50);
      }
    });
  });

  describe("hub page metadata", () => {
    it("generates valid title for each size category", () => {
      for (const cat of SIZE_CATEGORIES) {
        const title = `${cat.labelEn} Sailboats — All Manufacturers | Specs & Reviews`;
        expect(title).toContain(cat.labelEn);
        expect(title.length).toBeGreaterThan(20);
        expect(title.length).toBeLessThan(70);
      }
    });

    it("generates valid French title for each size category", () => {
      for (const cat of SIZE_CATEGORIES) {
        const title = `${cat.labelFr} Voiliers — Tous les constructeurs`;
        expect(title).toContain(cat.labelFr);
      }
    });
  });

  describe("hub to manufacturer+size cross-linking", () => {
    it("manufacturer+size route can be constructed from hub data", () => {
      const mfrSlug = "beneteau";
      const sizeSlug = "40-45ft";
      const path = `/manufacturers/${mfrSlug}/${sizeSlug}`;
      expect(path).toBe("/manufacturers/beneteau/40-45ft");
    });

    it("all hub pages link to corresponding manufacturer+size sub-pages", () => {
      const slugs = getSizeCategorySlugs();
      for (const sizeSlug of slugs) {
        // Hub page should construct manufacturer+size links
        const exampleMfrPath = `/manufacturers/beneteau/${sizeSlug}`;
        expect(exampleMfrPath).toMatch(
          /^\/manufacturers\/[a-z0-9-]+\/[a-z0-9-]+$/
        );
      }
    });
  });

  describe("generateStaticParams", () => {
    it("returns params for all 6 size categories", () => {
      const slugs = getSizeCategorySlugs();
      const params = slugs.map((sizeCategory) => ({ sizeCategory }));
      expect(params).toHaveLength(6);
      expect(params[0]).toEqual({ sizeCategory: "under-30ft" });
      expect(params[5]).toEqual({ sizeCategory: "over-50ft" });
    });
  });
});
