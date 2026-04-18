import { describe, it, expect } from "vitest";
import {
  normalizeModelName,
  normalizeManufacturerName,
  similarity,
  findDuplicates,
  isExactDuplicate,
  type ExistingRecord,
} from "../lib/duplicate-detection";

describe("normalizeModelName", () => {
  it("lowercases and trims", () => {
    expect(normalizeModelName("  Oceanis 34.1  ")).toBe("oceanis 341");
  });

  it("removes dots between numbers", () => {
    expect(normalizeModelName("Oceanis 34.1")).toBe("oceanis 341");
    expect(normalizeModelName("First 27.7")).toBe("first 277");
  });

  it("removes special characters", () => {
    expect(normalizeModelName("J/99")).toBe("j99");
    expect(normalizeModelName("Sun Odyssey 490 (NEW)")).toBe("sun odyssey 490 new");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeModelName("Sun  Odyssey   490")).toBe("sun odyssey 490");
  });
});

describe("normalizeManufacturerName", () => {
  it("lowercases and trims", () => {
    expect(normalizeManufacturerName("Beneteau")).toBe("beneteau");
  });

  it("removes common suffixes", () => {
    expect(normalizeManufacturerName("Bavaria Yachts")).toBe("bavaria");
    expect(normalizeManufacturerName("Catalina Boats")).toBe("catalina");
    expect(normalizeManufacturerName("Hallberg-Rassy Marine")).toBe("hallbergrassy");
  });

  it("handles names without suffixes", () => {
    expect(normalizeManufacturerName("Beneteau")).toBe("beneteau");
    expect(normalizeManufacturerName("Jeanneau")).toBe("jeanneau");
  });
});

describe("similarity", () => {
  it("returns 1 for identical strings", () => {
    expect(similarity("Oceanis 34.1", "Oceanis 34.1")).toBe(1);
  });

  it("returns 1 for normalized equivalents", () => {
    // After normalization both become "oceanis 341"
    expect(similarity("Oceanis 34.1", "Oceanis 341")).toBe(1);
  });

  it("catches near-duplicates", () => {
    const score = similarity("Oceanis 34.1", "Oceanis 341");
    expect(score).toBeGreaterThanOrEqual(0.9);
  });

  it("returns 0 for completely different strings", () => {
    expect(similarity("abc", "xyz")).toBeLessThan(0.5);
  });

  it("handles empty strings", () => {
    expect(similarity("", "")).toBe(1);
    expect(similarity("", "test")).toBe(0);
  });
});

describe("findDuplicates", () => {
  const existingRecords: ExistingRecord[] = [
    { id: 1, modelName: "Oceanis 34.1", manufacturer: "Beneteau", year: 2023 },
    { id: 2, modelName: "Sun Odyssey 440", manufacturer: "Jeanneau", year: 2023 },
    { id: 3, modelName: "Cruiser 34", manufacturer: "Bavaria Yachts", year: 2022 },
    { id: 4, modelName: "First 36", manufacturer: "Beneteau", year: 2024 },
    { id: 5, modelName: "Oceanis 30.1", manufacturer: "Beneteau", year: 2022 },
  ];

  it("finds exact duplicates", () => {
    const matches = findDuplicates("Oceanis 34.1", "Beneteau", 2023, existingRecords);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].confidence).toBe("exact");
    expect(matches[0].existingId).toBe(1);
  });

  it("finds near-duplicates with different formatting", () => {
    const matches = findDuplicates("Oceanis 341", "Beneteau", 2023, existingRecords);
    expect(matches.length).toBeGreaterThan(0);
    // Should be at least high confidence (normalized names match)
    expect(matches[0].score).toBeGreaterThanOrEqual(0.9);
  });

  it("finds same model different year", () => {
    const matches = findDuplicates("Oceanis 34.1", "Beneteau", 2024, existingRecords);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].confidence).toBe("high");
  });

  it("returns empty for truly new models", () => {
    const matches = findDuplicates("Brand New 5000", "NewBuilder", 2024, existingRecords);
    expect(matches).toHaveLength(0);
  });

  it("matches manufacturer with suffix variation", () => {
    // "Bavaria Yachts" in existing, "Bavaria" in new
    const matches = findDuplicates("Cruiser 34", "Bavaria", 2022, existingRecords);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].existingId).toBe(3);
  });

  it("does not match across different manufacturers", () => {
    const matches = findDuplicates("Oceanis 34.1", "Jeanneau", 2023, existingRecords);
    expect(matches).toHaveLength(0);
  });

  it("sorts by confidence (highest first)", () => {
    const matches = findDuplicates("Oceanis 34", "Beneteau", 2023, existingRecords);
    if (matches.length > 1) {
      const confOrder = { exact: 4, high: 3, medium: 2, low: 1, none: 0 };
      for (let i = 1; i < matches.length; i++) {
        expect(confOrder[matches[i - 1].confidence]).toBeGreaterThanOrEqual(
          confOrder[matches[i].confidence],
        );
      }
    }
  });
});

describe("isExactDuplicate", () => {
  const existingRecords: ExistingRecord[] = [
    { id: 1, modelName: "Oceanis 34.1", manufacturer: "Beneteau", year: 2023 },
    { id: 2, modelName: "Sun Odyssey 440", manufacturer: "Jeanneau", year: 2023 },
  ];

  it("finds exact match", () => {
    const result = isExactDuplicate("Oceanis 34.1", "Beneteau", 2023, existingRecords);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
  });

  it("finds match despite dot normalization", () => {
    const result = isExactDuplicate("Oceanis 341", "Beneteau", 2023, existingRecords);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
  });

  it("finds match despite manufacturer suffix", () => {
    const result = isExactDuplicate("Oceanis 34.1", "Beneteau Yachts", 2023, existingRecords);
    expect(result).not.toBeNull();
  });

  it("returns null for no match", () => {
    const result = isExactDuplicate("Nonexistent 999", "Nobody", 2024, existingRecords);
    expect(result).toBeNull();
  });

  it("returns null for same model different year", () => {
    const result = isExactDuplicate("Oceanis 34.1", "Beneteau", 2024, existingRecords);
    expect(result).toBeNull();
  });
});
