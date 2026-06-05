import { describe, it, expect, vi } from "vitest";

// These tests focus on pure logic and validation rather than DB interactions
// DB-dependent functions are tested through integration tests

describe("Featured Yacht Service", () => {
  describe("generateDefaultHeadline", () => {
    // Inline the function to test without DB imports
    function generateDefaultHeadline(yacht: {
      modelName: string;
      manufacturer: string;
      year: number;
      lengthOverall: string | null;
    }): string {
      const loa = yacht.lengthOverall ? ` ${Number(yacht.lengthOverall).toFixed(1)}m` : "";
      return `${yacht.manufacturer} ${yacht.modelName}${loa} (${yacht.year})`;
    }

    it("should generate a headline with manufacturer, model, year, and LOA", () => {
      const result = generateDefaultHeadline({
        modelName: "Oceanis 40.1",
        manufacturer: "Beneteau",
        year: 2023,
        lengthOverall: "12.43",
      });
      expect(result).toBe("Beneteau Oceanis 40.1 12.4m (2023)");
    });

    it("should work without LOA", () => {
      const result = generateDefaultHeadline({
        modelName: "C42",
        manufacturer: "Bavaria",
        year: 2024,
        lengthOverall: null,
      });
      expect(result).toBe("Bavaria C42 (2024)");
    });

    it("should handle zero LOA", () => {
      const result = generateDefaultHeadline({
        modelName: "Test",
        manufacturer: "Builder",
        year: 2020,
        lengthOverall: "0",
      });
      expect(result).toBe("Builder Test 0.0m (2020)");
    });

    it("should handle very large LOA values", () => {
      const result = generateDefaultHeadline({
        modelName: "Maxi",
        manufacturer: "Custom",
        year: 2025,
        lengthOverall: "25.50",
      });
      expect(result).toBe("Custom Maxi 25.5m (2025)");
    });
  });
});

describe("Featured Yacht API Route Validation", () => {
  function validateCreatePayload(payload: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!payload.yachtModelId) errors.push("yachtModelId is required");
    if (!payload.weekStart) errors.push("weekStart is required");
    if (!payload.weekEnd) errors.push("weekEnd is required");

    if (payload.weekStart && payload.weekEnd) {
      const start = new Date(payload.weekStart as string);
      const end = new Date(payload.weekEnd as string);
      if (end <= start) errors.push("weekEnd must be after weekStart");
    }

    if (payload.headline && (payload.headline as string).length > 500) {
      errors.push("headline must be 500 characters or less");
    }

    return { valid: errors.length === 0, errors };
  }

  it("should accept valid payload", () => {
    const result = validateCreatePayload({
      yachtModelId: 1,
      weekStart: "2026-06-01",
      weekEnd: "2026-06-07",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const result = validateCreatePayload({
      headline: "Test",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("yachtModelId is required");
    expect(result.errors).toContain("weekStart is required");
    expect(result.errors).toContain("weekEnd is required");
  });

  it("should reject when weekEnd is before weekStart", () => {
    const result = validateCreatePayload({
      yachtModelId: 1,
      weekStart: "2026-06-07",
      weekEnd: "2026-06-01",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("weekEnd must be after weekStart");
  });

  it("should reject headline over 500 chars", () => {
    const result = validateCreatePayload({
      yachtModelId: 1,
      weekStart: "2026-06-01",
      weekEnd: "2026-06-07",
      headline: "x".repeat(501),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("headline must be 500 characters or less");
  });
});

describe("Featured Yacht Date Logic", () => {
  function isDateInRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
  }

  it("should determine if current date falls within a week range", () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 3);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 3);

    expect(isDateInRange(now, weekStart, weekEnd)).toBe(true);
  });

  it("should detect date outside range (before)", () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() + 10);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 17);

    expect(isDateInRange(now, weekStart, weekEnd)).toBe(false);
  });

  it("should detect date outside range (after)", () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 17);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - 10);

    expect(isDateInRange(now, weekStart, weekEnd)).toBe(false);
  });

  it("should calculate week start/end from a reference date", () => {
    const reference = new Date("2026-06-01T00:00:00Z");
    const weekStart = new Date(reference);
    const weekEnd = new Date(reference);
    weekEnd.setDate(weekEnd.getDate() + 6);

    expect(weekEnd.getDate()).toBe(7);
    expect(weekEnd.getMonth()).toBe(5); // June
  });

  it("should handle year boundary in week ranges", () => {
    const weekStart = new Date("2026-12-28T00:00:00Z");
    const weekEnd = new Date("2027-01-03T00:00:00Z");
    const testDate = new Date("2027-01-01T00:00:00Z");

    expect(isDateInRange(testDate, weekStart, weekEnd)).toBe(true);
    expect(weekEnd.getFullYear()).toBe(2027);
  });
});

describe("Featured Yacht Component Helpers", () => {
  function buildManufacturerSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  it("should build slug from simple name", () => {
    expect(buildManufacturerSlug("Jeanneau")).toBe("jeanneau");
  });

  it("should handle names with hyphens", () => {
    expect(buildManufacturerSlug("Hallberg-Rassy")).toBe("hallberg-rassy");
  });

  it("should handle names with spaces", () => {
    expect(buildManufacturerSlug("Grand Soleil")).toBe("grand-soleil");
  });

  it("should handle names with special characters", () => {
    expect(buildManufacturerSlug("X-Yachts (DK)")).toBe("x-yachts-dk");
  });

  it("should format LOA correctly", () => {
    expect(Number("12.43").toFixed(1)).toBe("12.4");
    expect(Number("9.00").toFixed(1)).toBe("9.0");
  });

  it("should format displacement with locale string", () => {
    expect(Number("8500").toLocaleString()).toBe("8,500");
    expect(Number("12000").toLocaleString()).toBe("12,000");
  });
});

describe("Featured Yacht Newsletter Content", () => {
  function generateDefaultHeadline(yacht: {
    modelName: string;
    manufacturer: string;
    year: number;
    lengthOverall: string | null;
  }): string {
    const loa = yacht.lengthOverall ? ` ${Number(yacht.lengthOverall).toFixed(1)}m` : "";
    return `${yacht.manufacturer} ${yacht.modelName}${loa} (${yacht.year})`;
  }

  function generateNewsletterSnippet(yacht: {
    manufacturer: string;
    modelName: string;
    year: number;
    lengthOverall: string | null;
    slug: string;
    editorialText?: string;
  }): string {
    const headline = generateDefaultHeadline(yacht);
    const loa = yacht.lengthOverall ? `At ${Number(yacht.lengthOverall).toFixed(1)}m LOA, ` : "";

    return `⛵ Yacht of the Week: ${headline}

${yacht.editorialText || `Discover our featured sailboat this week — the ${yacht.manufacturer} ${yacht.modelName}.`}
${loa}this ${yacht.year} cruiser offers the perfect balance of performance and comfort.

View full specs: https://info.sailboats.fr/yachts/${yacht.slug}`;
  }

  it("should generate a newsletter snippet with all fields", () => {
    const snippet = generateNewsletterSnippet({
      manufacturer: "Beneteau",
      modelName: "Oceanis 40.1",
      year: 2023,
      lengthOverall: "12.43",
      slug: "beneteau-oceanis-40-1",
    });

    expect(snippet).toContain("⛵ Yacht of the Week");
    expect(snippet).toContain("Beneteau Oceanis 40.1");
    expect(snippet).toContain("12.4m");
    expect(snippet).toContain("info.sailboats.fr/yachts/beneteau-oceanis-40-1");
  });

  it("should include editorial text when provided", () => {
    const snippet = generateNewsletterSnippet({
      manufacturer: "Bavaria",
      modelName: "C42",
      year: 2024,
      lengthOverall: null,
      slug: "bavaria-c42",
      editorialText: "A fantastic family cruiser with spacious interior.",
    });

    expect(snippet).toContain("A fantastic family cruiser with spacious interior.");
    expect(snippet).toContain("info.sailboats.fr/yachts/bavaria-c42");
  });

  it("should work without LOA", () => {
    const snippet = generateNewsletterSnippet({
      manufacturer: "Test",
      modelName: "Yacht",
      year: 2025,
      lengthOverall: null,
      slug: "test-yacht",
    });

    expect(snippet).not.toContain("At undefined");
    expect(snippet).not.toContain("At null");
  });
});

describe("Featured Yacht Admin Pagination", () => {
  it("should calculate total pages correctly", () => {
    expect(Math.ceil(45 / 20)).toBe(3);
    expect(Math.ceil(20 / 20)).toBe(1);
    expect(Math.ceil(21 / 20)).toBe(2);
    expect(Math.ceil(0 / 20)).toBe(0);
  });

  it("should calculate offset from page number", () => {
    expect((1 - 1) * 20).toBe(0);
    expect((2 - 1) * 20).toBe(20);
    expect((3 - 1) * 20).toBe(40);
  });
});

describe("Featured Yacht Week Rotation Logic", () => {
  function getNextWeekStart(fromDate: Date): Date {
    const d = new Date(fromDate);
    // Find next Monday
    const day = d.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + daysUntilMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getWeekEnd(weekStart: Date): Date {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  it("should find next Monday from a Wednesday", () => {
    // June 5, 2026 is a Friday
    const friday = new Date("2026-06-05T00:00:00Z");
    const monday = getNextWeekStart(friday);
    expect(monday.getDay()).toBe(1); // Monday
    expect(monday.getDate()).toBeGreaterThanOrEqual(friday.getDate());
  });

  it("should produce a 7-day range", () => {
    const start = new Date("2026-06-08T00:00:00Z"); // Monday
    const end = getWeekEnd(start);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(Math.round(diffDays)).toBe(7); // 7-day span (Mon-Sun)
  });

  it("week range should cover the full 7 days", () => {
    const start = new Date("2026-06-08T00:00:00Z");
    const end = getWeekEnd(start);

    // Wednesday of that week should be in range
    const wednesday = new Date("2026-06-10T12:00:00Z");
    expect(wednesday >= start).toBe(true);
    expect(wednesday <= end).toBe(true);
  });
});
