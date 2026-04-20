/**
 * Feature Flags Unit Tests
 *
 * Tests assignment determinism, flag fallbacks, env overrides,
 * and query param overrides.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getFlag, getAllFlags, getFlagDefinitions, extractFlagOverrides } from "@/lib/feature-flags/evaluate";
import { flags, type FlagKey } from "@/lib/feature-flags/flags";

describe("Feature Flags", () => {
  // Store original env to restore after tests
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Capture any env vars we might modify
    for (const key of Object.keys(flags)) {
      const envKey = `FEATURE_FLAG_${key.toUpperCase().replace(/\./g, "_")}`;
      originalEnv[envKey] = process.env[envKey];
    }
  });

  afterEach(() => {
    // Restore env vars
    for (const key of Object.keys(flags)) {
      const envKey = `FEATURE_FLAG_${key.toUpperCase().replace(/\./g, "_")}`;
      if (originalEnv[envKey] === undefined) {
        delete process.env[envKey];
      } else {
        process.env[envKey] = originalEnv[envKey];
      }
    }
  });

  // ─── Default value tests ──────────────────────────────────────────

  describe("default values", () => {
    it("returns boolean default for boolean flags", () => {
      expect(getFlag("yachts.monetization_badge")).toBe(false);
      expect(getFlag("favorites.enabled")).toBe(true);
    });

    it("returns variant default for variant flags without userId", () => {
      expect(getFlag("compare.cta_placement")).toBe("sidebar");
      expect(getFlag("newsletter.popup_timing")).toBe("exit_intent");
    });

    it("returns variant default for variant flags with userId", () => {
      // With userId, it should bucket deterministically
      const value = getFlag("compare.cta_placement", { userId: "user-123" });
      expect(["sidebar", "bottom", "modal"]).toContain(value);
    });
  });

  // ─── Determinism tests ────────────────────────────────────────────

  describe("assignment determinism", () => {
    it("same userId always gets same variant", () => {
      const userId = "deterministic-test-user";
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        results.add(getFlag("compare.cta_placement", { userId }));
      }
      expect(results.size).toBe(1);
    });

    it("different users can get different variants", () => {
      const variants = new Set<string>();
      for (let i = 0; i < 100; i++) {
        variants.add(getFlag("compare.cta_placement", { userId: `user-${i}` }));
      }
      // With 100 users and 3 variants, we should see at least 2
      expect(variants.size).toBeGreaterThanOrEqual(2);
    });

    it("variant distribution is reasonably uniform", () => {
      const counts: Record<string, number> = { sidebar: 0, bottom: 0, modal: 0 };
      const totalUsers = 1000;
      for (let i = 0; i < totalUsers; i++) {
        const variant = getFlag("compare.cta_placement", { userId: `dist-user-${i}` });
        counts[variant]++;
      }
      // Each variant should have at least 20% of users (roughly 33% each)
      for (const count of Object.values(counts)) {
        expect(count / totalUsers).toBeGreaterThan(0.2);
      }
    });
  });

  // ─── Environment variable overrides ───────────────────────────────

  describe("environment variable overrides", () => {
    it("env var overrides boolean flag to true", () => {
      process.env.FEATURE_FLAG_YACHTS_MONETIZATION_BADGE = "true";
      expect(getFlag("yachts.monetization_badge")).toBe(true);
    });

    it("env var overrides boolean flag to false", () => {
      process.env.FEATURE_FLAG_FAVORITES_ENABLED = "false";
      expect(getFlag("favorites.enabled")).toBe(false);
    });

    it("env var overrides variant flag", () => {
      process.env.FEATURE_FLAG_COMPARE_CTA_PLACEMENT = "modal";
      expect(getFlag("compare.cta_placement")).toBe("modal");
    });

    it("env var takes precedence over userId bucketing", () => {
      process.env.FEATURE_FLAG_COMPARE_CTA_PLACEMENT = "bottom";
      expect(getFlag("compare.cta_placement", { userId: "user-123" })).toBe("bottom");
    });
  });

  // ─── Query param overrides ────────────────────────────────────────

  describe("query param overrides", () => {
    it("query param overrides when allowOverrides is true", () => {
      const result = getFlag("yachts.monetization_badge", {
        allowOverrides: true,
        overrides: { "yachts.monetization_badge": "true" },
      });
      expect(result).toBe(true);
    });

    it("query param ignored when allowOverrides is false", () => {
      const result = getFlag("yachts.monetization_badge", {
        allowOverrides: false,
        overrides: { "yachts.monetization_badge": "true" },
      });
      expect(result).toBe(false); // default value
    });

    it("query param ignored when allowOverrides is not set", () => {
      const result = getFlag("yachts.monetization_badge", {
        overrides: { "yachts.monetization_badge": "true" },
      });
      expect(result).toBe(false); // default value
    });

    it("invalid variant override is ignored", () => {
      const result = getFlag("compare.cta_placement", {
        allowOverrides: true,
        overrides: { "compare.cta_placement": "invalid_variant" },
      });
      // Falls back to default since invalid variant is ignored
      expect(result).toBe("sidebar");
    });
  });

  // ─── getAllFlags ──────────────────────────────────────────────────

  describe("getAllFlags", () => {
    it("returns all flag keys", () => {
      const allFlags = getAllFlags();
      const flagKeys = Object.keys(flags);
      expect(Object.keys(allFlags)).toHaveLength(flagKeys.length);
      for (const key of flagKeys) {
        expect(allFlags[key as FlagKey]).toBeDefined();
      }
    });
  });

  // ─── getFlagDefinitions ──────────────────────────────────────────

  describe("getFlagDefinitions", () => {
    it("returns definitions with key, type, description", () => {
      const defs = getFlagDefinitions();
      for (const [key, def] of Object.entries(defs)) {
        expect(def.key).toBe(key);
        expect(def.type).toBeDefined();
        expect(def.description).toBeDefined();
        expect(def.defaultValue).toBeDefined();
      }
    });
  });

  // ─── extractFlagOverrides ────────────────────────────────────────

  describe("extractFlagOverrides", () => {
    it("extracts only known flags from searchParams", () => {
      const params = new URLSearchParams();
      params.set("yachts.monetization_badge", "true");
      params.set("unknown.flag", "value");
      params.set("search.ai_summary", "1");

      const overrides = extractFlagOverrides(params);
      expect(overrides).toEqual({
        "yachts.monetization_badge": "true",
        "search.ai_summary": "1",
      });
    });

    it("returns empty object when no matching params", () => {
      const params = new URLSearchParams();
      params.set("foo", "bar");
      expect(extractFlagOverrides(params)).toEqual({});
    });
  });

  // ─── Flag fallback tests ─────────────────────────────────────────

  describe("flag fallbacks", () => {
    it("undefined flag key still returns default (type-safe)", () => {
      // All flags should have a default
      const allFlags = getAllFlags();
      for (const [key, value] of Object.entries(allFlags)) {
        expect(value).toBeDefined();
      }
    });
  });
});
