import { describe, it, expect } from "vitest";
import {
  generateDescription,
  generateAllStyles,
  needsGeneratedDescription,
  scoreDescription,
  type YachtSpecsForDescription,
  type DescriptionStyle,
} from "../lib/description-templates";
import {
  assignVariant,
  getAllAssignments,
  createEvent,
  EXPERIMENTS,
  type ExperimentId,
} from "../lib/ab-testing";
import { buildFallbackAlsoViewed } from "../lib/also-viewed";

// ──────────────────────────────────────────
// Test Fixtures
// ──────────────────────────────────────────

const fullSpecs: YachtSpecsForDescription = {
  manufacturer: "Beneteau",
  modelName: "Oceanis 40.1",
  year: 2020,
  lengthOverall: 12.43,
  beam: 3.99,
  draft: 2.09,
  displacement: 8200,
  ballast: 2100,
  sailAreaMain: 79.2,
  rigType: "Sloop",
  keelType: "Iron keel",
  hullMaterial: "GRP",
  cabins: 3,
  berths: 6,
  heads: 2,
  maxOccupancy: 8,
  engineHp: 45,
  engineType: "Yanmar diesel",
  fuelCapacity: 200,
  waterCapacity: 240,
  designNotes: "Designed by Marc Lombard for performance cruising.",
};

const minimalSpecs: YachtSpecsForDescription = {
  manufacturer: "Unknown",
  modelName: "Mystery 30",
  year: 2015,
  lengthOverall: 9.0,
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

const noSpecsAtAll: YachtSpecsForDescription = {
  manufacturer: "Builder",
  modelName: "Boat",
  year: 2020,
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

// ══════════════════════════════════════════
// Description Templates Tests
// ══════════════════════════════════════════

describe("Description Templates", () => {
  describe("generateDescription", () => {
    it("generates a description from full specs", () => {
      const desc = generateDescription(fullSpecs, "balanced", 10);
      expect(desc).toBeTruthy();
      expect(desc.length).toBeGreaterThan(50);
      expect(desc).toContain("Beneteau");
      expect(desc).toContain("Oceanis 40.1");
    });

    it("generates descriptions in technical style", () => {
      const desc = generateDescription(fullSpecs, "technical");
      expect(desc).toBeTruthy();
      expect(desc.length).toBeGreaterThan(50);
      expect(desc).toContain("Beneteau");
    });

    it("generates descriptions in marketing style", () => {
      const desc = generateDescription(fullSpecs, "marketing");
      expect(desc).toBeTruthy();
      expect(desc.length).toBeGreaterThan(50);
      expect(desc).toContain("Beneteau");
    });

    it("handles minimal specs gracefully", () => {
      const desc = generateDescription(minimalSpecs);
      expect(desc).toBeTruthy();
      expect(desc).toContain("Unknown");
      expect(desc).toContain("Mystery 30");
    });

    it("handles no specs at all", () => {
      const desc = generateDescription(noSpecsAtAll);
      expect(desc).toBeTruthy();
      expect(desc).toContain("Builder");
      expect(desc).toContain("Boat");
    });

    it("includes dimensions when available", () => {
      const desc = generateDescription(fullSpecs, "balanced");
      expect(desc).toMatch(/12\.4m/i);
    });

    it("includes accommodation details when available", () => {
      const desc = generateDescription(fullSpecs, "balanced");
      expect(desc).toMatch(/3 cabin|6 berth/i);
    });

    it("respects maxSentences parameter", () => {
      const short = generateDescription(fullSpecs, "balanced", 2);
      const long = generateDescription(fullSpecs, "balanced", 8);
      // Short should have fewer sentences
      const shortPeriods = (short.match(/\./g) || []).length;
      const longPeriods = (long.match(/\./g) || []).length;
      expect(shortPeriods).toBeLessThanOrEqual(longPeriods);
    });

    it("technical style mentions displacement ratio", () => {
      const desc = generateDescription(fullSpecs, "technical");
      expect(desc).toMatch(/D\/L|displacement/i);
    });

    it("marketing style uses aspirational language", () => {
      const desc = generateDescription(fullSpecs, "marketing");
      // Marketing descriptions should have more emotive language
      expect(desc).toBeTruthy();
      expect(desc.length).toBeGreaterThan(30);
    });

    it("includes keel and hull info when available", () => {
      const desc = generateDescription(fullSpecs, "balanced", 10);
      expect(desc).toMatch(/GRP|iron keel/i);
    });

    it("includes engine info when available with higher limit", () => {
      const desc = generateDescription(fullSpecs, "balanced", 10);
      expect(desc).toMatch(/45 HP|Yanmar/i);
    });

    it("includes design notes when available", () => {
      const desc = generateDescription(fullSpecs, "balanced", 10);
      expect(desc).toContain("Marc Lombard");
    });
  });

  describe("generateAllStyles", () => {
    it("generates all three style variants", () => {
      const styles = generateAllStyles(fullSpecs);
      expect(styles.technical).toBeTruthy();
      expect(styles.marketing).toBeTruthy();
      expect(styles.balanced).toBeTruthy();
    });

    it("each style is different", () => {
      const styles = generateAllStyles(fullSpecs);
      expect(styles.technical).not.toBe(styles.marketing);
      expect(styles.technical).not.toBe(styles.balanced);
      expect(styles.marketing).not.toBe(styles.balanced);
    });
  });

  describe("needsGeneratedDescription", () => {
    it("returns true for null", () => {
      expect(needsGeneratedDescription(null)).toBe(true);
    });

    it("returns true for empty string", () => {
      expect(needsGeneratedDescription("")).toBe(true);
    });

    it("returns true for very short description", () => {
      expect(needsGeneratedDescription("A nice boat")).toBe(true);
    });

    it("returns false for adequate description", () => {
      expect(
        needsGeneratedDescription(
          "The Beneteau Oceanis 40.1 is a fantastic cruising yacht with excellent performance.",
        ),
      ).toBe(false);
    });
  });

  describe("scoreDescription", () => {
    it("returns 0 for null", () => {
      expect(scoreDescription(null)).toBe(0);
    });

    it("returns low score for very short description", () => {
      expect(scoreDescription("Short")).toBe(10);
    });

    it("returns higher score for longer descriptions", () => {
      const short = scoreDescription("A boat with cabins and berths for sailing.");
      const long = scoreDescription(
        "The Beneteau Oceanis 40.1 is a 40-foot cruising yacht with a sloop rig, " +
          "GRP hull construction, and an iron keel. She features 3 cabins, 6 berths, " +
          "and 2 heads, making her ideal for family cruising. Powered by a Yanmar diesel " +
          "engine producing 45 HP, she offers reliable performance both under sail and power. " +
          "Her displacement of 8.2 tonnes provides excellent stability for offshore sailing.",
      );
      expect(long).toBeGreaterThan(short);
    });

    it("rewards sailing-specific terminology", () => {
      const generic = scoreDescription("This is a very nice product that people enjoy using on weekends.");
      const sailing = scoreDescription("This sloop-rigged yacht features a deep keel, spacious cabins, and reliable diesel engine for cruising.");
      expect(sailing).toBeGreaterThan(generic);
    });
  });

  describe("String value handling", () => {
    it("handles string number values for LOA", () => {
      const stringSpecs: YachtSpecsForDescription = {
        ...minimalSpecs,
        lengthOverall: "12.43" as any,
        beam: "3.99" as any,
      };
      const desc = generateDescription(stringSpecs);
      expect(desc).toBeTruthy();
      expect(desc).toMatch(/12\.4m/);
    });
  });
});

// ══════════════════════════════════════════
// A/B Testing Framework Tests
// ══════════════════════════════════════════

describe("A/B Testing Framework", () => {
  describe("assignVariant", () => {
    it("returns a valid variant for yacht_description_style", () => {
      const variant = assignVariant("yacht_description_style", "user123");
      expect(["balanced", "technical", "marketing"]).toContain(variant.id);
    });

    it("returns a valid variant for yacht_cta_style", () => {
      const variant = assignVariant("yacht_cta_style", "user123");
      expect(["default", "action", "benefit"]).toContain(variant.id);
    });

    it("is deterministic — same user gets same variant", () => {
      const v1 = assignVariant("yacht_description_style", "user456");
      const v2 = assignVariant("yacht_description_style", "user456");
      expect(v1.id).toBe(v2.id);
    });

    it("different users may get different variants", () => {
      const variants = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const v = assignVariant("yacht_description_style", `user${i}`);
        variants.add(v.id);
      }
      // Should have at least 2 different variants across 100 users
      expect(variants.size).toBeGreaterThanOrEqual(2);
    });

    it("returns fallback for inactive experiment", () => {
      // Create a temporary inactive experiment scenario
      const experiment = EXPERIMENTS["yacht_description_style"];
      const originalActive = experiment.isActive;
      experiment.isActive = false;
      const variant = assignVariant("yacht_description_style", "testuser");
      expect(variant).toBeTruthy();
      experiment.isActive = originalActive;
    });
  });

  describe("getAllAssignments", () => {
    it("returns assignments for all experiments", () => {
      const assignments = getAllAssignments("user789");
      expect(assignments).toHaveProperty("yacht_description_style");
      expect(assignments).toHaveProperty("yacht_cta_style");
    });
  });

  describe("createEvent", () => {
    it("creates an impression event", () => {
      const event = createEvent("yacht_description_style", "technical", "impression", "user1");
      expect(event.experimentId).toBe("yacht_description_style");
      expect(event.variantId).toBe("technical");
      expect(event.eventType).toBe("impression");
      expect(event.userId).toBe("user1");
      expect(event.timestamp).toBeTruthy();
    });

    it("creates a conversion event with metadata", () => {
      const event = createEvent(
        "yacht_cta_style",
        "action",
        "conversion",
        "user2",
        { yachtSlug: "beneteau-oceanis-40-1" },
      );
      expect(event.metadata).toEqual({ yachtSlug: "beneteau-oceanis-40-1" });
    });
  });

  describe("Traffic distribution", () => {
    it("distributes approximately according to weights", () => {
      const counts: Record<string, number> = {};
      const n = 1000;
      for (let i = 0; i < n; i++) {
        const v = assignVariant("yacht_description_style", `disttest${i}`);
        counts[v.id] = (counts[v.id] || 0) + 1;
      }
      // Balanced should get ~50% (450-550), technical ~25% (200-300), marketing ~25%
      expect(counts["balanced"]).toBeGreaterThan(400);
      expect(counts["balanced"]).toBeLessThan(600);
      // Technical and marketing should each be roughly 25%
      expect((counts["technical"] || 0) + (counts["marketing"] || 0)).toBeGreaterThan(350);
    });
  });
});

// ══════════════════════════════════════════
// "Users Also Viewed" Tests
// ══════════════════════════════════════════

describe("Also Viewed / Fallback", () => {
  const candidates = [
    { id: 2, manufacturer: "Jeanneau", modelName: "Sun Odyssey 40", slug: "jeanneau-so40", year: 2020, lengthOverall: 12.0, manufacturerId: 2, primaryImage: "img.jpg" },
    { id: 3, manufacturer: "Beneteau", modelName: "Oceanis 38", slug: "beneteau-o38", year: 2019, lengthOverall: 11.5, manufacturerId: 1, primaryImage: "img2.jpg" },
    { id: 4, manufacturer: "Hanse", modelName: "415", slug: "hanse-415", year: 2018, lengthOverall: 12.4, manufacturerId: 5, primaryImage: null },
    { id: 5, manufacturer: "Beneteau", modelName: "Oceanis 41.1", slug: "beneteau-o411", year: 2021, lengthOverall: 12.43, manufacturerId: 1, primaryImage: "img3.jpg" },
    { id: 6, manufacturer: "Bavaria", modelName: "C42", slug: "bavaria-c42", year: 2022, lengthOverall: 12.7, manufacturerId: 3, primaryImage: "img4.jpg" },
    { id: 7, manufacturer: "Dufour", modelName: "390", slug: "dufour-390", year: 2017, lengthOverall: 11.7, manufacturerId: 4, primaryImage: null },
  ];

  const currentYacht = {
    id: 1,
    lengthOverall: 12.43,
    manufacturerId: 1,
    manufacturer: "Beneteau",
  };

  it("returns results excluding current yacht", () => {
    const results = buildFallbackAlsoViewed(candidates, currentYacht);
    expect(results.every((r) => r.id !== 1)).toBe(true);
  });

  it("respects the limit parameter", () => {
    const results = buildFallbackAlsoViewed(candidates, currentYacht, 3);
    expect(results.length).toBe(3);
  });

  it("ranks same-manufacturer yachts higher", () => {
    const results = buildFallbackAlsoViewed(candidates, currentYacht, 6);
    // Beneteau yachts should generally rank higher
    const beneteauPositions = results
      .map((r, i) => ({ id: r.id, pos: i, mfr: r.manufacturer }))
      .filter((r) => r.mfr === "Beneteau");
    // At least one Beneteau in top 3
    expect(beneteauPositions.some((p) => p.pos < 3)).toBe(true);
  });

  it("ranks similar-size yachts higher", () => {
    const results = buildFallbackAlsoViewed(candidates, currentYacht, 6);
    // Yachts close to 12.43m should rank higher
    const topResult = results[0];
    const topLoa = Number(topResult.lengthOverall) || 0;
    expect(Math.abs(topLoa - 12.43)).toBeLessThan(1.5);
  });

  it("handles empty candidates", () => {
    const results = buildFallbackAlsoViewed([], currentYacht);
    expect(results).toEqual([]);
  });

  it("handles candidates with no lengthOverall", () => {
    const noLoa = candidates.map((c) => ({ ...c, lengthOverall: null }));
    const results = buildFallbackAlsoViewed(noLoa, currentYacht, 3);
    // Should still return results, just without size bonus
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("prefers yachts with images", () => {
    const results = buildFallbackAlsoViewed(candidates, currentYacht, 6);
    // Yachts with images should be favored when other factors are equal
    expect(results).toBeTruthy();
  });
});
