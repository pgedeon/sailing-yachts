import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("@/lib/db-edge", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    having: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve([]);
    }),
  },
  manufacturers: {
    id: "id",
    name: "name",
    country: "country",
    foundedYear: "founded_year",
    description: "description",
    descriptionFr: "description_fr",
    logoUrl: "logo_url",
    websiteUrl: "website_url",
  },
  yachtModels: {
    id: "id",
    manufacturerId: "manufacturer_id",
    modelName: "model_name",
    year: "year",
    slug: "slug",
    lengthOverall: "length_overall",
    beam: "beam",
    draft: "draft",
    displacement: "displacement",
    rigType: "rig_type",
    keelType: "keel_type",
    hullMaterial: "hull_material",
    cabins: "cabins",
    berths: "berths",
  },
}));

// Mock drizzle-orm operators
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_, val) => val),
  count: vi.fn(() => "count"),
  avg: vi.fn(() => "avg"),
  min: vi.fn(() => "min"),
  max: vi.fn(() => "max"),
  isNotNull: vi.fn((col) => col),
  and: vi.fn((...args) => args),
  sql: vi.fn((strings, ...values) => strings.join("?")),
}));

import {
  generateManufacturerFaqs,
  generateSizeCategoryFaqs,
  type ManufacturerStats,
  type SizeCategoryStats,
} from "@/lib/faq-generation";
import { SIZE_CATEGORIES } from "@/lib/size-categories";

describe("FAQ Generation", () => {
  describe("generateManufacturerFaqs", () => {
    it("generates FAQs from manufacturer stats", () => {
      const stats: ManufacturerStats = {
        name: "Beneteau",
        slug: "beneteau",
        yachtCount: 17,
        minLoa: 7.5,
        maxLoa: 16.0,
        avgLoa: 11.2,
        avgCabins: 3,
        avgBerths: 6,
        rigTypes: { Sloop: 15, Cutter: 2 },
        keelTypes: { "Fin keel with bulb": 10, "Fin keel": 7 },
        hullMaterials: { Fiberglass: 17 },
        years: { min: 2005, max: 2024 },
      };

      const result = generateManufacturerFaqs(stats);

      expect(result.title).toContain("Beneteau");
      expect(result.titleFr).toContain("Beneteau");
      expect(result.faqs.length).toBeGreaterThanOrEqual(5);
      expect(result.jsonLd).toBeDefined();
      expect((result.jsonLd as any)["@type"]).toBe("FAQPage");
      expect((result.jsonLd as any).mainEntity.length).toBe(result.faqs.length);
    });

    it("includes bilingual Q&A", () => {
      const stats: ManufacturerStats = {
        name: "Jeanneau",
        slug: "jeanneau",
        yachtCount: 15,
        minLoa: 8.0,
        maxLoa: 15.0,
        avgLoa: 10.5,
        avgCabins: 3,
        avgBerths: 6,
        rigTypes: { Sloop: 15 },
        keelTypes: { "Fin keel": 15 },
        hullMaterials: { Fiberglass: 15 },
        years: { min: 2000, max: 2024 },
      };

      const result = generateManufacturerFaqs(stats);

      for (const faq of result.faqs) {
        expect(faq.question).toBeTruthy();
        expect(faq.answer).toBeTruthy();
        expect(faq.questionFr).toBeTruthy();
        expect(faq.answerFr).toBeTruthy();
      }
    });

    it("handles manufacturer with minimal data", () => {
      const stats: ManufacturerStats = {
        name: "Test Yachts",
        slug: "test-yachts",
        yachtCount: 3,
        minLoa: null,
        maxLoa: null,
        avgLoa: null,
        avgCabins: null,
        avgBerths: null,
        rigTypes: {},
        keelTypes: {},
        hullMaterials: {},
        years: { min: null, max: null },
      };

      const result = generateManufacturerFaqs(stats);

      // Should still generate basic FAQs
      expect(result.faqs.length).toBeGreaterThanOrEqual(1);
      expect(result.faqs[0].question).toContain("Test Yachts");
    });

    it("generates valid JSON-LD schema", () => {
      const stats: ManufacturerStats = {
        name: "Bavaria Yachts",
        slug: "bavaria-yachts",
        yachtCount: 13,
        minLoa: 9.0,
        maxLoa: 14.0,
        avgLoa: 11.0,
        avgCabins: 3,
        avgBerths: 6,
        rigTypes: { Sloop: 13 },
        keelTypes: { "L-shaped keel (with bulb)": 13 },
        hullMaterials: { Fiberglass: 13 },
        years: { min: 2010, max: 2024 },
      };

      const result = generateManufacturerFaqs(stats);
      const jsonLd = result.jsonLd as any;

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("FAQPage");
      expect(Array.isArray(jsonLd.mainEntity)).toBe(true);
      for (const entity of jsonLd.mainEntity) {
        expect(entity["@type"]).toBe("Question");
        expect(entity.name).toBeTruthy();
        expect(entity.acceptedAnswer["@type"]).toBe("Answer");
        expect(entity.acceptedAnswer.text).toBeTruthy();
      }
    });
  });

  describe("generateSizeCategoryFaqs", () => {
    it("generates FAQs from size category stats", () => {
      const cat = SIZE_CATEGORIES.find((c) => c.slug === "35-40ft")!;
      const stats: SizeCategoryStats = {
        category: cat,
        yachtCount: 50,
        manufacturers: [
          { name: "Beneteau", count: 10 },
          { name: "Jeanneau", count: 8 },
          { name: "Bavaria Yachts", count: 6 },
        ],
        avgCabins: 3,
        avgBerths: 6,
        rigTypes: { Sloop: 45, Cutter: 5 },
        keelTypes: { "Fin keel with bulb": 30, "Fin keel": 20 },
      };

      const result = generateSizeCategoryFaqs(stats);

      expect(result.title).toContain("35–40ft");
      expect(result.titleFr).toContain("35–40");
      expect(result.faqs.length).toBeGreaterThanOrEqual(5);
      expect(result.jsonLd).toBeDefined();
    });

    it("generates usage-appropriate advice based on size", () => {
      const smallCat = SIZE_CATEGORIES.find((c) => c.slug === "under-30ft")!;
      const smallStats: SizeCategoryStats = {
        category: smallCat,
        yachtCount: 20,
        manufacturers: [{ name: "Test", count: 5 }],
        avgCabins: 1,
        avgBerths: 3,
        rigTypes: { Sloop: 20 },
        keelTypes: { "Fin keel": 20 },
      };

      const smallResult = generateSizeCategoryFaqs(smallStats);
      const usageFaq = smallResult.faqs.find((f) =>
        f.question.toLowerCase().includes("best suited")
      );
      expect(usageFaq).toBeDefined();
      expect(usageFaq!.answer.toLowerCase()).toContain("day sailing");
    });
  });
});
