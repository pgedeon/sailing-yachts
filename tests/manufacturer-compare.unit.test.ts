import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils/slugify";

describe("Manufacturer Compare — unit tests", () => {
  it("slugifies manufacturer names for URLs", () => {
    expect(slugify("Jeanneau")).toBe("jeanneau");
    expect(slugify("Hallberg-Rassy")).toBe("hallberg-rassy");
    expect(slugify("Bavaria Yachts")).toBe("bavaria-yachts");
  });

  it("slugify strips accented characters (JS \\w limitation)", () => {
    expect(slugify("Bénéteau")).toBe("bnteau");
    expect(slugify("  Bavaria Yachts  ")).toBe("bavaria-yachts");
  });

  it("slugify handles empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("manufacturer comparison URL format is correct", () => {
    const slugA = slugify("Jeanneau");
    const slugB = slugify("Hallberg-Rassy");
    const path = `/compare-manufacturers/${slugA}-vs-${slugB}`;
    expect(path).toBe("/compare-manufacturers/jeanneau-vs-hallberg-rassy");
    expect(path).toContain("-vs-");
  });

  it("parses comparison slug correctly", () => {
    const rawParam = "jeanneau-vs-hallberg-rassy";
    const idx = rawParam.indexOf("-vs-");
    const slugA = rawParam.substring(0, idx);
    const slugB = rawParam.substring(idx + 4);
    expect(slugA).toBe("jeanneau");
    expect(slugB).toBe("hallberg-rassy");
  });

  it("handles edge case: both manufacturers with hyphens", () => {
    const slugA = slugify("Hallberg-Rassy");
    const slugB = slugify("X-Yachts");
    const rawParam = `${slugA}-vs-${slugB}`;
    const idx = rawParam.indexOf("-vs-");
    const parsedA = rawParam.substring(0, idx);
    const parsedB = rawParam.substring(idx + 4);
    expect(parsedA).toBe("hallberg-rassy");
    expect(parsedB).toBe("x-yachts");
  });
});
