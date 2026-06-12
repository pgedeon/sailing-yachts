import { describe, it, expect } from "vitest";
import type { ManufacturerSummary } from "@/lib/manufacturers";

// Extract the sorting/filtering logic as pure functions for testing
// (These mirror the logic in ManufacturerListingClient)

type SortKey = "name" | "yachtCount" | "foundedYear";
type SortOrder = "asc" | "desc";

// P26.1: Tier priority for sorting
const TIER_PRIORITY: Record<string, number> = { premium: 0, verified: 1, free: 2 };
function tierPriority(tier: string | null): number {
  return TIER_PRIORITY[tier ?? "free"] ?? 2;
}

function filterByCountry(
  manufacturers: ManufacturerSummary[],
  country: string
): ManufacturerSummary[] {
  if (country === "all") return manufacturers;
  return manufacturers.filter((m) => m.country === country);
}

function sortManufacturers(
  manufacturers: ManufacturerSummary[],
  sortKey: SortKey,
  sortOrder: SortOrder
): ManufacturerSummary[] {
  return [...manufacturers].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "yachtCount":
        cmp = a.yachtCount - b.yachtCount;
        break;
      case "foundedYear": {
        const aYear = a.foundedYear ?? 9999;
        const bYear = b.foundedYear ?? 9999;
        cmp = aYear - bYear;
        break;
      }
    }
    return sortOrder === "asc" ? cmp : -cmp;
  });
}

function getUniqueCountries(manufacturers: ManufacturerSummary[]): string[] {
  const set = new Set<string>();
  for (const m of manufacturers) {
    if (m.country) set.add(m.country);
  }
  return Array.from(set).sort();
}

function getDescription(
  m: ManufacturerSummary,
  locale: string
): string | null {
  if (locale === "fr" && m.descriptionFr) return m.descriptionFr;
  return m.description ?? null;
}

const MOCK: ManufacturerSummary[] = [
  {
    id: 1,
    name: "Beneteau",
    slug: "beneteau",
    country: "France",
    foundedYear: 1884,
    description: "French sailing yacht manufacturer",
    descriptionFr: "Constructeur français",
    yachtCount: 12,
    tier: "premium",
  },
  {
    id: 2,
    name: "Hanse Yachts",
    slug: "hanse-yachts",
    country: "Germany",
    foundedYear: 1990,
    description: "German yacht builder",
    descriptionFr: null,
    yachtCount: 8,
    tier: "free",
  },
  {
    id: 3,
    name: "Jeanneau",
    slug: "jeanneau",
    country: "France",
    foundedYear: 1957,
    description: "Another French builder",
    descriptionFr: "Un autre constructeur",
    yachtCount: 15,
    tier: "verified",
  },
  {
    id: 4,
    name: "X-Yachts",
    slug: "x-yachts",
    country: "Denmark",
    foundedYear: 1979,
    description: null,
    descriptionFr: null,
    yachtCount: 5,
    tier: "free",
  },
];

describe("Manufacturer listing — filter logic", () => {
  it("returns all manufacturers when country is 'all'", () => {
    const result = filterByCountry(MOCK, "all");
    expect(result).toHaveLength(4);
  });

  it("filters to a single country", () => {
    const result = filterByCountry(MOCK, "France");
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.country === "France")).toBe(true);
    expect(result.map((m) => m.name)).toEqual(["Beneteau", "Jeanneau"]);
  });

  it("returns empty array for non-existent country", () => {
    const result = filterByCountry(MOCK, "Japan");
    expect(result).toHaveLength(0);
  });
});

describe("Manufacturer listing — sort logic", () => {
  it("sorts by name ascending (default)", () => {
    const result = sortManufacturers(MOCK, "name", "asc");
    expect(result.map((m) => m.name)).toEqual([
      "Beneteau",
      "Hanse Yachts",
      "Jeanneau",
      "X-Yachts",
    ]);
  });

  it("sorts by name descending", () => {
    const result = sortManufacturers(MOCK, "name", "desc");
    expect(result[0].name).toBe("X-Yachts");
    expect(result[3].name).toBe("Beneteau");
  });

  it("sorts by yachtCount descending (highest first)", () => {
    const result = sortManufacturers(MOCK, "yachtCount", "desc");
    expect(result[0].name).toBe("Jeanneau"); // 15
    expect(result[1].name).toBe("Beneteau"); // 12
    expect(result[2].name).toBe("Hanse Yachts"); // 8
    expect(result[3].name).toBe("X-Yachts"); // 5
  });

  it("sorts by yachtCount ascending (lowest first)", () => {
    const result = sortManufacturers(MOCK, "yachtCount", "asc");
    expect(result[0].name).toBe("X-Yachts"); // 5
    expect(result[3].name).toBe("Jeanneau"); // 15
  });

  it("sorts by foundedYear ascending (oldest first)", () => {
    const result = sortManufacturers(MOCK, "foundedYear", "asc");
    expect(result[0].name).toBe("Beneteau"); // 1884
    expect(result[1].name).toBe("Jeanneau"); // 1957
    expect(result[2].name).toBe("X-Yachts"); // 1979
    expect(result[3].name).toBe("Hanse Yachts"); // 1990
  });

  it("sorts by foundedYear descending (newest first)", () => {
    const result = sortManufacturers(MOCK, "foundedYear", "desc");
    expect(result[0].name).toBe("Hanse Yachts"); // 1990
    expect(result[3].name).toBe("Beneteau"); // 1884
  });

  it("handles null foundedYear as 9999 (sorted last in asc)", () => {
    const withNull: ManufacturerSummary[] = [
      { ...MOCK[0], foundedYear: null },
      { ...MOCK[1] },
    ];
    const result = sortManufacturers(withNull, "foundedYear", "asc");
    expect(result[0].name).toBe("Hanse Yachts"); // 1990
    expect(result[1].name).toBe("Beneteau"); // null → 9999
  });
});

describe("Manufacturer listing — country extraction", () => {
  it("extracts unique countries sorted alphabetically", () => {
    const countries = getUniqueCountries(MOCK);
    expect(countries).toEqual(["Denmark", "France", "Germany"]);
  });

  it("excludes null countries", () => {
    const data: ManufacturerSummary[] = [
      { ...MOCK[0], country: null },
      { ...MOCK[1] },
    ];
    const countries = getUniqueCountries(data);
    expect(countries).toEqual(["Germany"]);
  });
});

describe("Manufacturer listing — description locale logic", () => {
  it("returns French description when locale is fr and descriptionFr exists", () => {
    expect(getDescription(MOCK[0], "fr")).toBe("Constructeur français");
  });

  it("falls back to English description when locale is fr but descriptionFr is null", () => {
    expect(getDescription(MOCK[1], "fr")).toBe("German yacht builder");
  });

  it("returns English description for en locale", () => {
    expect(getDescription(MOCK[0], "en")).toBe("French sailing yacht manufacturer");
  });

  it("returns null when both descriptions are null", () => {
    expect(getDescription(MOCK[3], "en")).toBeNull();
    expect(getDescription(MOCK[3], "fr")).toBeNull();
  });
});

describe("Manufacturer listing — combined filter + sort", () => {
  it("filters then sorts", () => {
    const filtered = filterByCountry(MOCK, "France");
    const sorted = sortManufacturers(filtered, "yachtCount", "desc");
    expect(sorted).toHaveLength(2);
    expect(sorted[0].name).toBe("Jeanneau"); // 15
    expect(sorted[1].name).toBe("Beneteau"); // 12
  });

  it("filtering to empty then sorting returns empty", () => {
    const filtered = filterByCountry(MOCK, "Japan");
    const sorted = sortManufacturers(filtered, "name", "asc");
    expect(sorted).toHaveLength(0);
  });
});

// P26.1: Tier-based sorting tests
describe("Manufacturer listing — tier priority sorting (P26.1)", () => {
  it("sorts premium manufacturers before verified and free", () => {
    const sorted = [...MOCK].sort((a, b) => {
      const tierDiff = tierPriority(a.tier) - tierPriority(b.tier);
      if (tierDiff !== 0) return tierDiff;
      return a.name.localeCompare(b.name);
    });
    // Beneteau (premium) first
    expect(sorted[0].name).toBe("Beneteau");
    expect(sorted[0].tier).toBe("premium");
    // Jeanneau (verified) second
    expect(sorted[1].name).toBe("Jeanneau");
    expect(sorted[1].tier).toBe("verified");
    // Free tier after
    expect(sorted[2].tier).toBe("free");
    expect(sorted[3].tier).toBe("free");
  });

  it("sorts verified before free but after premium", () => {
    const data: ManufacturerSummary[] = [
      { ...MOCK[1], tier: "free" },
      { ...MOCK[3], tier: "free" },
      { ...MOCK[0], tier: "verified" },
    ];
    const sorted = [...data].sort((a, b) => {
      const tierDiff = tierPriority(a.tier) - tierPriority(b.tier);
      if (tierDiff !== 0) return tierDiff;
      return a.name.localeCompare(b.name);
    });
    expect(sorted[0].tier).toBe("verified");
    expect(sorted[1].tier).toBe("free");
    expect(sorted[2].tier).toBe("free");
  });

  it("preserves alphabetical order within same tier", () => {
    const data: ManufacturerSummary[] = [
      { ...MOCK[1], tier: "free" },
      { ...MOCK[3], tier: "free" },
    ];
    const sorted = [...data].sort((a, b) => {
      const tierDiff = tierPriority(a.tier) - tierPriority(b.tier);
      if (tierDiff !== 0) return tierDiff;
      return a.name.localeCompare(b.name);
    });
    expect(sorted[0].name).toBe("Hanse Yachts");
    expect(sorted[1].name).toBe("X-Yachts");
  });

  it("treats null tier as free", () => {
    expect(tierPriority(null)).toBe(2);
    expect(tierPriority(undefined as any)).toBe(2);
    expect(tierPriority("free")).toBe(2);
  });

  it("premium has highest priority (lowest number)", () => {
    expect(tierPriority("premium")).toBeLessThan(tierPriority("verified"));
    expect(tierPriority("verified")).toBeLessThan(tierPriority("free"));
  });

  it("handles unknown tier as free", () => {
    expect(tierPriority("unknown")).toBe(2);
  });
});
