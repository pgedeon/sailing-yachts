/**
 * P21.4: Estimated Price Provider
 *
 * Generates estimated prices based on yacht specifications.
 * Uses known market rates per length range, adjusted for age and manufacturer.
 *
 * This is the primary provider since external listing sites block automated access.
 * Estimates are conservative and clearly marked with lower confidence scores.
 */

import type { PriceCandidate, PriceProviderResult, PriceCondition } from './types';

// Market price reference data (EUR, based on 2024-2025 market data)
// Key: length range (LOA in meters) → base price per meter for new yachts
const PRICE_PER_METER: Array<{ minLen: number; maxLen: number; newMinPerM: number; newMaxPerM: number }> = [
  { minLen: 0, maxLen: 8, newMinPerM: 8000, newMaxPerM: 14000 },      // Under 27ft
  { minLen: 8, maxLen: 10, newMinPerM: 10000, newMaxPerM: 18000 },    // 27-33ft
  { minLen: 10, maxLen: 12, newMinPerM: 14000, newMaxPerM: 24000 },   // 33-40ft
  { minLen: 12, maxLen: 14, newMinPerM: 18000, newMaxPerM: 30000 },   // 40-46ft
  { minLen: 14, maxLen: 16, newMinPerM: 24000, newMaxPerM: 38000 },   // 46-52ft
  { minLen: 16, maxLen: 18, newMinPerM: 30000, newMaxPerM: 48000 },   // 52-59ft
  { minLen: 18, maxLen: 30, newMinPerM: 38000, newMaxPerM: 60000 },   // 59ft+
];

// Manufacturer premium multipliers (1.0 = average)
const MANUFACTURER_PREMIUM: Record<string, { min: number; max: number }> = {
  // Premium brands
  'halberg-rassy': { min: 1.6, max: 2.0 },
  'swan': { min: 2.5, max: 3.5 },
  'oyo': { min: 1.8, max: 2.2 },
  'amels': { min: 3.0, max: 5.0 },
  'contest': { min: 1.5, max: 1.8 },
  'x-yachts': { min: 1.4, max: 1.7 },
  'grand-soleil': { min: 1.3, max: 1.6 },
  'dehler': { min: 1.2, max: 1.5 },
  'elans': { min: 1.0, max: 1.2 },
  // Mainstream brands
  'beneteau': { min: 0.9, max: 1.1 },
  'jeanneau': { min: 0.85, max: 1.05 },
  'bavaria': { min: 0.75, max: 0.95 },
  'hanse': { min: 0.8, max: 1.0 },
  'lagoon': { min: 1.0, max: 1.3 },
  'leopard': { min: 1.0, max: 1.2 },
  // Value brands
  'hunter': { min: 0.7, max: 0.9 },
  'macgregor': { min: 0.5, max: 0.7 },
};

// Age depreciation factors (multiplier on new price)
function getAgeDepreciation(year: number, currentYear: number = new Date().getFullYear()): number {
  const age = currentYear - year;
  if (age <= 0) return 1.0;  // Current year model or newer
  if (age <= 2) return 0.85; // 1-2 years: 15% depreciation
  if (age <= 5) return 0.70; // 3-5 years: 30% depreciation
  if (age <= 10) return 0.55; // 6-10 years: 45% depreciation
  if (age <= 15) return 0.40; // 11-15 years: 60% depreciation
  if (age <= 20) return 0.30; // 16-20 years: 70% depreciation
  return 0.20;                // 20+ years: 80% depreciation
}

// Displacement-based adjustment
// Heavier yachts for their length tend to be more expensive (cruiser vs racer)
function getDisplacementAdjustment(lengthM: number, displacementKg: number | null): number {
  if (!displacementKg || displacementKg <= 0) return 1.0;

  // Typical D/L ratio: heavier = higher price
  const dlRatio = (displacementKg / 1000) / Math.pow(lengthM * 0.3048 * 3.281 / 10, 3);
  if (dlRatio > 300) return 1.15;  // Heavy displacement cruiser
  if (dlRatio > 200) return 1.05;  // Medium displacement
  if (dlRatio < 100) return 0.90;  // Light/racing - slightly less expensive
  return 1.0;
}

function getBasePricePerMeter(lengthM: number): { minPerM: number; maxPerM: number } {
  for (const tier of PRICE_PER_METER) {
    if (lengthM >= tier.minLen && lengthM < tier.maxLen) {
      return { minPerM: tier.newMinPerM, maxPerM: tier.newMaxPerM };
    }
  }
  // Fallback for very large yachts
  const lastTier = PRICE_PER_METER[PRICE_PER_METER.length - 1];
  return { minPerM: lastTier.newMinPerM, maxPerM: lastTier.newMaxPerM };
}

function getManufacturerMultiplier(manufacturerName: string): { min: number; max: number } {
  const key = manufacturerName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  if (MANUFACTURER_PREMIUM[key]) return MANUFACTURER_PREMIUM[key];

  // Check partial matches
  for (const [k, v] of Object.entries(MANUFACTURER_PREMIUM)) {
    if (key.includes(k) || k.includes(key)) return v;
  }

  return { min: 0.9, max: 1.1 }; // Default average
}

/**
 * Estimate price for a yacht based on its specifications
 */
export function estimatePrice(
  candidate: PriceCandidate,
  condition: PriceCondition = 'used'
): Omit<PriceProviderResult, 'provider' | 'fetchedAt' | 'listingCount'> | null {
  const lengthM = candidate.lengthOverall;
  if (!lengthM || lengthM <= 0) return null;

  const currentYear = new Date().getFullYear();
  const age = currentYear - candidate.year;
  if (age < -5) return null; // Skip if year is unreasonably in the future

  // Get base price per meter for this length
  const { minPerM, maxPerM } = getBasePricePerMeter(lengthM);

  // Calculate base new price range
  const baseNewMin = lengthM * minPerM;
  const baseNewMax = lengthM * maxPerM;

  // Apply manufacturer premium
  const manufMult = getManufacturerMultiplier(candidate.manufacturerName);
  const adjustedNewMin = baseNewMin * manufMult.min;
  const adjustedNewMax = baseNewMax * manufMult.max;

  // Apply displacement adjustment
  const dispAdj = getDisplacementAdjustment(lengthM, candidate.displacement);
  const newMin = Math.round(adjustedNewMin * dispAdj);
  const newMax = Math.round(adjustedNewMax * dispAdj);

  if (condition === 'new') {
    const ageFactor = age <= 0 ? 1.0 : 0.95; // Slight discount for "new old stock"
    return {
      yachtSlug: candidate.slug,
      yachtModelId: candidate.id,
      modelName: candidate.modelName,
      manufacturerName: candidate.manufacturerName,
      year: candidate.year,
      priceMin: Math.round(newMin * ageFactor),
      priceMax: Math.round(newMax * ageFactor),
      currency: 'EUR',
      condition: 'new',
      sourceUrl: null,
      confidenceScore: age <= 2 ? 45 : 30, // Lower confidence for older "new" estimates
    };
  }

  // Used price: apply depreciation
  const depreciation = getAgeDepreciation(candidate.year, currentYear);
  const usedMin = Math.round(newMin * depreciation * 0.85); // 15% spread
  const usedMax = Math.round(newMax * depreciation * 1.0);

  return {
    yachtSlug: candidate.slug,
    yachtModelId: candidate.id,
    modelName: candidate.modelName,
    manufacturerName: candidate.manufacturerName,
    year: candidate.year,
    priceMin: usedMin,
    priceMax: usedMax,
    currency: 'EUR',
    condition: 'used',
    sourceUrl: null,
    confidenceScore: age <= 5 ? 50 : 35, // Moderate confidence
  };
}

/**
 * Batch estimate prices for multiple candidates
 */
export function estimatePrices(candidates: PriceCandidate[]): PriceProviderResult[] {
  const results: PriceProviderResult[] = [];
  const now = new Date();

  for (const candidate of candidates) {
    // Generate both new and used estimates
    for (const condition of ['new', 'used'] as PriceCondition[]) {
      const estimate = estimatePrice(candidate, condition);
      if (estimate) {
        results.push({
          ...estimate,
          provider: 'estimated',
          listingCount: 0,
          fetchedAt: now,
        });
      }
    }
  }

  return results;
}

export const PROVIDER_NAME = 'estimated';
export const PROVIDER_DESCRIPTION = 'Price estimation based on yacht specs (length, age, manufacturer, displacement)';
