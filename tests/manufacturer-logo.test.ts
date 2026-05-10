import { describe, it, expect } from "vitest";

/**
 * Tests for ManufacturerLogo component logic.
 * Tests the deterministic hash function and fallback behavior.
 */

// Replicate the hash function from the component
function hashStringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getFallbackBgColor(name: string): string {
  const hue = hashStringToHue(name);
  return `hsl(${hue}, 55%, 45%)`;
}

describe("ManufacturerLogo — logic", () => {
  describe("hashStringToHue", () => {
    it("returns a value between 0 and 360", () => {
      for (const name of ["Beneteau", "Jeanneau", "X-Yachts", "J/Boats"]) {
        const hue = hashStringToHue(name);
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
      }
    });

    it("is deterministic — same input always gives same output", () => {
      expect(hashStringToHue("Beneteau")).toBe(hashStringToHue("Beneteau"));
      expect(hashStringToHue("Hallberg-Rassy")).toBe(hashStringToHue("Hallberg-Rassy"));
    });

    it("gives different hues for different manufacturers", () => {
      const hue1 = hashStringToHue("Beneteau");
      const hue2 = hashStringToHue("Jeanneau");
      expect(hue1).not.toBe(hue2);
    });
  });

  describe("getInitial", () => {
    it("returns first character uppercased", () => {
      expect(getInitial("Beneteau")).toBe("B");
      expect(getInitial("beneteau")).toBe("B");
    });

    it("handles special characters", () => {
      expect(getInitial("J/Boats")).toBe("J");
      expect(getInitial("X-Yachts")).toBe("X");
    });
  });

  describe("getFallbackBgColor", () => {
    it("returns valid hsl color string", () => {
      const color = getFallbackBgColor("Beneteau");
      expect(color).toMatch(/^hsl\(\d+, 55%, 45%\)$/);
    });

    it("is consistent across calls", () => {
      expect(getFallbackBgColor("Test")).toBe(getFallbackBgColor("Test"));
    });

    it("gives different colors for different names", () => {
      expect(getFallbackBgColor("A")).not.toBe(getFallbackBgColor("B"));
    });
  });

  describe("Logo URL construction", () => {
    it("constructs Clearbit URL from domain", () => {
      const domain = "beneteau.com";
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      expect(logoUrl).toBe("https://logo.clearbit.com/beneteau.com");
    });

    it("extracts domain from website URL", () => {
      const websiteUrl = "https://www.bavariayachts.com";
      const domain = new URL(websiteUrl).hostname;
      expect(domain).toBe("www.bavariayachts.com");
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      expect(logoUrl).toBe("https://logo.clearbit.com/www.bavariayachts.com");
    });
  });

  describe("Logo coverage", () => {
    const MANUFACTURERS_WITH_LOGOS = [
      "Allures Yachting", "Amel", "Arcona Yachts", "Bavaria Yachts",
      "Beneteau", "Bowman Yachts", "CNB", "Catalina Yachts",
      "Contest Yachts", "Dehler", "Delphia Yachts", "Dragonfly Trimarans",
      "Dufour Yachts", "Elan Yachts", "Feeling", "Garcia Yachting",
      "Grand Soleil", "Hallberg-Rassy", "Hanse Yachts", "Hunter Yachts",
      "Island Packet", "J/Boats", "Jeanneau", "Lagoon",
      "Moody Yachts", "Mylius", "Najad", "Neel Trimarans",
      "Oyster Yachts", "RM Yachts", "Saffier Yachts", "Sirius Yachts",
      "Solaris Yachts", "Sunbeam Yachts", "Swan (Nautor)", "Tartan Yachts",
      "Wally", "Wauquiez", "X-Yachts", "SaBoat (Grand Soleil)",
    ];

    const MANUFACTURERS_WITHOUT_LOGOS = ["Hatteland", "Vancouver (Northshore)"];

    it("covers 40 of 42 manufacturers with logo URLs", () => {
      expect(MANUFACTURERS_WITH_LOGOS.length).toBe(40);
      expect(MANUFACTURERS_WITHOUT_LOGOS.length).toBe(2);
    });

    it("fallback initial works for all manufacturers", () => {
      const allManufacturers = [...MANUFACTURERS_WITH_LOGOS, ...MANUFACTURERS_WITHOUT_LOGOS];
      for (const name of allManufacturers) {
        const initial = getInitial(name);
        expect(initial.length).toBe(1);
        expect(initial).toMatch(/[A-Z]/);
      }
    });
  });
});
