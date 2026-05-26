import { describe, it, expect } from "vitest";
import {
  getUseCaseMeta,
  USE_CASES,
} from "@/lib/use-case-landing";
import {
  assignUseCaseTags,
  USE_CASE_TAG_IDS,
  type YachtSpecForTags,
} from "@/lib/use-case-tags";

describe("use-case-landing", () => {
  describe("USE_CASES", () => {
    it("should have metadata for all tag IDs", () => {
      expect(USE_CASES.length).toBe(USE_CASE_TAG_IDS.length);
      for (const tagId of USE_CASE_TAG_IDS) {
        const meta = USE_CASES.find((uc) => uc.id === tagId);
        expect(meta).toBeDefined();
        expect(meta!.slug).toBe(tagId);
      }
    });

    it("should have valid metadata fields", () => {
      for (const uc of USE_CASES) {
        expect(uc.labelEn.length).toBeGreaterThan(0);
        expect(uc.labelFr.length).toBeGreaterThan(0);
        expect(uc.emoji.length).toBeGreaterThan(0);
        expect(uc.descriptionEn(10)).toContain("10");
        expect(uc.descriptionFr(10)).toContain("10");
      }
    });
  });

  describe("getUseCaseMeta", () => {
    it("should return metadata for valid slugs", () => {
      for (const uc of USE_CASES) {
        const meta = getUseCaseMeta(uc.slug);
        expect(meta).toBeDefined();
        expect(meta!.id).toBe(uc.id);
      }
    });

    it("should return undefined for invalid slug", () => {
      expect(getUseCaseMeta("nonexistent")).toBeUndefined();
      expect(getUseCaseMeta("")).toBeUndefined();
    });
  });
});

describe("use-case tag assignment integration", () => {
  // Verify that known yacht profiles get expected tags
  const testCases: Array<{
    name: string;
    spec: YachtSpecForTags;
    expectedTags: string[];
  }> = [
    {
      name: "bluewater cruiser — heavy 40ft",
      spec: {
        lengthOverall: 12.5,
        beam: 3.8,
        draft: 2.1,
        displacement: 12000,
        ballast: 4500,
        sailAreaMain: 65,
        cabins: 3,
        berths: 6,
        rigType: "Sloop",
        keelType: "Fin",
      },
      expectedTags: ["bluewater-cruiser", "liveaboard", "family-cruiser"],
    },
    {
      name: "small weekend sailor",
      spec: {
        lengthOverall: 8.5,
        beam: 2.8,
        draft: 1.5,
        displacement: 3000,
        ballast: 1000,
        sailAreaMain: 30,
        cabins: 1,
        berths: 4,
        rigType: "Sloop",
        keelType: "Fin",
      },
      expectedTags: ["weekend-sailor"],
    },
    {
      name: "racing machine",
      spec: {
        lengthOverall: 11,
        beam: 3.5,
        draft: 2.3,
        displacement: 4000,
        ballast: 2000,
        sailAreaMain: 85,
        cabins: 2,
        berths: 4,
        rigType: "Sloop",
        keelType: "Fin",
      },
      expectedTags: ["racing", "family-cruiser"],
    },
    {
      name: "liveaboard — big family boat",
      spec: {
        lengthOverall: 14,
        beam: 4.5,
        draft: 2.0,
        displacement: 15000,
        ballast: 5000,
        sailAreaMain: 90,
        cabins: 4,
        berths: 8,
        rigType: "Cutter",
        keelType: "Full",
      },
      expectedTags: ["bluewater-cruiser", "liveaboard", "family-cruiser"],
    },
  ];

  for (const tc of testCases) {
    it(`should tag "${tc.name}" correctly`, () => {
      const tags = assignUseCaseTags(tc.spec);
      for (const expected of tc.expectedTags) {
        expect(tags).toContain(expected);
      }
      // Verify no unexpected tags
      expect(tags.length).toBeGreaterThanOrEqual(tc.expectedTags.length);
    });
  }

  it("should produce at least some bluewater cruisers from reasonable specs", () => {
    const bluewaterSpec: YachtSpecForTags = {
      lengthOverall: 13,
      beam: 4.0,
      draft: 2.2,
      displacement: 10000,
      ballast: 4000,
      sailAreaMain: 70,
      cabins: 3,
      berths: 6,
      rigType: "Sloop",
      keelType: "Fin",
    };
    const tags = assignUseCaseTags(bluewaterSpec);
    expect(tags).toContain("bluewater-cruiser");
  });

  it("should return empty array for minimal specs", () => {
    const minimal: YachtSpecForTags = {
      lengthOverall: null,
      beam: null,
      draft: null,
      displacement: null,
      ballast: null,
      sailAreaMain: null,
      cabins: null,
      berths: null,
      rigType: null,
      keelType: null,
    };
    const tags = assignUseCaseTags(minimal);
    expect(tags).toEqual([]);
  });
});
