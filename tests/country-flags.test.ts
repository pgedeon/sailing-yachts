import { describe, it, expect } from "vitest";
import { getCountryFlag, COUNTRY_FLAGS } from "../lib/utils/country-flags";

describe("country-flags", () => {
  describe("getCountryFlag", () => {
    it("returns correct flag for France", () => {
      expect(getCountryFlag("France")).toBe("🇫🇷");
    });

    it("returns correct flag for United States", () => {
      expect(getCountryFlag("United States")).toBe("🇺🇸");
    });

    it("returns empty string for null", () => {
      expect(getCountryFlag(null)).toBe("");
    });

    it("returns empty string for unknown country", () => {
      expect(getCountryFlag("Atlantis")).toBe("");
    });

    it("all expected countries have flags", () => {
      const countries = [
        "Austria", "Denmark", "Finland", "France", "Germany",
        "Italy", "Netherlands", "Norway", "Poland", "Slovenia",
        "Sweden", "United Kingdom", "United States",
      ];
      for (const c of countries) {
        expect(COUNTRY_FLAGS[c]).toBeDefined();
        expect(COUNTRY_FLAGS[c]).toBeTruthy();
      }
    });
  });
});
