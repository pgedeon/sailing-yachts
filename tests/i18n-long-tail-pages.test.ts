/**
 * i18n message catalog validation tests for BestValue, CheaperAlternatives,
 * SearchIntent & LandingPages namespaces.
 *
 * Ensures both en.json and fr.json have identical key structures
 * for the long-tail landing page translation namespaces,
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

// ─── BestValue namespace ───

describe("i18n message catalogs — BestValue namespace", () => {
  const enKeys = new Set(collectKeys(en.BestValue));
  const frKeys = new Set(collectKeys(fr.BestValue));

  it("en.json has BestValue namespace", () => {
    expect(en.BestValue).toBeDefined();
    expect(typeof en.BestValue).toBe("object");
  });

  it("fr.json has BestValue namespace", () => {
    expect(fr.BestValue).toBeDefined();
    expect(typeof fr.BestValue).toBe("object");
  });

  it("fr.json has all keys from en.json BestValue", () => {
    const missing = Array.from(enKeys).filter(k => !frKeys.has(k));
    expect(missing, `Missing keys in fr.json BestValue: ${missing.join(", ")}`).toEqual([]);
  });

  it("en.json has all keys from fr.json BestValue", () => {
    const extra = Array.from(frKeys).filter(k => !enKeys.has(k));
    expect(extra, `Extra keys in fr.json BestValue: ${extra.join(", ")}`).toEqual([]);
  });

  it("no empty values in en.json BestValue", () => {
    const empty = Array.from(enKeys).filter(k => {
      const v = getNestedValue(en.BestValue, k);
      return typeof v === "string" && v.trim() === "";
    });
    expect(empty, `Empty values in en.json BestValue: ${empty.join(", ")}`).toEqual([]);
  });

  it("no empty values in fr.json BestValue", () => {
    const empty = Array.from(frKeys).filter(k => {
      const v = getNestedValue(fr.BestValue, k);
      return typeof v === "string" && v.trim() === "";
    });
    expect(empty, `Empty values in fr.json BestValue: ${empty.join(", ")}`).toEqual([]);
  });

  it("fr values are not identical to en values (actually translated)", () => {
    const untranslated = Array.from(enKeys).filter(k => {
      const env = getNestedValue(en.BestValue, k);
      const frv = getNestedValue(fr.BestValue, k);
      // Skip keys that are numbers, IC_MSG params like {count}, or very short strings (emojis, symbols)
      if (typeof env !== "string" || typeof frv !== "string") return false;
      if (env.length < 5) return false; // short labels like "LOA:" may stay the same
      return env === frv;
    });
    // Allow some untranslated keys (e.g., numeric/technical terms)
    expect(untranslated.length, `${untranslated.length} keys not translated: ${untranslated.slice(0, 5).join(", ")}`).toBeLessThan(enKeys.size * 0.3);
  });
});

// ─── CheaperAlternatives namespace ───

describe("i18n message catalogs — CheaperAlternatives namespace", () => {
  const enKeys = new Set(collectKeys(en.CheaperAlternatives));
  const frKeys = new Set(collectKeys(fr.CheaperAlternatives));

  it("en.json has CheaperAlternatives namespace", () => {
    expect(en.CheaperAlternatives).toBeDefined();
    expect(typeof en.CheaperAlternatives).toBe("object");
  });

  it("fr.json has CheaperAlternatives namespace", () => {
    expect(fr.CheaperAlternatives).toBeDefined();
    expect(typeof fr.CheaperAlternatives).toBe("object");
  });

  it("fr.json has all keys from en.json CheaperAlternatives", () => {
    const missing = Array.from(enKeys).filter(k => !frKeys.has(k));
    expect(missing, `Missing keys in fr.json CheaperAlternatives: ${missing.join(", ")}`).toEqual([]);
  });

  it("en.json has all keys from fr.json CheaperAlternatives", () => {
    const extra = Array.from(frKeys).filter(k => !enKeys.has(k));
    expect(extra, `Extra keys in fr.json CheaperAlternatives: ${extra.join(", ")}`).toEqual([]);
  });

  it("no empty values in en.json CheaperAlternatives", () => {
    const empty = Array.from(enKeys).filter(k => {
      const v = getNestedValue(en.CheaperAlternatives, k);
      return typeof v === "string" && v.trim() === "";
    });
    expect(empty, `Empty values in en.json CheaperAlternatives: ${empty.join(", ")}`).toEqual([]);
  });

  it("no empty values in fr.json CheaperAlternatives", () => {
    const empty = Array.from(frKeys).filter(k => {
      const v = getNestedValue(fr.CheaperAlternatives, k);
      return typeof v === "string" && v.trim() === "";
    });
    expect(empty, `Empty values in fr.json CheaperAlternatives: ${empty.join(", ")}`).toEqual([]);
  });
});

// ─── SearchIntent namespace ───

describe("i18n message catalogs — SearchIntent namespace", () => {
  const enKeys = new Set(collectKeys(en.SearchIntent));
  const frKeys = new Set(collectKeys(fr.SearchIntent));

  it("en.json has SearchIntent namespace", () => {
    expect(en.SearchIntent).toBeDefined();
    expect(typeof en.SearchIntent).toBe("object");
  });

  it("fr.json has SearchIntent namespace", () => {
    expect(fr.SearchIntent).toBeDefined();
    expect(typeof fr.SearchIntent).toBe("object");
  });

  it("fr.json has all keys from en.json SearchIntent", () => {
    const missing = Array.from(enKeys).filter(k => !frKeys.has(k));
    expect(missing, `Missing keys in fr.json SearchIntent: ${missing.join(", ")}`).toEqual([]);
  });

  it("en.json has all keys from fr.json SearchIntent", () => {
    const extra = Array.from(frKeys).filter(k => !enKeys.has(k));
    expect(extra, `Extra keys in fr.json SearchIntent: ${extra.join(", ")}`).toEqual([]);
  });

  it("no empty values in en.json SearchIntent", () => {
    const empty = Array.from(enKeys).filter(k => {
      const v = getNestedValue(en.SearchIntent, k);
      return typeof v === "string" && v.trim() === "";
    });
    expect(empty, `Empty values in en.json SearchIntent: ${empty.join(", ")}`).toEqual([]);
  });

  it("no empty values in fr.json SearchIntent", () => {
    const empty = Array.from(frKeys).filter(k => {
      const v = getNestedValue(fr.SearchIntent, k);
      return typeof v === "string" && v.trim() === "";
    });
    expect(empty, `Empty values in fr.json SearchIntent: ${empty.join(", ")}`).toEqual([]);
  });
});

// ─── LandingPages namespace ───

describe("i18n message catalogs — LandingPages namespace", () => {
  const enKeys = new Set(collectKeys(en.LandingPages));
  const frKeys = new Set(collectKeys(fr.LandingPages));

  it("en.json has LandingPages namespace", () => {
    expect(en.LandingPages).toBeDefined();
    expect(typeof en.LandingPages).toBe("object");
  });

  it("fr.json has LandingPages namespace", () => {
    expect(fr.LandingPages).toBeDefined();
    expect(typeof fr.LandingPages).toBe("object");
  });

  it("fr.json has all keys from en.json LandingPages", () => {
    const missing = Array.from(enKeys).filter(k => !frKeys.has(k));
    expect(missing, `Missing keys in fr.json LandingPages: ${missing.join(", ")}`).toEqual([]);
  });

  it("en.json has all keys from fr.json LandingPages", () => {
    const extra = Array.from(frKeys).filter(k => !enKeys.has(k));
    expect(extra, `Extra keys in fr.json LandingPages: ${extra.join(", ")}`).toEqual([]);
  });

  it("no empty values in en.json LandingPages", () => {
    const empty = Array.from(enKeys).filter(k => {
      const v = getNestedValue(en.LandingPages, k);
      return typeof v === "string" && v.trim() === "";
    });
    expect(empty, `Empty values in en.json LandingPages: ${empty.join(", ")}`).toEqual([]);
  });

  it("no empty values in fr.json LandingPages", () => {
    const empty = Array.from(frKeys).filter(k => {
      const v = getNestedValue(fr.LandingPages, k);
      return typeof v === "string" && v.trim() === "";
    });
    expect(empty, `Empty values in fr.json LandingPages: ${empty.join(", ")}`).toEqual([]);
  });
});

// ─── Cross-namespace key count summary ───

describe("i18n message catalogs — long-tail namespace summary", () => {
  it("all four long-tail namespaces exist in both locales", () => {
    for (const ns of ["BestValue", "CheaperAlternatives", "SearchIntent", "LandingPages"]) {
      expect((en as any)[ns]).toBeDefined();
      expect((fr as any)[ns]).toBeDefined();
    }
  });

  it("all long-tail namespaces have matching key counts", () => {
    for (const ns of ["BestValue", "CheaperAlternatives", "SearchIntent", "LandingPages"]) {
      const enCount = collectKeys((en as any)[ns]).length;
      const frCount = collectKeys((fr as any)[ns]).length;
      expect(frCount, `${ns}: en has ${enCount} keys, fr has ${frCount}`).toBe(enCount);
    }
  });
});
