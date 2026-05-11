import { describe, it, expect } from 'vitest';
import {
  scoreYacht,
  rankYachts,
  type FinderAnswers,
  type YachtForScoring,
  WIZARD_STEPS,
} from '@/lib/yacht-finder';

// ─── Fixtures ────────────────────────────────────────────────────────

const baseYacht: YachtForScoring = {
  id: 1,
  lengthOverall: 11,
  beam: 3.6,
  draft: 1.8,
  displacement: 6500,
  ballast: 2200,
  sailAreaMain: 55,
  cabins: 3,
  berths: 6,
  rigType: 'Sloop',
  keelType: 'Fin keel',
  hullMaterial: 'Fiberglass',
  useCaseTags: ['bluewater-cruiser', 'family-cruiser'],
};

const coastalAnswers: FinderAnswers = {
  experience: 'intermediate',
  intendedUse: 'coastal',
  crewSize: 'couple',
  budget: 'mid-range',
  priorities: ['comfort', 'safety'],
};

const racingAnswers: FinderAnswers = {
  experience: 'advanced',
  intendedUse: 'racing',
  crewSize: 'small-group',
  budget: 'no-limit',
  priorities: ['speed'],
};

const bluewaterAnswers: FinderAnswers = {
  experience: 'advanced',
  intendedUse: 'bluewater',
  crewSize: 'couple',
  budget: 'premium',
  priorities: ['safety', 'comfort'],
};

// ─── Score function ──────────────────────────────────────────────────

describe('scoreYacht', () => {
  it('returns a score between 0 and 100', () => {
    const { score } = scoreYacht(baseYacht, coastalAnswers);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns a breakdown with all four dimensions', () => {
    const { breakdown } = scoreYacht(baseYacht, coastalAnswers);
    expect(breakdown.useMatch).toBeTypeOf('number');
    expect(breakdown.sizeFit).toBeTypeOf('number');
    expect(breakdown.experienceFit).toBeTypeOf('number');
    expect(breakdown.priorityMatch).toBeTypeOf('number');
  });

  it('breakdown components sum to total score', () => {
    const { score, breakdown } = scoreYacht(baseYacht, coastalAnswers);
    expect(breakdown.useMatch + breakdown.sizeFit + breakdown.experienceFit + breakdown.priorityMatch).toBe(score);
  });
});

// ─── Use Match scoring ───────────────────────────────────────────────

describe('Use Match scoring', () => {
  it('gives higher score when yacht tags match intended use', () => {
    // baseYacht has bluewater-cruiser tag
    const bluewaterScore = scoreYacht(baseYacht, bluewaterAnswers);
    const racingScore = scoreYacht(baseYacht, racingAnswers);
    expect(bluewaterScore.breakdown.useMatch).toBeGreaterThan(racingScore.breakdown.useMatch);
  });

  it('gives full use-match points when tag matches exactly', () => {
    const { breakdown } = scoreYacht(baseYacht, bluewaterAnswers);
    expect(breakdown.useMatch).toBe(30); // full weight
  });

  it('gives partial use-match for coastal with family-cruiser tag', () => {
    // coastal prefers family-cruiser and weekend-sailor; baseYacht has family-cruiser
    const { breakdown } = scoreYacht(baseYacht, coastalAnswers);
    expect(breakdown.useMatch).toBeGreaterThanOrEqual(18); // partial match
  });
});

// ─── Size Fit scoring ────────────────────────────────────────────────

describe('Size Fit scoring', () => {
  it('gives full size points when yacht fits crew perfectly', () => {
    // couple → idealMinLOA: 8, idealMaxLOA: 13, minBerths: 2
    // baseYacht: LOA=11, berths=6 → perfect LOA + berths
    const { breakdown } = scoreYacht(baseYacht, { ...coastalAnswers, crewSize: 'couple' });
    expect(breakdown.sizeFit).toBe(25); // 15 (LOA) + 10 (berths)
  });

  it('penalizes yachts too small for the crew', () => {
    const smallYacht: YachtForScoring = {
      ...baseYacht,
      lengthOverall: 6,
      berths: 1,
    };
    const { breakdown } = scoreYacht(smallYacht, { ...coastalAnswers, crewSize: 'large-group' });
    // large-group wants LOA 11-18, berths 5+
    expect(breakdown.sizeFit).toBeLessThan(15);
  });

  it('penalizes yachts too large for solo sailor', () => {
    const bigYacht: YachtForScoring = {
      ...baseYacht,
      lengthOverall: 16,
      berths: 6,
    };
    const { breakdown } = scoreYacht(bigYacht, { ...coastalAnswers, crewSize: 'solo' });
    // solo wants 6-11m
    expect(breakdown.sizeFit).toBeLessThan(20);
  });
});

// ─── Experience Fit scoring ──────────────────────────────────────────

describe('Experience Fit scoring', () => {
  it('beginners prefer sloop rigs on smaller boats', () => {
    const beginnerAnswers: FinderAnswers = { ...coastalAnswers, experience: 'beginner' };
    const sloop = scoreYacht({ ...baseYacht, rigType: 'Sloop', lengthOverall: 9 }, beginnerAnswers);
    const ketch = scoreYacht({ ...baseYacht, rigType: 'Ketch', lengthOverall: 15 }, beginnerAnswers);
    expect(sloop.breakdown.experienceFit).toBeGreaterThan(ketch.breakdown.experienceFit);
  });

  it('advanced sailors score well on larger boats', () => {
    const advancedAnswers: FinderAnswers = { ...coastalAnswers, experience: 'advanced' };
    const { breakdown } = scoreYacht({ ...baseYacht, lengthOverall: 14, rigType: 'Ketch' }, advancedAnswers);
    expect(breakdown.experienceFit).toBeGreaterThanOrEqual(15);
  });
});

// ─── Priority scoring ────────────────────────────────────────────────

describe('Priority Match scoring', () => {
  it('speed priority favors light displacement yachts', () => {
    const lightYacht: YachtForScoring = {
      ...baseYacht,
      displacement: 2500,
      sailAreaMain: 50,
      useCaseTags: ['racing'],
    };
    const heavyYacht: YachtForScoring = {
      ...baseYacht,
      displacement: 12000,
      sailAreaMain: 80,
      useCaseTags: ['bluewater-cruiser'],
    };
    const lightScore = scoreYacht(lightYacht, { ...racingAnswers, priorities: ['speed'] });
    const heavyScore = scoreYacht(heavyYacht, { ...racingAnswers, priorities: ['speed'] });
    expect(lightScore.breakdown.priorityMatch).toBeGreaterThan(heavyScore.breakdown.priorityMatch);
  });

  it('comfort priority favors yachts with more cabins', () => {
    const comfyYacht: YachtForScoring = { ...baseYacht, cabins: 4, useCaseTags: ['liveaboard'] };
    const basicYacht: YachtForScoring = { ...baseYacht, cabins: 1, useCaseTags: [] };
    const comfy = scoreYacht(comfyYacht, { ...coastalAnswers, priorities: ['comfort'] });
    const basic = scoreYacht(basicYacht, { ...coastalAnswers, priorities: ['comfort'] });
    expect(comfy.breakdown.priorityMatch).toBeGreaterThan(basic.breakdown.priorityMatch);
  });

  it('safety priority favors high ballast ratio', () => {
    const safeYacht: YachtForScoring = { ...baseYacht, ballast: 3500, displacement: 8000, useCaseTags: ['bluewater-cruiser'] };
    const riskyYacht: YachtForScoring = { ...baseYacht, ballast: 1000, displacement: 8000, useCaseTags: [] };
    const safe = scoreYacht(safeYacht, { ...coastalAnswers, priorities: ['safety'] });
    const risky = scoreYacht(riskyYacht, { ...coastalAnswers, priorities: ['safety'] });
    expect(safe.breakdown.priorityMatch).toBeGreaterThan(risky.breakdown.priorityMatch);
  });

  it('value priority favors smaller simpler yachts', () => {
    const smallSloop: YachtForScoring = { ...baseYacht, lengthOverall: 9, rigType: 'Sloop' };
    const bigKetch: YachtForScoring = { ...baseYacht, lengthOverall: 15, rigType: 'Ketch' };
    const small = scoreYacht(smallSloop, { ...coastalAnswers, priorities: ['value'] });
    const big = scoreYacht(bigKetch, { ...coastalAnswers, priorities: ['value'] });
    expect(small.breakdown.priorityMatch).toBeGreaterThan(big.breakdown.priorityMatch);
  });
});

// ─── rankYachts ──────────────────────────────────────────────────────

describe('rankYachts', () => {
  it('sorts by score descending', () => {
    const yachts: YachtForScoring[] = [
      { ...baseYacht, id: 1, displacement: 12000, useCaseTags: ['bluewater-cruiser'] },
      { ...baseYacht, id: 2, displacement: 2500, useCaseTags: ['racing'], sailAreaMain: 60 },
      { ...baseYacht, id: 3, displacement: 6500, useCaseTags: ['family-cruiser'] },
    ];

    const ranked = rankYachts(yachts, racingAnswers);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it('filters out yachts scoring below 20', () => {
    const { score } = scoreYacht({ ...baseYacht, useCaseTags: [] }, racingAnswers);
    // Even bad matches should still score some points, but let's verify filtering works
    const ranked = rankYachts([baseYacht], racingAnswers);
    for (const y of ranked) {
      expect(y.score).toBeGreaterThanOrEqual(20);
    }
  });

  it('returns scored yachts with breakdown', () => {
    const ranked = rankYachts([baseYacht], coastalAnswers);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].scoreBreakdown).toBeDefined();
    expect(ranked[0].scoreBreakdown.useMatch).toBeTypeOf('number');
  });

  it('handles empty yacht list', () => {
    const ranked = rankYachts([], coastalAnswers);
    expect(ranked).toEqual([]);
  });

  it('handles yachts with null specs gracefully', () => {
    const nullYacht: YachtForScoring = {
      ...baseYacht,
      lengthOverall: null,
      displacement: null,
      ballast: null,
      sailAreaMain: null,
      cabins: null,
      berths: null,
      useCaseTags: [],
    };
    const ranked = rankYachts([nullYacht], coastalAnswers);
    // Should still produce a score (low, but no crash)
    expect(ranked.length).toBeLessThanOrEqual(1);
    if (ranked.length > 0) {
      expect(ranked[0].score).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── Wizard Steps ────────────────────────────────────────────────────

describe('Wizard Steps', () => {
  it('defines 5 steps', () => {
    expect(WIZARD_STEPS).toHaveLength(5);
  });

  it('steps have correct IDs', () => {
    const ids = WIZARD_STEPS.map(s => s.id);
    expect(ids).toEqual(['experience', 'intendedUse', 'crewSize', 'budget', 'priorities']);
  });

  it('each step has a titleKey', () => {
    for (const step of WIZARD_STEPS) {
      expect(step.titleKey).toBeTruthy();
    }
  });
});
