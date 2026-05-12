import { describe, it, expect } from "vitest";
import { yachtMatchesFilters, findMatchingSearches, describeFilters } from "../lib/saved-search-matcher";

// ─── Test helpers ────────────────────────────────────────────────────
const baseYacht = {
  id: 1,
  manufacturerId: 10,
  rigType: "Sloop",
  keelType: "Fin keel",
  hullMaterial: "GRP",
  lengthOverall: 12.5,
  displacement: 8000,
  draft: 2.1,
  sailArea: 85,
  cabinCount: 3,
  berthCount: 6,
  manufacturerName: "Beneteau",
  modelName: "Oceanis 41",
  useCaseTags: ["bluewater", "cruising"],
  year: 2020,
};

// ─── yachtMatchesFilters ─────────────────────────────────────────────
describe("yachtMatchesFilters", () => {
  it("returns true for empty filters (no restrictions)", () => {
    expect(yachtMatchesFilters(baseYacht, {})).toBe(true);
  });

  it("matches text query against manufacturer name", () => {
    expect(yachtMatchesFilters(baseYacht, { query: "beneteau" })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { query: "Jeanneau" })).toBe(false);
    expect(yachtMatchesFilters(baseYacht, { q: "Oceanis" })).toBe(true);
  });

  it("matches manufacturer ID", () => {
    expect(yachtMatchesFilters(baseYacht, { manufacturerId: 10 })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { manufacturerId: 20 })).toBe(false);
  });

  it("matches rig type (case-insensitive)", () => {
    expect(yachtMatchesFilters(baseYacht, { rigType: "Sloop" })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { rigType: "Ketch" })).toBe(false);
  });

  it("matches keel type", () => {
    expect(yachtMatchesFilters(baseYacht, { keelType: "Fin" })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { keelType: "Full" })).toBe(false);
  });

  it("matches hull material", () => {
    expect(yachtMatchesFilters(baseYacht, { hullMaterial: "GRP" })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { hullMaterial: "Steel" })).toBe(false);
  });

  it("matches length range", () => {
    expect(yachtMatchesFilters(baseYacht, { lengthMin: 10, lengthMax: 15 })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { lengthMin: 13, lengthMax: 20 })).toBe(false);
    expect(yachtMatchesFilters(baseYacht, { lengthMin: 10 })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { lengthMax: 12 })).toBe(false);
  });

  it("matches displacement range", () => {
    expect(yachtMatchesFilters(baseYacht, { displacementMin: 5000, displacementMax: 10000 })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { displacementMin: 9000 })).toBe(false);
  });

  it("matches draft range", () => {
    expect(yachtMatchesFilters(baseYacht, { draftMin: 1.5, draftMax: 2.5 })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { draftMax: 2.0 })).toBe(false);
  });

  it("matches sail area range", () => {
    expect(yachtMatchesFilters(baseYacht, { sailAreaMin: 50, sailAreaMax: 100 })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { sailAreaMax: 80 })).toBe(false);
  });

  it("matches exact cabin count", () => {
    expect(yachtMatchesFilters(baseYacht, { cabinCount: 3 })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { cabinCount: 2 })).toBe(false);
  });

  it("matches exact berth count", () => {
    expect(yachtMatchesFilters(baseYacht, { berthCount: 6 })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { berthCount: 4 })).toBe(false);
  });

  it("matches use case tag", () => {
    expect(yachtMatchesFilters(baseYacht, { useCase: "bluewater" })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { useCase: "racing" })).toBe(false);
  });

  it("matches use case tags array (any match)", () => {
    expect(yachtMatchesFilters(baseYacht, { useCases: ["racing", "cruising"] })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { useCases: ["racing", "daysailer"] })).toBe(false);
  });

  it("matches year range", () => {
    expect(yachtMatchesFilters(baseYacht, { yearMin: 2019, yearMax: 2021 })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { yearMin: 2021 })).toBe(false);
  });

  it("handles string filter values (converted to numbers)", () => {
    expect(yachtMatchesFilters(baseYacht, { lengthMin: "10", lengthMax: "15" })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { cabinCount: "3" })).toBe(true);
  });

  it("handles null yacht values gracefully", () => {
    const yachtWithNulls = {
      ...baseYacht,
      lengthOverall: null,
      displacement: null,
      draft: null,
    };
    expect(yachtMatchesFilters(yachtWithNulls, { lengthMin: 10 })).toBe(false);
    expect(yachtMatchesFilters(yachtWithNulls, { displacementMin: 5000 })).toBe(false);
    expect(yachtMatchesFilters(yachtWithNulls, { rigType: "Sloop" })).toBe(true);
  });

  it("handles empty string filter values (treated as no filter)", () => {
    expect(yachtMatchesFilters(baseYacht, { rigType: "" })).toBe(true);
    expect(yachtMatchesFilters(baseYacht, { keelType: "" })).toBe(true);
  });

  it("combines multiple filters (all must match)", () => {
    expect(yachtMatchesFilters(baseYacht, {
      rigType: "Sloop",
      lengthMin: 10,
      lengthMax: 15,
      hullMaterial: "GRP",
    })).toBe(true);

    expect(yachtMatchesFilters(baseYacht, {
      rigType: "Sloop",
      lengthMin: 10,
      lengthMax: 15,
      hullMaterial: "Steel",
    })).toBe(false);
  });

  it("ignores sort/page/limit params", () => {
    expect(yachtMatchesFilters(baseYacht, { sort: "length", page: 1, limit: 20 })).toBe(true);
  });
});

// ─── findMatchingSearches ────────────────────────────────────────────
describe("findMatchingSearches", () => {
  const searches = [
    { id: 1, searchParams: { rigType: "Sloop" }, alertEnabled: true },
    { id: 2, searchParams: { rigType: "Ketch" }, alertEnabled: true },
    { id: 3, searchParams: { lengthMin: 10, lengthMax: 15 }, alertEnabled: true },
    { id: 4, searchParams: { rigType: "Sloop" }, alertEnabled: false },
    { id: 5, searchParams: { rigType: "Sloop", hullMaterial: "Steel" }, alertEnabled: true },
  ];

  it("returns IDs of searches with alertEnabled that match", () => {
    const result = findMatchingSearches(baseYacht, searches);
    expect(result).toContain(1);
    expect(result).toContain(3);
    expect(result).not.toContain(2);
    expect(result).not.toContain(4);
    expect(result).not.toContain(5);
  });

  it("returns empty array when no matches", () => {
    const result = findMatchingSearches({ ...baseYacht, rigType: "Cat", lengthOverall: 5 }, searches);
    expect(result).toEqual([]);
  });

  it("defaults alertEnabled to true when undefined", () => {
    const searches = [
      { id: 1, searchParams: { rigType: "Sloop" } },
    ];
    expect(findMatchingSearches(baseYacht, searches)).toEqual([1]);
  });
});

// ─── describeFilters ─────────────────────────────────────────────────
describe("describeFilters", () => {
  it("returns empty array for empty filters", () => {
    expect(describeFilters({})).toEqual([]);
  });

  it("describes text query", () => {
    const result = describeFilters({ query: "beneteau" });
    expect(result).toEqual([{ label: "Search", value: "beneteau" }]);
  });

  it("describes length range", () => {
    const result = describeFilters({ lengthMin: 10, lengthMax: 15 });
    expect(result).toEqual([{ label: "Length", value: "10–15m" }]);
  });

  it("describes open-ended ranges", () => {
    const result = describeFilters({ lengthMin: 10 });
    expect(result).toEqual([{ label: "Length", value: "10–anym" }]);
  });

  it("describes categorical filters", () => {
    const result = describeFilters({ rigType: "Sloop", keelType: "Fin keel" });
    expect(result).toContainEqual({ label: "Rig Type", value: "Sloop" });
    expect(result).toContainEqual({ label: "Keel Type", value: "Fin keel" });
  });

  it("describes exact numeric filters", () => {
    const result = describeFilters({ cabinCount: 3, berthCount: 6 });
    expect(result).toContainEqual({ label: "Cabins", value: "3" });
    expect(result).toContainEqual({ label: "Berths", value: "6" });
  });

  it("describes use case", () => {
    const result = describeFilters({ useCase: "bluewater" });
    expect(result).toEqual([{ label: "Use Case", value: "bluewater" }]);
  });

  it("describes year range", () => {
    const result = describeFilters({ yearMin: 2019, yearMax: 2022 });
    expect(result).toEqual([{ label: "Year", value: "2019–2022" }]);
  });
});
