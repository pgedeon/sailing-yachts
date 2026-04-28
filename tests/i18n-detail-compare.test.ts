/**
 * i18n message catalog validation tests for YachtDetail, Compare & YachtDetailSub namespaces.
 *
 * Ensures both en.json and fr.json have identical key structures
 * for the YachtDetail, Compare, and YachtDetailSub translation namespaces,
 * and that no keys are missing or have empty values.
 */
import { describe, it, expect } from "vitest";
import en from "../messages/en.json";
import fr from "../messages/fr.json";

type NestedKeys = string[];

function collectKeys(obj: unknown, prefix = ""): NestedKeys {
  if (typeof obj !== "object" || obj === null) return [];
  const keys: NestedKeys = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null) {
      keys.push(...collectKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getNestedValue(obj: unknown, key: string): unknown {
  const parts = key.split(".");
  let val: unknown = obj;
  for (const p of parts) {
    if (typeof val !== "object" || val === null) return undefined;
    val = (val as Record<string, unknown>)[p];
  }
  return val;
}

// ─── YachtDetail namespace ───

describe("i18n message catalogs — YachtDetail namespace", () => {
  const enKeys = new Set(collectKeys(en.YachtDetail));
  const frKeys = new Set(collectKeys(fr.YachtDetail));

  it("en.json has YachtDetail namespace", () => {
    expect(en.YachtDetail).toBeDefined();
    expect(typeof en.YachtDetail).toBe("object");
  });

  it("fr.json has YachtDetail namespace", () => {
    expect(fr.YachtDetail).toBeDefined();
    expect(typeof fr.YachtDetail).toBe("object");
  });

  it("fr.json has all keys from en.json YachtDetail", () => {
    const missing = Array.from(enKeys).filter(k => !frKeys.has(k));
    expect(missing, `Missing keys in fr.json YachtDetail: ${missing.join(", ")}`).toEqual([]);
  });

  it("en.json has all keys from fr.json YachtDetail", () => {
    const extra = Array.from(frKeys).filter(k => !enKeys.has(k));
    expect(extra, `Extra keys in fr.json YachtDetail: ${extra.join(", ")}`).toEqual([]);
  });

  it("no empty French translations in YachtDetail", () => {
    const emptyKeys = Array.from(frKeys).filter(k => {
      const val = getNestedValue(fr.YachtDetail, k);
      return typeof val === "string" && val.trim() === "";
    });
    expect(emptyKeys, `Empty translations in fr.json YachtDetail: ${emptyKeys.join(", ")}`).toEqual([]);
  });

  // Spot-check critical keys
  const criticalKeys = [
    "meta.title",
    "meta.description",
    "meta.notFoundTitle",
    "meta.notFoundDescription",
    "breadcrumb.home",
    "breadcrumb.yachts",
    "loading",
    "error",
    "backToBrowse",
    "printSpecSheet",
    "printHeader",
    "printFooter",
    "noImage",
    "builtBy",
    "sourceLabel",
    "coreSpecs.lengthOverall",
    "coreSpecs.beam",
    "coreSpecs.draft",
    "coreSpecs.displacement",
    "groupLabels.dimensions",
    "groupLabels.sailplan",
    "groupLabels.accommodation",
    "groupLabels.technical",
    "groupLabels.performance",
    "groupLabels.hull",
    "groupLabels.other",
    "performance.heading",
    "performance.displacementLength",
    "performance.sailAreaDisplacement",
    "performance.ballastRatio",
    "performance.capsizeScreening",
    "performance.dlUltraLight",
    "performance.dlLight",
    "performance.dlModerate",
    "performance.dlHeavy",
    "performance.sadUnderCanvased",
    "performance.sadModerate",
    "performance.sadPerformance",
    "performance.sadHighPerformance",
    "performance.ballastLow",
    "performance.ballastModerate",
    "performance.ballastHigh",
    "performance.csfExcellent",
    "performance.csfGood",
    "performance.csfModerate",
    "performance.csfHigh",
    "recommendation.heading",
    "recommendation.daySailing",
    "recommendation.coastalCruising",
    "recommendation.bluewater",
    "recommendation.familyFriendly",
    "recommendation.couples",
    "recommendation.solidConstruction",
    "recommendation.classicRig",
    "recommendation.template",
    "badges.daySailer",
    "badges.coastalCruiser",
    "badges.bluewater",
    "badges.familyFriendly",
    "badges.easyHandling",
    "reviews.heading",
    "reviews.verified",
    "compare",
    "bestValue.seeRanked",
    "notFound.heading",
    "notFound.description",
    "notFound.browseAll",
    "correctionFields.lengthOverall",
    "correctionFields.beam",
    "correctionFields.draft",
    "correctionFields.displacement",
    "correctionFields.ballast",
    "correctionFields.sailAreaMain",
    "correctionFields.rigType",
    "correctionFields.keelType",
    "correctionFields.hullMaterial",
    "correctionFields.cabins",
    "correctionFields.berths",
    "correctionFields.heads",
    "correctionFields.maxOccupancy",
    "correctionFields.engineHp",
    "correctionFields.engineType",
    "correctionFields.fuelCapacity",
    "correctionFields.waterCapacity",
  ];

  it.each(criticalKeys)("has critical key YachtDetail.%s in en.json", (key) => {
    expect(enKeys.has(key), `Missing YachtDetail.${key} in en.json`).toBe(true);
  });

  it.each(criticalKeys)("has critical key YachtDetail.%s in fr.json", (key) => {
    expect(frKeys.has(key), `Missing YachtDetail.${key} in fr.json`).toBe(true);
  });

  // Verify FR translations are actually different from EN for key strings
  it("FR translations differ from EN for critical YachtDetail strings", () => {
    const frDiffersKeys = [
      "loading",
      "backToBrowse",
      "printSpecSheet",
      "noImage",
      "performance.heading",
      "recommendation.heading",
      "reviews.heading",
      "compare",
    ];
    for (const key of frDiffersKeys) {
      const enVal = getNestedValue(en.YachtDetail, key);
      const frVal = getNestedValue(fr.YachtDetail, key);
      expect(frVal).not.toBe(enVal);
    }
  });
});

// ─── Compare namespace ───

describe("i18n message catalogs — Compare namespace", () => {
  const enKeys = new Set(collectKeys(en.Compare));
  const frKeys = new Set(collectKeys(fr.Compare));

  it("en.json has Compare namespace", () => {
    expect(en.Compare).toBeDefined();
    expect(typeof en.Compare).toBe("object");
  });

  it("fr.json has Compare namespace", () => {
    expect(fr.Compare).toBeDefined();
    expect(typeof fr.Compare).toBe("object");
  });

  it("fr.json has all keys from en.json Compare", () => {
    const missing = Array.from(enKeys).filter(k => !frKeys.has(k));
    expect(missing, `Missing keys in fr.json Compare: ${missing.join(", ")}`).toEqual([]);
  });

  it("en.json has all keys from fr.json Compare", () => {
    const extra = Array.from(frKeys).filter(k => !enKeys.has(k));
    expect(extra, `Extra keys in fr.json Compare: ${extra.join(", ")}`).toEqual([]);
  });

  it("no empty French translations in Compare", () => {
    const emptyKeys = Array.from(frKeys).filter(k => {
      const val = getNestedValue(fr.Compare, k);
      return typeof val === "string" && val.trim() === "";
    });
    expect(emptyKeys, `Empty translations in fr.json Compare: ${emptyKeys.join(", ")}`).toEqual([]);
  });

  // Spot-check critical keys
  const criticalKeys = [
    "heading",
    "subtitle",
    "share",
    "copied",
    "save",
    "saved",
    "nameComparison",
    "saveButton",
    "slot.addYacht",
    "slot.slotN",
    "slot.chooseYachts",
    "slot.addAnother",
    "picker.searchPlaceholder",
    "picker.loading",
    "picker.noMatch",
    "picker.done",
    "picker.selected",
    "prompt.selectYachts",
    "prompt.chooseSubtitle",
    "loading",
    "table.spec",
    "table.estPriceRange",
    "table.notes",
    "table.designNotes",
    "groups.dimensions",
    "groups.riggingSails",
    "groups.construction",
    "groups.accommodation",
    "groups.technical",
    "groups.notes",
    "fields.lengthOverall",
    "fields.beam",
    "fields.draft",
    "fields.displacement",
    "fields.ballast",
    "fields.sailAreaMain",
    "fields.rigType",
    "fields.keelType",
    "fields.hullMaterial",
    "fields.cabins",
    "fields.berths",
    "fields.heads",
    "fields.maxOccupancy",
    "fields.engineHp",
    "fields.engineType",
    "fields.fuel",
    "fields.water",
    "legend.greenBest",
    "legend.swipeHint",
    "backToBrowse",
    "printHeader",
    "printDate",
    "savedComparisons.heading",
    "savedComparisons.noSaved",
    "savedComparisons.yachtCount",
  ];

  it.each(criticalKeys)("has critical key Compare.%s in en.json", (key) => {
    expect(enKeys.has(key), `Missing Compare.${key} in en.json`).toBe(true);
  });

  it.each(criticalKeys)("has critical key Compare.%s in fr.json", (key) => {
    expect(frKeys.has(key), `Missing Compare.${key} in fr.json`).toBe(true);
  });

  it("FR translations differ from EN for critical Compare strings", () => {
    const frDiffersKeys = [
      "heading",
      "subtitle",
      "share",
      "copied",
      "save",
      "loading",
      "backToBrowse",
      "printHeader",
    ];
    for (const key of frDiffersKeys) {
      const enVal = getNestedValue(en.Compare, key);
      const frVal = getNestedValue(fr.Compare, key);
      expect(frVal).not.toBe(enVal);
    }
  });
});

// ─── YachtDetailSub namespace ───

describe("i18n message catalogs — YachtDetailSub namespace", () => {
  const enKeys = new Set(collectKeys(en.YachtDetailSub));
  const frKeys = new Set(collectKeys(fr.YachtDetailSub));

  it("en.json has YachtDetailSub namespace", () => {
    expect(en.YachtDetailSub).toBeDefined();
    expect(typeof en.YachtDetailSub).toBe("object");
  });

  it("fr.json has YachtDetailSub namespace", () => {
    expect(fr.YachtDetailSub).toBeDefined();
    expect(typeof fr.YachtDetailSub).toBe("object");
  });

  it("fr.json has all keys from en.json YachtDetailSub", () => {
    const missing = Array.from(enKeys).filter(k => !frKeys.has(k));
    expect(missing, `Missing keys in fr.json YachtDetailSub: ${missing.join(", ")}`).toEqual([]);
  });

  it("en.json has all keys from fr.json YachtDetailSub", () => {
    const extra = Array.from(frKeys).filter(k => !enKeys.has(k));
    expect(extra, `Extra keys in fr.json YachtDetailSub: ${extra.join(", ")}`).toEqual([]);
  });

  it("no empty French translations in YachtDetailSub", () => {
    const emptyKeys = Array.from(frKeys).filter(k => {
      const val = getNestedValue(fr.YachtDetailSub, k);
      return typeof val === "string" && val.trim() === "";
    });
    expect(emptyKeys, `Empty translations in fr.json YachtDetailSub: ${emptyKeys.join(", ")}`).toEqual([]);
  });

  // Spot-check critical keys
  const criticalKeys = [
    "similarYachts",
    "basedOnSpecs",
    "sameSizeAlternatives",
    "withinRange",
    "noImage",
    "viewDetails",
    "matchPercent",
    "moreFromManufacturer",
    "buyingGuides",
    "guidesFallback",
    "browseAllGuides",
    "guidesRelated",
    "viewAllGuides",
    "relatedArticles",
    "minRead",
  ];

  it.each(criticalKeys)("has critical key YachtDetailSub.%s in en.json", (key) => {
    expect(enKeys.has(key), `Missing YachtDetailSub.${key} in en.json`).toBe(true);
  });

  it.each(criticalKeys)("has critical key YachtDetailSub.%s in fr.json", (key) => {
    expect(frKeys.has(key), `Missing YachtDetailSub.${key} in fr.json`).toBe(true);
  });

  it("FR translations differ from EN for YachtDetailSub strings", () => {
    const frDiffersKeys = [
      "similarYachts",
      "basedOnSpecs",
      "sameSizeAlternatives",
      "withinRange",
      "noImage",
      "viewDetails",
      "moreFromManufacturer",
      "buyingGuides",
      "relatedArticles",
    ];
    for (const key of frDiffersKeys) {
      const enVal = getNestedValue(en.YachtDetailSub, key);
      const frVal = getNestedValue(fr.YachtDetailSub, key);
      expect(frVal).not.toBe(enVal);
    }
  });
});
