import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db pool — use vi.hoisted to avoid initialization order issues
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  pool: { query: mockQuery },
}));

import {
  translateWithVocabulary,
  generateFrenchYachtDescription,
  translateManufacturerDescription,
  translateArticleContent,
} from "@/lib/translation-service";

// ─── Vocabulary Translation Tests ────────────────────────────────────

describe("translateWithVocabulary", () => {
  it("translates common nautical terms", () => {
    expect(translateWithVocabulary("sailing yacht")).toContain("voilier");
    expect(translateWithVocabulary("fin keel")).toContain("quille à bulbe");
    expect(translateWithVocabulary("fiberglass")).toContain("fibre de verre");
  });

  it("preserves capitalization", () => {
    const result = translateWithVocabulary("Sailing Yacht");
    expect(result).toContain("Voilier");
  });

  it("translates multiple terms in a sentence", () => {
    const result = translateWithVocabulary(
      "This sailing yacht features a fin keel and fiberglass hull."
    );
    expect(result).toContain("voilier");
    expect(result).toContain("quille à bulbe");
    expect(result).toContain("fibre de verre");
    expect(result).toContain("coque");
  });

  it("handles mixed content correctly", () => {
    const result = translateWithVocabulary("The Beneteau Oceanis 40.1");
    expect(result).toContain("Beneteau");
    expect(result).toContain("Oceanis");
    expect(result).toContain("40.1");
  });

  it("returns original text if no matches", () => {
    expect(translateWithVocabulary("Hello world")).toBe("Hello world");
  });

  it("handles empty string", () => {
    expect(translateWithVocabulary("")).toBe("");
  });

  it("prefers longer matches over shorter", () => {
    const result = translateWithVocabulary("fin keel");
    expect(result).toBe("quille à bulbe");
  });

  it("translates performance and comfort terms", () => {
    expect(translateWithVocabulary("performance")).toBe("performance");
    expect(translateWithVocabulary("comfort")).toBe("confort");
    expect(translateWithVocabulary("safety")).toBe("sécurité");
  });

  it("translates sailing type terms", () => {
    expect(translateWithVocabulary("offshore")).toBe("au large");
    expect(translateWithVocabulary("coastal")).toBe("côtier");
    expect(translateWithVocabulary("racing")).toBe("course");
    expect(translateWithVocabulary("cruising")).toBe("croisière");
  });
});

// ─── French Yacht Description Generation Tests ───────────────────────

describe("generateFrenchYachtDescription", () => {
  it("generates description from English template", () => {
    const result = generateFrenchYachtDescription(
      {
        manufacturer: "Beneteau",
        modelName: "Oceanis 40.1",
        year: 2023,
        lengthOverall: 12.43,
        beam: 4.18,
        draft: 2.15,
        displacement: 8600,
        cabins: 3,
        berths: 6,
        keelType: "Fin keel",
        hullMaterial: "Fiberglass",
        rigType: "Sloop",
        engineHp: 45,
      },
      "The Beneteau Oceanis 40.1 is a sailing yacht designed for cruising."
    );
    expect(result).toContain("Beneteau");
    expect(result).toContain("Oceanis 40.1");
    expect(result).toContain("voilier");
    expect(result).toBeTruthy();
  });

  it("generates from specs when no English description", () => {
    const result = generateFrenchYachtDescription(
      {
        manufacturer: "Jeanneau",
        modelName: "Sun Odyssey 440",
        year: 2022,
        lengthOverall: 13.22,
        beam: 4.29,
        draft: 2.24,
        displacement: 10200,
        cabins: 3,
        berths: 8,
        keelType: "Wing keel",
        hullMaterial: "Fiberglass",
        rigType: "Sloop",
        engineHp: 54,
      },
      null
    );
    expect(result).toContain("Jeanneau");
    expect(result).toContain("Sun Odyssey 440");
    expect(result).toContain("voilier");
    expect(result).toContain("maître-bau");
    expect(result).toContain("tirant d'eau");
    expect(result).toContain("cabines");
    expect(result).toContain("chevaux");
  });

  it("handles minimal specs gracefully", () => {
    const result = generateFrenchYachtDescription(
      {
        manufacturer: "Test",
        modelName: "Basic",
        year: 2020,
        lengthOverall: null,
        beam: null,
        draft: null,
        displacement: null,
        cabins: null,
        berths: null,
        keelType: null,
        hullMaterial: null,
        rigType: null,
        engineHp: null,
      },
      null
    );
    expect(result).toContain("Test");
    expect(result).toContain("Basic");
    expect(result).toContain("voilier");
  });

  it("handles numeric string values", () => {
    const result = generateFrenchYachtDescription(
      {
        manufacturer: "Test",
        modelName: "StringSpec",
        year: 2023,
        lengthOverall: "12.43" as unknown as number,
        beam: null,
        draft: null,
        displacement: null,
        cabins: "3" as unknown as number,
        berths: null,
        keelType: null,
        hullMaterial: null,
        rigType: null,
        engineHp: null,
      },
      null
    );
    expect(result).toContain("longueur hors tout");
  });
});

// ─── Manufacturer Description Translation Tests ──────────────────────

describe("translateManufacturerDescription", () => {
  it("translates manufacturer description with vocabulary", () => {
    const result = translateManufacturerDescription(
      "Beneteau",
      "Beneteau is a leading sailing yacht manufacturer from France.",
      "France",
      1884
    );
    expect(result).toContain("Beneteau");
    expect(result).toContain("voilier");
  });

  it("generates basic description when no English desc", () => {
    const result = translateManufacturerDescription(
      "Beneteau",
      null,
      "France",
      1884
    );
    expect(result).toContain("Beneteau");
    expect(result).toContain("constructeur");
    expect(result).toContain("1884");
  });

  it("handles null country and founded year", () => {
    const result = translateManufacturerDescription(
      "Test Manufacturer",
      null,
      null,
      null
    );
    expect(result).toContain("Test Manufacturer");
    expect(result).toContain("constructeur");
  });
});

// ─── Article Content Translation Tests ───────────────────────────────

describe("translateArticleContent", () => {
  it("translates article title and content", () => {
    const result = translateArticleContent(
      "How to Choose Your First Sailing Yacht",
      "Choosing your first sailing yacht involves considering comfort, safety, and performance.",
      "A guide for beginners looking for their first sailboat."
    );
    expect(result.titleFr.toLowerCase()).toContain("voilier");
    expect(result.contentFr).toContain("confort");
    expect(result.contentFr).toContain("sécurité");
    expect(result.contentFr).toContain("performance");
    expect(result.excerptFr).toContain("voilier");
  });

  it("handles null content and excerpt", () => {
    const result = translateArticleContent("Test Title", null, null);
    expect(result.titleFr).toBeTruthy();
    expect(result.contentFr).toBeNull();
    expect(result.excerptFr).toBeNull();
  });
});

// ─── Hash Function Tests ─────────────────────────────────────────────

describe("hashText", () => {
  function hashText(text: string): string {
    const { createHash } = require("crypto");
    return createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
  }

  it("produces consistent SHA-256 hashes", () => {
    const hash1 = hashText("sailing yacht");
    const hash2 = hashText("sailing yacht");
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("is case-insensitive", () => {
    expect(hashText("Sailing Yacht")).toBe(hashText("sailing yacht"));
  });

  it("trims whitespace", () => {
    expect(hashText("  sailing yacht  ")).toBe(hashText("sailing yacht"));
  });
});

// ─── Integration Tests (with mocked DB) ──────────────────────────────

describe("Translation service DB operations", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("lookupTranslationMemory returns null when no match", async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const { lookupTranslationMemory } = await import("@/lib/translation-service");
    const result = await lookupTranslationMemory("test text");
    expect(result).toBeNull();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("lookupTranslationMemory returns match and increments count", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ translated_text: "texte de test", match_count: 5 }] })
      .mockResolvedValueOnce({ rows: [] });
    const { lookupTranslationMemory } = await import("@/lib/translation-service");
    const result = await lookupTranslationMemory("test text");
    expect(result).toBe("texte de test");
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("addToTranslationMemory inserts or updates", async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const { addToTranslationMemory } = await import("@/lib/translation-service");
    await addToTranslationMemory("test", "test FR", "nautical");
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0][0]).toContain("INSERT INTO translation_memory");
  });
});
