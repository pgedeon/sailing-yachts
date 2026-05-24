/**
 * Tests for P20.1 — Compare page structured data (Product comparison schema)
 */
import { describe, it, expect } from "vitest";
import {
  generateComparePageJsonLd,
  generateYachtJsonLd,
} from "@/lib/seo";

describe("generateComparePageJsonLd", () => {
  const yachtA = {
    manufacturer: "Beneteau",
    modelName: "Oceanis 40.1",
    year: 2020,
    slug: "beneteau-oceanis-40-1",
    lengthOverall: 12.43,
    beam: 4.18,
    draft: 2.45,
    displacement: 8800,
    hullMaterial: "GRP",
    rigType: "Sloop",
    cabins: 3,
  };

  const yachtB = {
    manufacturer: "Jeanneau",
    modelName: "Sun Odyssey 410",
    year: 2019,
    slug: "jeanneau-sun-odyssey-410",
    lengthOverall: 12.35,
    beam: 3.99,
    draft: 2.24,
    displacement: 8300,
    hullMaterial: "GRP",
    rigType: "Sloop",
    cabins: 3,
  };

  it("generates a WebPage with ItemList mainEntity", () => {
    const result = generateComparePageJsonLd({
      yachtA,
      yachtB,
      slugA: yachtA.slug,
      slugB: yachtB.slug,
    });

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("WebPage");
    expect(result.name).toContain("Beneteau Oceanis 40.1");
    expect(result.name).toContain("Jeanneau Sun Odyssey 410");
    expect(result.url).toContain("/compare/beneteau-oceanis-40-1-vs-jeanneau-sun-odyssey-410");
    expect(result.mainEntity["@type"]).toBe("ItemList");
    expect(result.mainEntity.numberOfItems).toBe(2);
  });

  it("includes both yachts as ListItem entries with full Product items", () => {
    const result = generateComparePageJsonLd({
      yachtA,
      yachtB,
      slugA: yachtA.slug,
      slugB: yachtB.slug,
    });

    const items = result.mainEntity.itemListElement;
    expect(items).toHaveLength(2);

    // Item A
    expect(items[0].position).toBe(1);
    expect(items[0].name).toBe("Beneteau Oceanis 40.1");
    expect(items[0].url).toContain("/yachts/beneteau-oceanis-40-1");
    expect(items[0].item["@type"]).toBe("Product");
    expect(items[0].item.name).toContain("Beneteau Oceanis 40.1");

    // Item B
    expect(items[1].position).toBe(2);
    expect(items[1].name).toBe("Jeanneau Sun Odyssey 410");
    expect(items[1].url).toContain("/yachts/jeanneau-sun-odyssey-410");
    expect(items[1].item["@type"]).toBe("Product");
    expect(items[1].item.name).toContain("Jeanneau Sun Odyssey 410");
  });

  it("includes Product specs as additionalProperty on each item", () => {
    const result = generateComparePageJsonLd({
      yachtA,
      yachtB,
      slugA: yachtA.slug,
      slugB: yachtB.slug,
    });

    const productA = result.mainEntity.itemListElement[0].item;
    expect(productA.additionalProperty).toBeDefined();
    expect(productA.additionalProperty!.length).toBeGreaterThan(0);

    // Check LOA is present
    const loaProp = productA.additionalProperty!.find(
      (p) => p.name === "Length Overall"
    );
    expect(loaProp).toBeDefined();
    expect(loaProp!.value).toBe(12.43);
    expect(loaProp!.unitCode).toBe("MTR");
  });

  it("includes about section referencing both products", () => {
    const result = generateComparePageJsonLd({
      yachtA,
      yachtB,
      slugA: yachtA.slug,
      slugB: yachtB.slug,
    });

    expect(result.about).toHaveLength(2);
    expect(result.about![0].name).toBe("Beneteau Oceanis 40.1");
    expect(result.about![1].name).toBe("Jeanneau Sun Odyssey 410");
  });

  it("uses English description by default", () => {
    const result = generateComparePageJsonLd({
      yachtA,
      yachtB,
      slugA: yachtA.slug,
      slugB: yachtB.slug,
    });

    expect(result.description).toContain("Side-by-side comparison");
    expect(result.description).toContain("Beneteau Oceanis 40.1");
    expect(result.description).toContain("Jeanneau Sun Odyssey 410");
  });

  it("uses French description when locale is fr", () => {
    const result = generateComparePageJsonLd({
      yachtA,
      yachtB,
      slugA: yachtA.slug,
      slugB: yachtB.slug,
      locale: "fr",
    });

    expect(result.description).toContain("Comparaison côte à côte");
    expect(result.url).toContain("/fr/compare/");
  });

  it("localizes Product additionalProperty names for French", () => {
    const result = generateComparePageJsonLd({
      yachtA,
      yachtB,
      slugA: yachtA.slug,
      slugB: yachtB.slug,
      locale: "fr",
    });

    const productA = result.mainEntity.itemListElement[0].item;
    const loaProp = productA.additionalProperty!.find(
      (p) => p.name === "Longueur hors tout"
    );
    expect(loaProp).toBeDefined();
  });

  it("generates valid JSON that can be serialized", () => {
    const result = generateComparePageJsonLd({
      yachtA,
      yachtB,
      slugA: yachtA.slug,
      slugB: yachtB.slug,
    });

    const serialized = JSON.stringify(result);
    expect(serialized).toBeTruthy();

    // Verify it can be parsed back
    const parsed = JSON.parse(serialized);
    expect(parsed["@type"]).toBe("WebPage");
    expect(parsed.mainEntity.itemListElement).toHaveLength(2);
  });

  it("handles yachts with minimal data", () => {
    const minimalA = {
      manufacturer: "Test",
      modelName: "Boat A",
      year: 2024,
      slug: "test-boat-a",
    };
    const minimalB = {
      manufacturer: "Test",
      modelName: "Boat B",
      year: 2024,
      slug: "test-boat-b",
    };

    const result = generateComparePageJsonLd({
      yachtA: minimalA,
      yachtB: minimalB,
      slugA: minimalA.slug,
      slugB: minimalB.slug,
    });

    expect(result.mainEntity.numberOfItems).toBe(2);
    expect(result.mainEntity.itemListElement[0].item.name).toContain("Test Boat A");
  });

  it("sets correct brand on each product", () => {
    const result = generateComparePageJsonLd({
      yachtA,
      yachtB,
      slugA: yachtA.slug,
      slugB: yachtB.slug,
    });

    const productA = result.mainEntity.itemListElement[0].item;
    expect(productA.brand).toBeDefined();
    expect(productA.brand!.name).toBe("Beneteau");

    const productB = result.mainEntity.itemListElement[1].item;
    expect(productB.brand).toBeDefined();
    expect(productB.brand!.name).toBe("Jeanneau");
  });
});
