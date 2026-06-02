/**
 * Tests for P21.4: Price Aggregation Pipeline
 */
import { describe, it, expect } from 'vitest';
import { estimatePrice, estimatePrices } from '../lib/price-aggregation/estimated-provider';
import type { PriceCandidate } from '../lib/price-aggregation/types';

// --- Test fixtures ---

const makeCandidate = (overrides: Partial<PriceCandidate> = {}): PriceCandidate => ({
  id: 1,
  slug: 'beneteau-oceanis-40-1',
  modelName: 'Oceanis 40.1',
  manufacturerName: 'Beneteau',
  year: 2022,
  lengthOverall: 12.43,
  displacement: 6400,
  beam: null,
  cabins: 3,
  existingPriceCount: 0,
  ...overrides,
});

// --- Estimated Price Provider Tests ---

describe('estimatePrice', () => {
  it('should estimate new price for a standard yacht', () => {
    const candidate = makeCandidate();
    const result = estimatePrice(candidate, 'new');

    expect(result).not.toBeNull();
    expect(result!.priceMin).toBeGreaterThan(0);
    expect(result!.priceMax).toBeGreaterThan(result!.priceMin);
    expect(result!.currency).toBe('EUR');
    expect(result!.condition).toBe('new');
    expect(result!.confidenceScore).toBeGreaterThan(0);
    expect(result!.confidenceScore).toBeLessThanOrEqual(50);
  });

  it('should estimate used price for a standard yacht', () => {
    const candidate = makeCandidate();
    const result = estimatePrice(candidate, 'used');

    expect(result).not.toBeNull();
    expect(result!.condition).toBe('used');
    // Used price should be lower than new
    const newResult = estimatePrice(candidate, 'new');
    expect(result!.priceMax).toBeLessThan(newResult!.priceMax);
  });

  it('should return null for yachts without length', () => {
    const candidate = makeCandidate({ lengthOverall: null });
    const result = estimatePrice(candidate, 'used');
    expect(result).toBeNull();
  });

  it('should return null for yachts with zero length', () => {
    const candidate = makeCandidate({ lengthOverall: 0 });
    const result = estimatePrice(candidate, 'used');
    expect(result).toBeNull();
  });

  it('should return null for yachts with unreasonable future year', () => {
    const candidate = makeCandidate({ year: 2040 });
    const result = estimatePrice(candidate, 'used');
    expect(result).toBeNull();
  });

  it('should estimate higher prices for premium manufacturers', () => {
    const standardCandidate = makeCandidate({ manufacturerName: 'Bavaria' });
    const premiumCandidate = makeCandidate({
      manufacturerName: 'Halberg-Rassy',
      slug: 'halberg-rassy-40c',
      modelName: 'HR 40C',
    });

    const standardResult = estimatePrice(standardCandidate, 'new');
    const premiumResult = estimatePrice(premiumCandidate, 'new');

    expect(premiumResult!.priceMin).toBeGreaterThan(standardResult!.priceMin);
    expect(premiumResult!.priceMax).toBeGreaterThan(standardResult!.priceMax);
  });

  it('should apply age depreciation for older yachts', () => {
    const newCandidate = makeCandidate({ year: 2025 });
    const oldCandidate = makeCandidate({ year: 2010 });

    const newResult = estimatePrice(newCandidate, 'used');
    const oldResult = estimatePrice(oldCandidate, 'used');

    expect(oldResult!.priceMax).toBeLessThan(newResult!.priceMax);
  });

  it('should give higher used estimates for newer yachts', () => {
    const currentCandidate = makeCandidate({ year: 2024 });
    const oldCandidate = makeCandidate({ year: 2005 });

    const currentResult = estimatePrice(currentCandidate, 'used');
    const oldResult = estimatePrice(oldCandidate, 'used');

    expect(currentResult!.confidenceScore).toBeGreaterThan(oldResult!.confidenceScore);
  });

  it('should handle very large yachts', () => {
    const candidate = makeCandidate({
      lengthOverall: 20,
      displacement: 25000,
      manufacturerName: 'Oyster',
      modelName: '625',
      slug: 'oyster-625',
    });
    const result = estimatePrice(candidate, 'new');

    expect(result).not.toBeNull();
    expect(result!.priceMin).toBeGreaterThan(100000);
  });

  it('should handle small yachts', () => {
    const candidate = makeCandidate({
      lengthOverall: 7,
      displacement: 1500,
      manufacturerName: 'Hunter',
      modelName: '23',
      slug: 'hunter-23',
    });
    const result = estimatePrice(candidate, 'new');

    expect(result).not.toBeNull();
    expect(result!.priceMin).toBeGreaterThan(0);
    expect(result!.priceMax).toBeLessThan(500000);
  });

  it('should handle yachts without displacement data', () => {
    const candidate = makeCandidate({ displacement: null });
    const result = estimatePrice(candidate, 'new');

    expect(result).not.toBeNull();
    // Should use neutral adjustment factor
    expect(result!.priceMin).toBeGreaterThan(0);
  });

  it('should work with all manufacturers including unknown ones', () => {
    const candidate = makeCandidate({ manufacturerName: 'Unknown Brand XYZ' });
    const result = estimatePrice(candidate, 'new');

    expect(result).not.toBeNull();
    expect(result!.priceMin).toBeGreaterThan(0);
  });
});

describe('estimatePrices', () => {
  it('should generate both new and used estimates for each candidate', () => {
    const candidates = [
      makeCandidate({ id: 1 }),
      makeCandidate({ id: 2, modelName: 'Oceanis 35.1', lengthOverall: 10.45 }),
    ];

    const results = estimatePrices(candidates);

    // 2 candidates × 2 conditions = 4 results
    expect(results).toHaveLength(4);
    expect(results.filter(r => r.condition === 'new')).toHaveLength(2);
    expect(results.filter(r => r.condition === 'used')).toHaveLength(2);
  });

  it('should skip candidates without length', () => {
    const candidates = [
      makeCandidate({ id: 1, lengthOverall: null }),
      makeCandidate({ id: 2 }),
    ];

    const results = estimatePrices(candidates);

    // Only candidate 2 should produce results (2 estimates: new + used)
    expect(results).toHaveLength(2);
    expect(results.every(r => r.yachtModelId === 2)).toBe(true);
  });

  it('should set provider to estimated', () => {
    const results = estimatePrices([makeCandidate()]);
    expect(results.every(r => r.provider === 'estimated')).toBe(true);
  });

  it('should set listingCount to 0 for estimates', () => {
    const results = estimatePrices([makeCandidate()]);
    expect(results.every(r => r.listingCount === 0)).toBe(true);
  });
});
