import { describe, it, expect } from 'vitest';
import { scoreSimilarity, rankSimilarYachts, type YachtForSimilarity } from '@/lib/similarity-score';

// ─── Fixtures ────────────────────────────────────────────────────────

const makeYacht = (overrides: Partial<YachtForSimilarity> & { id: number }): YachtForSimilarity => ({
  modelName: `Yacht ${overrides.id}`,
  slug: `yacht-${overrides.id}`,
  manufacturer: 'TestBuilder',
  year: 2020,
  lengthOverall: '11.0',
  beam: '3.6',
  draft: '1.8',
  displacement: '6500',
  ballast: '2200',
  sailAreaMain: '55',
  rigType: 'Sloop',
  keelType: 'Fin',
  hullMaterial: 'FG',
  cabins: 3,
  berths: 6,
  ...overrides,
});

const SOURCE = makeYacht({ id: 1 });

// ─── Similarity scoring ──────────────────────────────────────────────

describe('scoreSimilarity', () => {
  it('gives high score to a near-identical yacht', () => {
    const candidate = makeYacht({ id: 2, modelName: 'Twin' });
    const { score, factors } = scoreSimilarity(SOURCE, candidate);

    expect(score).toBeGreaterThanOrEqual(70);
    // Should have 5 factors
    expect(factors).toHaveLength(5);
    // Each factor should have required fields
    for (const f of factors) {
      expect(f).toHaveProperty('key');
      expect(f).toHaveProperty('score');
      expect(f).toHaveProperty('max');
      expect(f).toHaveProperty('detail');
      expect(f.score).toBeGreaterThanOrEqual(0);
      expect(f.score).toBeLessThanOrEqual(f.max);
    }
  });

  it('gives low score to a very different yacht', () => {
    const candidate = makeYacht({
      id: 99,
      lengthOverall: '6.0',
      beam: '2.2',
      draft: '0.8',
      displacement: '1800',
      ballast: '500',
      sailAreaMain: '25',
      rigType: 'Catboat',
      keelType: 'Centerboard',
      cabins: 1,
      berths: 2,
    });
    const { score } = scoreSimilarity(SOURCE, candidate);

    expect(score).toBeLessThan(50);
  });

  it('scores LOA proximity correctly', () => {
    const veryClose = makeYacht({ id: 10, lengthOverall: '11.2' });
    const far = makeYacht({ id: 11, lengthOverall: '16.0' });

    const closeScore = scoreSimilarity(SOURCE, veryClose);
    const farScore = scoreSimilarity(SOURCE, far);

    const closeLoa = closeScore.factors.find(f => f.key === 'loa')!;
    const farLoa = farScore.factors.find(f => f.key === 'loa')!;

    expect(closeLoa.score).toBeGreaterThan(farLoa.score);
  });

  it('handles missing LOA gracefully', () => {
    const candidate = makeYacht({ id: 20, lengthOverall: null });
    const { factors } = scoreSimilarity(SOURCE, candidate);

    const loa = factors.find(f => f.key === 'loa')!;
    expect(loa.score).toBeLessThanOrEqual(loa.max);
    expect(loa.score).toBeGreaterThanOrEqual(0);
  });

  it('handles all-null spec candidate', () => {
    const candidate: YachtForSimilarity = {
      id: 30,
      modelName: 'Empty',
      slug: 'empty',
      manufacturer: null,
      year: 2020,
      lengthOverall: null,
      beam: null,
      draft: null,
      displacement: null,
      ballast: null,
      sailAreaMain: null,
      rigType: null,
      keelType: null,
      hullMaterial: null,
      cabins: null,
      berths: null,
    };

    const { score, factors } = scoreSimilarity(SOURCE, candidate);
    // Should still return a valid result
    expect(score).toBeGreaterThanOrEqual(0);
    expect(factors).toHaveLength(5);
  });

  it('rewards matching rig and keel types', () => {
    const sameRigKeel = makeYacht({ id: 40, rigType: 'Sloop', keelType: 'Fin' });
    const diffRigKeel = makeYacht({ id: 41, rigType: 'Ketch', keelType: 'Long' });

    const sameScore = scoreSimilarity(SOURCE, sameRigKeel);
    const diffScore = scoreSimilarity(SOURCE, diffRigKeel);

    const sameRk = sameScore.factors.find(f => f.key === 'rigKeel')!;
    const diffRk = diffScore.factors.find(f => f.key === 'rigKeel')!;

    expect(sameRk.score).toBeGreaterThan(diffRk.score);
  });

  it('rewards use-case tag overlap', () => {
    // SOURCE has LOA 11, disp 6500, ballast 2200 (likely bluewater, family, liveaboard)
    // Create candidate with similar specs → should share tags
    const similar = makeYacht({ id: 50 });
    const different = makeYacht({ id: 51, lengthOverall: '7.0', displacement: '2000', ballast: '400', sailAreaMain: '20', cabins: 1 });

    const similarScore = scoreSimilarity(SOURCE, similar);
    const diffScore = scoreSimilarity(SOURCE, different);

    const similarUse = similarScore.factors.find(f => f.key === 'useCase')!;
    const diffUse = diffScore.factors.find(f => f.key === 'useCase')!;

    expect(similarUse.score).toBeGreaterThanOrEqual(diffUse.score);
  });

  it('penalizes D/L ratio mismatch', () => {
    // SOURCE: D/L ≈ 6500/1016 / (11.0/30.54)^3 ≈ ~270
    // Similar D/L: displacement 7000
    // Very different D/L: displacement 2000
    const similarDL = makeYacht({ id: 60, displacement: '7000' });
    const diffDL = makeYacht({ id: 61, displacement: '2000', sailAreaMain: '35' });

    const simScore = scoreSimilarity(SOURCE, similarDL);
    const diffScore = scoreSimilarity(SOURCE, diffDL);

    const simDL = simScore.factors.find(f => f.key === 'dlRatio')!;
    const diffDl = diffScore.factors.find(f => f.key === 'dlRatio')!;

    expect(simDL.score).toBeGreaterThan(diffDl.score);
  });

  it('scores same price tier higher', () => {
    // SOURCE: LOA 11 → 'mid' tier
    const sameTier = makeYacht({ id: 70, lengthOverall: '12.0' }); // mid
    const diffTier = makeYacht({ id: 71, lengthOverall: '17.0' }); // premium

    const sameScore = scoreSimilarity(SOURCE, sameTier);
    const diffScore = scoreSimilarity(SOURCE, diffTier);

    const sameP = sameScore.factors.find(f => f.key === 'priceTier')!;
    const diffP = diffScore.factors.find(f => f.key === 'priceTier')!;

    expect(sameP.score).toBeGreaterThan(diffP.score);
  });
});

// ─── Ranking ─────────────────────────────────────────────────────────

describe('rankSimilarYachts', () => {
  it('excludes source yacht from results', () => {
    const candidates = [SOURCE, makeYacht({ id: 2 })];
    const results = rankSimilarYachts(SOURCE, candidates);

    expect(results.every(r => r.yacht.id !== SOURCE.id)).toBe(true);
  });

  it('filters out low-scoring candidates', () => {
    // Very small yacht should score low
    const poor = makeYacht({
      id: 90,
      lengthOverall: '5.0',
      displacement: '800',
      ballast: '100',
      sailAreaMain: '12',
      rigType: 'Catboat',
      keelType: 'Centerboard',
      cabins: 0,
      berths: 0,
    });
    const candidates = [poor];
    const results = rankSimilarYachts(SOURCE, candidates);

    // Might be below threshold
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(15);
    }
  });

  it('returns results sorted by score descending', () => {
    const candidates = [
      makeYacht({ id: 100, lengthOverall: '16.0', displacement: '12000' }),
      makeYacht({ id: 101, lengthOverall: '11.2', displacement: '6800' }),
      makeYacht({ id: 102, lengthOverall: '11.5', displacement: '7100', rigType: 'Sloop', keelType: 'Fin' }),
    ];

    const results = rankSimilarYachts(SOURCE, candidates);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('limits to 6 results', () => {
    const candidates = Array.from({ length: 20 }, (_, i) =>
      makeYacht({ id: 200 + i, lengthOverall: (10 + Math.random() * 3).toFixed(1) })
    );

    const results = rankSimilarYachts(SOURCE, candidates);
    expect(results.length).toBeLessThanOrEqual(6);
  });

  it('includes factor breakdown in results', () => {
    const candidates = [makeYacht({ id: 300 })];
    const results = rankSimilarYachts(SOURCE, candidates);

    if (results.length > 0) {
      expect(results[0].factors).toBeDefined();
      expect(results[0].factors.length).toBe(5);
    }
  });
});
