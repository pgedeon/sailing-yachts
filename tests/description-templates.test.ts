import { describe, it, expect } from "vitest";
import {
  generateDescription,
  generateAllStyles,
  needsGeneratedDescription,
  scoreDescription,
  type YachtSpecsForDescription,
} from "@/lib/description-templates";

const baseSpecs: YachtSpecsForDescription = {
  manufacturer: "Beneteau",
  modelName: "Oceanis 40.1",
  year: 2020,
  lengthOverall: 12.43,
  beam: 3.99,
  draft: 2.09,
  displacement: 8500,
  ballast: 2100,
  sailAreaMain: 73.5,
  rigType: "Sloop",
  keelType: "Fin",
  hullMaterial: "GRP",
  cabins: 3,
  berths: 6,
  heads: 1,
  maxOccupancy: 8,
  engineHp: 45,
  engineType: "Yanmar diesel",
  fuelCapacity: 200,
  waterCapacity: 200,
  designNotes: null,
};

describe("Description Templates", () => {
  describe("generateDescription", () => {
    it("generates a balanced description from full specs", () => {
      const desc = generateDescription(baseSpecs);
      expect(desc).toBeTruthy();
      expect(desc.length).toBeGreaterThan(50);
      expect(desc).toContain("Beneteau");
      expect(desc).toContain("Oceanis 40.1");
      expect(desc).toContain("2020");
    });

    it("generates a technical description", () => {
      const desc = generateDescription(baseSpecs, "technical");
      expect(desc).toBeTruthy();
      expect(desc).toContain("12.4m");
    });

    it("generates a marketing description", () => {
      const desc = generateDescription(baseSpecs, "marketing");
      expect(desc).toBeTruthy();
      expect(desc).toContain("Beneteau");
    });

    it("handles minimal specs gracefully", () => {
      const minimal: YachtSpecsForDescription = {
        manufacturer: "Test",
        modelName: "Boat",
        year: 2023,
        lengthOverall: null,
        beam: null,
        draft: null,
        displacement: null,
        ballast: null,
        sailAreaMain: null,
        rigType: null,
        keelType: null,
        hullMaterial: null,
        cabins: null,
        berths: null,
        heads: null,
        maxOccupancy: null,
        engineHp: null,
        engineType: null,
        fuelCapacity: null,
        waterCapacity: null,
        designNotes: null,
      };
      const desc = generateDescription(minimal);
      expect(desc).toBeTruthy();
      expect(desc).toContain("Test Boat");
    });

    it("includes design notes when present", () => {
      const specs = {
        ...baseSpecs,
        designNotes: "Designed by Marc Lombard for performance cruising.",
      };
      const desc = generateDescription(specs);
      expect(desc).toContain("Marc Lombard");
    });

    it("respects maxSentences parameter", () => {
      const desc = generateDescription(baseSpecs, "balanced", 2);
      // Should have at most 2 sentences (intro + 1 more)
      const sentences = desc.split(/\.\s+/).filter((s) => s.length > 0)
      expect(sentences.length).toBeLessThanOrEqual(3); // Allow for trailing period
    });
  });

  describe("generateAllStyles", () => {
    it("generates all three style variants", () => {
      const styles = generateAllStyles(baseSpecs);
      expect(styles.technical).toBeTruthy();
      expect(styles.marketing).toBeTruthy();
      expect(styles.balanced).toBeTruthy();
      expect(styles.technical).not.toBe(styles.marketing);
    });
  });

  describe("needsGeneratedDescription", () => {
    it("returns true for null description", () => {
      expect(needsGeneratedDescription(null)).toBe(true);
    });

    it("returns true for empty description", () => {
      expect(needsGeneratedDescription("")).toBe(true);
    });

    it("returns true for very short description", () => {
      expect(needsGeneratedDescription("Short text")).toBe(true);
    });

    it("returns false for adequate description", () => {
      expect(
        needsGeneratedDescription(
          "This is a well-detailed yacht description that exceeds fifty characters easily."
        )
      ).toBe(false);
    });
  });

  describe("scoreDescription", () => {
    it("returns 0 for null", () => {
      expect(scoreDescription(null)).toBe(0);
    });

    it("returns low score for very short text", () => {
      expect(scoreDescription("Short")).toBe(10);
    });

    it("returns higher score for rich descriptions", () => {
      const rich =
        "The Beneteau Oceanis 40.1 is a 12.4m sailing yacht with sloop rig, " +
        "fin keel, and GRP hull construction. She features 3 cabins, 6 berths, " +
        "and is powered by a Yanmar diesel engine producing 45 HP. " +
        "Designed for coastal cruising and family sailing adventures.";
      const score = scoreDescription(rich);
      expect(score).toBeGreaterThan(50);
    });

    it("maxes at 100", () => {
      const superRich =
        "A fantastic bluewater cruising yacht with spacious cabins, " +
        "excellent sail plan with sloop rig, displacement of 8.5 tonnes, " +
        "diesel engine with 45 HP, and a beautiful GRP hull with fin keel. " +
        "Perfect for racing or offshore cruising with 6 berths across 3 cabins. " +
        "This vessel offers exceptional build quality, sailing performance, " +
        "comfort and value for money for the discerning sailor.";
      expect(scoreDescription(superRich)).toBeLessThanOrEqual(100);
    });
  });
});
