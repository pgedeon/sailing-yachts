/**
 * i18n message catalog validation tests for Yachts & Search namespaces.
 *
 * Ensures both en.json and fr.json have identical key structures
 * for the Yachts and Search translation namespaces, and that
 * no keys are missing or have empty values.
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

describe("i18n message catalogs — Yachts namespace", () => {
  const enKeys = new Set(collectKeys(en.Yachts));
  const frKeys = new Set(collectKeys(fr.Yachts));

  it("en.json has Yachts namespace", () => {
    expect(en.Yachts).toBeDefined();
    expect(typeof en.Yachts).toBe("object");
  });

  it("fr.json has Yachts namespace", () => {
    expect(fr.Yachts).toBeDefined();
    expect(typeof fr.Yachts).toBe("object");
  });

  it("fr.json has all keys from en.json Yachts", () => {
    const missing = Array.from(enKeys).filter(k => !frKeys.has(k));
    expect(missing, `Missing keys in fr.json Yachts: ${missing.join(", ")}`).toEqual([]);
  });

  it("en.json has all keys from fr.json Yachts", () => {
    const extra = Array.from(frKeys).filter(k => !enKeys.has(k));
    expect(extra, `Extra keys in fr.json Yachts: ${extra.join(", ")}`).toEqual([]);
  });

  it("no empty French translations in Yachts", () => {
    const emptyKeys = Array.from(frKeys).filter(k => {
      const parts = k.split(".");
      let val: unknown = fr.Yachts;
      for (const p of parts) val = (val as Record<string, unknown>)[p];
      return typeof val === "string" && val.trim() === "";
    });
    expect(emptyKeys, `Empty translations in fr.json Yachts: ${emptyKeys.join(", ")}`).toEqual([]);
  });

  // Spot-check critical keys
  const criticalKeys = [
    "heading",
    "loading",
    "noResults",
    "clearAllFilters",
    "filters.heading",
    "filters.manufacturer",
    "filters.rigType",
    "filters.keelType",
    "filters.hullMaterial",
    "filters.clearFilters",
    "presets.bluewater.label",
    "presets.racing.label",
    "presets.budget.label",
    "presets.family.label",
    "presets.bluewater.description",
    "presets.racing.description",
    "presets.budget.description",
    "presets.family.description",
    "specs.length",
    "specs.beam",
    "specs.draft",
    "specs.displacement",
    "specs.cabins",
    "specs.berths",
    "specs.heads",
    "viewDetails",
    "viewFullSpec",
    "pagination.previous",
    "pagination.next",
    "pagination.pageInfo",
    "pagination.total",
    "modal.close",
  ];

  it.each(criticalKeys)("has critical key Yachts.%s in en.json", (key) => {
    expect(enKeys.has(key), `Missing Yachts.${key} in en.json`).toBe(true);
  });

  it.each(criticalKeys)("has critical key Yachts.%s in fr.json", (key) => {
    expect(frKeys.has(key), `Missing Yachts.${key} in fr.json`).toBe(true);
  });
});

describe("i18n message catalogs — Search namespace", () => {
  const enKeys = new Set(collectKeys(en.Search));
  const frKeys = new Set(collectKeys(fr.Search));

  it("en.json has Search namespace", () => {
    expect(en.Search).toBeDefined();
    expect(typeof en.Search).toBe("object");
  });

  it("fr.json has Search namespace", () => {
    expect(fr.Search).toBeDefined();
    expect(typeof fr.Search).toBe("object");
  });

  it("fr.json has all keys from en.json Search", () => {
    const missing = Array.from(enKeys).filter(k => !frKeys.has(k));
    expect(missing, `Missing keys in fr.json Search: ${missing.join(", ")}`).toEqual([]);
  });

  it("en.json has all keys from fr.json Search", () => {
    const extra = Array.from(frKeys).filter(k => !enKeys.has(k));
    expect(extra, `Extra keys in fr.json Search: ${extra.join(", ")}`).toEqual([]);
  });

  it("no empty French translations in Search", () => {
    const emptyKeys = Array.from(frKeys).filter(k => {
      const parts = k.split(".");
      let val: unknown = fr.Search;
      for (const p of parts) val = (val as Record<string, unknown>)[p];
      return typeof val === "string" && val.trim() === "";
    });
    expect(emptyKeys, `Empty translations in fr.json Search: ${emptyKeys.join(", ")}`).toEqual([]);
  });

  // Spot-check critical keys
  const criticalKeys = [
    "heading",
    "subtitle",
    "placeholder",
    "searchButton",
    "searching",
    "hint",
    "results.count",
    "results.searching",
    "results.for",
    "results.loa",
    "results.beam",
    "results.draft",
    "saveSearch",
    "saved",
    "saveFailed",
    "empty.heading",
    "empty.description",
    "popular",
    "suggestions.label",
    "meta.title",
    "meta.description",
  ];

  it.each(criticalKeys)("has critical key Search.%s in en.json", (key) => {
    expect(enKeys.has(key), `Missing Search.${key} in en.json`).toBe(true);
  });

  it.each(criticalKeys)("has critical key Search.%s in fr.json", (key) => {
    expect(frKeys.has(key), `Missing Search.${key} in fr.json`).toBe(true);
  });
});

describe("i18n filter presets translations", () => {
  it("all preset IDs have translations in both locales", () => {
    const presetIds = ["bluewater", "racing", "budget", "family"];
    for (const id of presetIds) {
      // EN
      expect(en.Yachts.presets[id as keyof typeof en.Yachts.presets]).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enPreset = (en.Yachts.presets as any)[id];
      expect(enPreset.label).toBeTruthy();
      expect(enPreset.description).toBeTruthy();

      // FR
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const frPreset = (fr.Yachts.presets as any)[id];
      expect(frPreset.label).toBeTruthy();
      expect(frPreset.description).toBeTruthy();

      // FR should be different from EN (actually translated)
      expect(frPreset.label).not.toBe(enPreset.label);
    }
  });
});
