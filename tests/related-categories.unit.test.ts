import { describe, it, expect } from "vitest";
import { getSizeCategoryForLoa } from "@/lib/size-categories";
import { assignUseCaseTags } from "@/lib/use-case-tags";
import { USE_CASES } from "@/lib/use-case-meta";

describe("RelatedCategories logic", () => {
  it("should find size category for a 12m yacht (40ft range)", () => {
    const sc = getSizeCategoryForLoa(12);
    expect(sc).toBeDefined();
    expect(sc?.slug).toBe("35-40ft");
  });

  it("should find size category for a 14m yacht (45-50ft range)", () => {
    const sc = getSizeCategoryForLoa(14);
    expect(sc).toBeDefined();
    expect(sc?.slug).toBe("45-50ft");
  });

  it("should assign bluewater-cruiser tag for heavy 42ft yacht", () => {
    const tags = assignUseCaseTags({
      lengthOverall: 13, // ~42ft
      displacement: 12000,
      ballast: 4000,
      sailAreaMain: 80,
      beam: 4.2,
      draft: 2.1,
      cabins: 3,
      berths: 6,
      rigType: "Sloop",
      keelType: "Fin",
    });
    expect(tags).toContain("bluewater-cruiser");
  });

  it("should assign family-cruiser tag for 38ft with 3 cabins", () => {
    const tags = assignUseCaseTags({
      lengthOverall: 11.5,
      displacement: 7000,
      ballast: 2000,
      sailAreaMain: 70,
      beam: 3.9,
      draft: 1.8,
      cabins: 3,
      berths: 6,
      rigType: "Sloop",
      keelType: "Fin",
    });
    expect(tags).toContain("family-cruiser");
  });

  it("should map use-case tags to USE_CASES metadata", () => {
    const tags = ["bluewater-cruiser", "family-cruiser"];
    const labels = tags
      .map((tag) => USE_CASES.find((u) => u.id === tag))
      .filter(Boolean)
      .map((uc) => uc!.labelEn);
    expect(labels).toContain("Bluewater Cruising");
    expect(labels).toContain("Family Cruising");
  });

  it("USE_CASES should have 6 entries with required fields", () => {
    expect(USE_CASES).toHaveLength(6);
    for (const uc of USE_CASES) {
      expect(uc.slug).toBeTruthy();
      expect(uc.labelEn).toBeTruthy();
      expect(uc.labelFr).toBeTruthy();
      expect(uc.emoji).toBeTruthy();
    }
  });
});
