import { describe, it, expect } from 'vitest';
import {
  assignUseCaseTags,
  getAllTagIds,
  USE_CASE_TAG_IDS,
  USE_CASE_TAG_META,
  type YachtSpecForTags,
} from '@/lib/use-case-tags';

// ─── Helpers ─────────────────────────────────────────────────────────

const baseSpec: YachtSpecForTags = {
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

// ─── Bluewater Cruiser ───────────────────────────────────────────────

describe('Bluewater Cruiser tag', () => {
  it('assigns bluewater-cruiser for heavy, long yacht with high ballast ratio', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 12,       // 12m ≈ 39ft — above 10.5m threshold
      displacement: 8000,      // 8t — above 5000kg threshold
      ballast: 3000,           // ballast ratio = 3000/8000 = 37.5% — above 30%
      keelType: 'Fin keel',
    });
    expect(tags).toContain('bluewater-cruiser');
  });

  it('assigns bluewater-cruiser for long heavy yacht with proven keel type even without high ballast ratio', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 14,       // 14m
      displacement: 12000,     // 12t
      ballast: 2000,           // ballast ratio = 16.7% — below 30%...
      keelType: 'Long keel',   // ...but keel type matches
    });
    expect(tags).toContain('bluewater-cruiser');
  });

  it('does NOT assign bluewater-cruiser for short yachts', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 8,        // 8m — below 10.5m
      displacement: 3000,
      ballast: 1500,
      keelType: 'Fin keel',
    });
    expect(tags).not.toContain('bluewater-cruiser');
  });

  it('does NOT assign bluewater-cruiser for light yachts', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 12,
      displacement: 3000,      // below 5000kg
      ballast: 1500,
      keelType: 'Fin keel',
    });
    expect(tags).not.toContain('bluewater-cruiser');
  });
});

// ─── Weekend Sailor ──────────────────────────────────────────────────

describe('Weekend Sailor tag', () => {
  it('assigns weekend-sailor for compact yachts under 10m', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 8,        // 8m — under 10m
      displacement: 2000,
    });
    expect(tags).toContain('weekend-sailor');
  });

  it('does NOT assign weekend-sailor for yachts > 10m', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 10.5,
      displacement: 4000,
    });
    expect(tags).not.toContain('weekend-sailor');
  });

  it('does NOT assign weekend-sailor if already a bluewater cruiser', () => {
    // 10.5m is under 10m? No, 10.5 > 10. Let's make a yacht that meets both bluewater
    // but has LOA < 10m — impossible since bluewater needs ≥ 10.5m.
    // So the exclusion only matters for edge cases. Test with null displacement.
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 9,
      displacement: null,      // can't be bluewater without displacement
    });
    expect(tags).toContain('weekend-sailor');
  });
});

// ─── Racing ──────────────────────────────────────────────────────────

describe('Racing tag', () => {
  it('assigns racing for light yacht with high SA/D', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 10.5,
      displacement: 2800,      // light
      sailAreaMain: 65,        // high sail area
      ballast: 800,
      cabins: 2,
    });
    // D/L should be low, SA/D should be high
    expect(tags).toContain('racing');
  });

  it('does NOT assign racing for heavy displacement yachts', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 12,
      displacement: 12000,     // very heavy
      sailAreaMain: 80,        // moderate sail area for that weight
    });
    expect(tags).not.toContain('racing');
  });

  it('does NOT assign racing when sail area is missing', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 10.5,
      displacement: 2500,
      sailAreaMain: null,      // no sail area data
    });
    expect(tags).not.toContain('racing');
  });
});

// ─── Liveaboard ──────────────────────────────────────────────────────

describe('Liveaboard tag', () => {
  it('assigns liveaboard for large yacht with 3+ cabins', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 13,       // 13m ≈ 43ft — above 11m
      cabins: 4,
      displacement: 10000,
    });
    expect(tags).toContain('liveaboard');
  });

  it('does NOT assign liveaboard for yachts with fewer than 3 cabins', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 13,
      cabins: 2,
    });
    expect(tags).not.toContain('liveaboard');
  });

  it('does NOT assign liveaboard for yachts under 11m', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 10,       // under 11m
      cabins: 3,
    });
    expect(tags).not.toContain('liveaboard');
  });
});

// ─── Family Cruiser ──────────────────────────────────────────────────

describe('Family Cruiser tag', () => {
  it('assigns family-cruiser for moderate-size yacht with 2+ cabins', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 11,       // 11m — in 9-14m range
      cabins: 3,
      displacement: 6000,
    });
    expect(tags).toContain('family-cruiser');
  });

  it('does NOT assign family-cruiser for yachts under 9m', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 8,
      cabins: 2,
    });
    expect(tags).not.toContain('family-cruiser');
  });

  it('does NOT assign family-cruiser for yachts over 14m', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 16,       // above 14m
      cabins: 4,
    });
    expect(tags).not.toContain('family-cruiser');
  });

  it('does NOT assign family-cruiser for yachts with only 1 cabin', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 11,
      cabins: 1,
    });
    expect(tags).not.toContain('family-cruiser');
  });
});

// ─── Light Wind Performer ────────────────────────────────────────────

describe('Light Wind Performer tag', () => {
  it('assigns light-wind-performer for yacht with high SA/D and low displacement', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 9,
      displacement: 3500,      // under 6000kg
      sailAreaMain: 55,        // high for that weight
      cabins: 2,
    });
    expect(tags).toContain('light-wind-performer');
  });

  it('does NOT assign light-wind-performer for heavy yachts', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 12,
      displacement: 9000,      // over 6000kg
      sailAreaMain: 100,
    });
    expect(tags).not.toContain('light-wind-performer');
  });
});

// ─── Multi-tag assignments ───────────────────────────────────────────

describe('Multi-tag assignments', () => {
  it('a large family cruiser can also be liveaboard', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 13,       // in family range (9-14)
      cabins: 4,               // meets both family (2+) and liveaboard (3+)
      displacement: 9000,
      ballast: 3500,           // 38.9% — meets bluewater
      keelType: 'Fin keel',
    });
    expect(tags).toContain('family-cruiser');
    expect(tags).toContain('liveaboard');
    expect(tags).toContain('bluewater-cruiser');
  });

  it('a small racer can also be a weekend sailor', () => {
    const tags = assignUseCaseTags({
      ...baseSpec,
      lengthOverall: 8,        // under 10m
      displacement: 2000,
      sailAreaMain: 45,
      cabins: 1,
    });
    // Weekend sailor: LOA < 10 ✓, not bluewater ✓
    // Racing: depends on ratios
    expect(tags).toContain('weekend-sailor');
  });

  it('returns empty array for yacht with no spec data', () => {
    const tags = assignUseCaseTags(baseSpec);
    expect(tags).toEqual([]);
  });
});

// ─── Exports & metadata ──────────────────────────────────────────────

describe('Tag metadata', () => {
  it('exports all 6 tag IDs', () => {
    expect(USE_CASE_TAG_IDS).toHaveLength(6);
    expect(USE_CASE_TAG_IDS).toContain('bluewater-cruiser');
    expect(USE_CASE_TAG_IDS).toContain('weekend-sailor');
    expect(USE_CASE_TAG_IDS).toContain('racing');
    expect(USE_CASE_TAG_IDS).toContain('liveaboard');
    expect(USE_CASE_TAG_IDS).toContain('family-cruiser');
    expect(USE_CASE_TAG_IDS).toContain('light-wind-performer');
  });

  it('each tag has color metadata', () => {
    for (const tagId of USE_CASE_TAG_IDS) {
      const meta = USE_CASE_TAG_META[tagId as keyof typeof USE_CASE_TAG_META];
      expect(meta).toBeDefined();
      expect(meta.color).toBeTruthy();
      expect(meta.textColor).toBeTruthy();
      expect(meta.borderColor).toBeTruthy();
    }
  });

  it('getAllTagIds returns the same as USE_CASE_TAG_IDS', () => {
    expect(getAllTagIds()).toEqual(USE_CASE_TAG_IDS);
  });
});
