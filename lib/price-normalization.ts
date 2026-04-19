/**
 * Price Normalization Service (P10.6)
 *
 * Handles:
 * - Regional price normalization (multi-currency conversion)
 * - Used listing price normalization (age-adjustment, source confidence)
 * - Price history aggregation for trend display
 * - UI fallback helpers for partial/missing data
 */

import { pool } from "@/lib/db";
import { buildSafeQuery } from "@/lib/build-safe";
import {
  convertCurrency,
  getExchangeRate,
  refreshExchangeRates,
  type CurrencyCode,
} from "./exchange-rates";

// --- Types ---

export interface NormalizedPrice {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: CurrencyCode;
  exchangeRate: number;
  confidenceScore: number;
  ageAdjustment: number;
  sourceType: string;
  condition: string;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: CurrencyCode;
  confidence: number;
  sources: number;
}

export interface PriceTrendPoint {
  date: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  confidenceScore: number;
  snapshotReason: string;
}

export interface PriceDisplayInfo {
  status: "available" | "contact" | "unavailable";
  label: string;
  priceRange?: PriceRange;
  usedPriceRange?: PriceRange;
  confidenceLabel: string;
  confidenceLevel: "high" | "medium" | "low" | "none";
}

// --- Constants ---

// Age depreciation factors for used listings
const AGE_DEPRECIATION = {
  // Per-year depreciation rate by age bracket
  "0-1": 0.10,   // 10% first year
  "1-3": 0.08,   // 8% per year years 1-3
  "3-5": 0.06,   // 6% per year years 3-5
  "5-10": 0.04,  // 4% per year years 5-10
  "10+": 0.02,   // 2% per year after 10
};

// Source reliability multipliers for confidence scoring
const SOURCE_RELIABILITY: Record<string, number> = {
  api_feed: 1.0,
  partner: 0.95,
  manual: 0.85,
  csv_import: 0.75,
  scraper: 0.65,
};

// --- Age Adjustment ---

/**
 * Calculate age-based depreciation factor for used listing price.
 * Returns a multiplier (0-1) to adjust the price based on listing age.
 */
export function calculateAgeAdjustment(listingYear: number | null, currentYear?: number): number {
  if (!listingYear) return 0.85; // Default assumption for unknown age

  const now = currentYear || new Date().getFullYear();
  const age = now - listingYear;

  if (age <= 0) return 1.0; // Current year or newer
  if (age <= 1) return 1 - AGE_DEPRECIATION["0-1"];
  if (age <= 3) return 1 - AGE_DEPRECIATION["0-1"] - (age - 1) * AGE_DEPRECIATION["1-3"];
  if (age <= 5) {
    const base = 1 - AGE_DEPRECIATION["0-1"] - 2 * AGE_DEPRECIATION["1-3"];
    return Math.max(0.3, base - (age - 3) * AGE_DEPRECIATION["3-5"]);
  }
  if (age <= 10) {
    const base = 1 - AGE_DEPRECIATION["0-1"] - 2 * AGE_DEPRECIATION["1-3"] - 2 * AGE_DEPRECIATION["3-5"];
    return Math.max(0.25, base - (age - 5) * AGE_DEPRECIATION["5-10"]);
  }
  // 10+ years
  const base = 1 - AGE_DEPRECIATION["0-1"] - 2 * AGE_DEPRECIATION["1-3"] - 2 * AGE_DEPRECIATION["3-5"] - 5 * AGE_DEPRECIATION["5-10"];
  return Math.max(0.15, base - (age - 10) * AGE_DEPRECIATION["10+"]);
}

// --- Confidence Scoring ---

/**
 * Calculate adjusted confidence score based on source, age, and data quality.
 */
export function calculateAdjustedConfidence(
  baseScore: number,
  sourceType: string,
  listingYear: number | null,
  hasPriceRange: boolean
): number {
  let score = baseScore;

  // Source reliability adjustment
  const reliability = SOURCE_RELIABILITY[sourceType] || 0.7;
  score = score * reliability;

  // Age data quality: if we don't know the year, reduce confidence
  if (!listingYear) score *= 0.85;

  // Range quality: single point is less confident than a range
  if (!hasPriceRange) score *= 0.9;

  return Math.round(Math.min(100, Math.max(0, score)));
}

// --- Currency Conversion ---

/**
 * Normalize all prices for a yacht to a target currency.
 * Returns converted price ranges for new and used conditions.
 */
export async function normalizePricesToCurrency(
  yachtModelId: number,
  targetCurrency: CurrencyCode
): Promise<{
  newPrice: PriceRange | null;
  usedPrice: PriceRange | null;
  ratesUsed: Record<string, number>;
}> {
  await refreshExchangeRates();

  return buildSafeQuery(async () => {
    const result = await pool.query(
      `SELECT price_min, price_max, currency, condition, source_type, confidence_score, year, is_active
       FROM yacht_prices
       WHERE yacht_model_id = $1 AND is_active = TRUE
       ORDER BY confidence_score DESC`,
      [yachtModelId]
    );

    if (result.rows.length === 0) {
      return { newPrice: null, usedPrice: null, ratesUsed: {} };
    }

    const ratesUsed: Record<string, number> = {};
    let newMin = Infinity, newMax = -Infinity, newConf = 0, newSources = 0;
    let usedMin = Infinity, usedMax = -Infinity, usedConf = 0, usedSources = 0;

    for (const row of result.rows) {
      const priceMin = parseFloat(row.price_min);
      const priceMax = parseFloat(row.price_max);
      const sourceCurrency = (row.currency || "USD") as CurrencyCode;
      const condition = row.condition;
      const sourceType = row.source_type;
      const confScore = parseInt(row.confidence_score, 10) || 50;
      const year = row.year;

      // Convert to target currency
      const convertedMin = await convertCurrency(priceMin, sourceCurrency, targetCurrency);
      const convertedMax = await convertCurrency(priceMax, sourceCurrency, targetCurrency);

      // Track rates used
      if (sourceCurrency !== targetCurrency) {
        ratesUsed[`${sourceCurrency}_${targetCurrency}`] = await getExchangeRate(sourceCurrency, targetCurrency);
      }

      // Age adjustment for used listings
      const ageAdj = condition === "used" ? calculateAgeAdjustment(year) : 1;
      const adjustedConf = calculateAdjustedConfidence(
        confScore, sourceType, year, priceMin !== priceMax
      );

      if (condition === "new") {
        newMin = Math.min(newMin, convertedMin * ageAdj);
        newMax = Math.max(newMax, convertedMax * ageAdj);
        newConf = Math.max(newConf, adjustedConf);
        newSources++;
      } else if (condition === "used" || condition === "broker") {
        usedMin = Math.min(usedMin, convertedMin * ageAdj);
        usedMax = Math.max(usedMax, convertedMax * ageAdj);
        usedConf = Math.max(usedConf, adjustedConf);
        usedSources++;
      }
    }

    return {
      newPrice: newSources > 0 ? {
        min: Math.round(newMin),
        max: Math.round(newMax),
        currency: targetCurrency,
        confidence: newConf,
        sources: newSources,
      } : null,
      usedPrice: usedSources > 0 ? {
        min: Math.round(usedMin),
        max: Math.round(usedMax),
        currency: targetCurrency,
        confidence: usedConf,
        sources: usedSources,
      } : null,
      ratesUsed,
    };
  }, { newPrice: null, usedPrice: null, ratesUsed: {} });
}

// --- Price History ---

/**
 * Get price trend data for a yacht, normalized to target currency.
 */
export async function getPriceTrend(
  yachtModelId: number,
  targetCurrency: CurrencyCode = "EUR",
  condition?: string,
  limit: number = 30
): Promise<PriceTrendPoint[]> {
  return buildSafeQuery(async () => {
    const conditions = ["yacht_model_id = $1"];
    const values: any[] = [yachtModelId];
    let paramIdx = 2;

    if (condition) {
      conditions.push(`condition = $${paramIdx}`);
      values.push(condition);
      paramIdx++;
    }

    const result = await pool.query(
      `SELECT snapshot_date, price_min, price_max, currency, condition, confidence_score, snapshot_reason
       FROM price_snapshots
       WHERE ${conditions.join(" AND ")}
       ORDER BY snapshot_date ASC
       LIMIT $${paramIdx}`,
      [...values, limit]
    );

    const points: PriceTrendPoint[] = [];
    for (const row of result.rows) {
      const sourceCurrency = (row.currency || "USD") as CurrencyCode;
      const priceMin = parseFloat(row.price_min);
      const priceMax = parseFloat(row.price_max);

      let convertedMin = priceMin;
      let convertedMax = priceMax;
      if (sourceCurrency !== targetCurrency) {
        convertedMin = await convertCurrency(priceMin, sourceCurrency, targetCurrency);
        convertedMax = await convertCurrency(priceMax, sourceCurrency, targetCurrency);
      }

      points.push({
        date: row.snapshot_date,
        priceMin: Math.round(convertedMin),
        priceMax: Math.round(convertedMax),
        currency: targetCurrency,
        confidenceScore: parseInt(row.confidence_score, 10) || 50,
        snapshotReason: row.snapshot_reason,
      });
    }

    return points;
  }, []);
}

// --- UI Fallback Helpers ---

/**
 * Determine the display status and label for price information.
 * Returns structured info for graceful fallbacks.
 */
export function getPriceDisplayInfo(
  newPrice: PriceRange | null,
  usedPrice: PriceRange | null
): PriceDisplayInfo {
  const hasNew = newPrice !== null && newPrice.min > 0;
  const hasUsed = usedPrice !== null && usedPrice.min > 0;

  if (hasNew || hasUsed) {
    const bestConfidence = Math.max(
      newPrice?.confidence || 0,
      usedPrice?.confidence || 0
    );
    return {
      status: "available",
      label: "Pricing information available",
      priceRange: hasNew ? newPrice! : undefined,
      usedPriceRange: hasUsed ? usedPrice! : undefined,
      confidenceLabel: bestConfidence >= 70 ? "High confidence" :
                       bestConfidence >= 40 ? "Medium confidence" : "Low confidence",
      confidenceLevel: bestConfidence >= 70 ? "high" :
                       bestConfidence >= 40 ? "medium" : "low",
    };
  }

  // No prices at all — check if we have partial data
  const hasPartial = (newPrice?.min === 0 && newPrice?.max === 0) ||
                     (usedPrice?.min === 0 && usedPrice?.max === 0);

  if (hasPartial) {
    return {
      status: "contact",
      label: "Contact for price",
      confidenceLabel: "No pricing data",
      confidenceLevel: "none",
    };
  }

  return {
    status: "unavailable",
    label: "Price not available",
    confidenceLabel: "No pricing data",
    confidenceLevel: "none",
  };
}

/**
 * Format a price range for display.
 */
export function formatPriceRange(min: number, max: number, currency: CurrencyCode): string {
  const symbols: Record<CurrencyCode, string> = { USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] || currency;
  const fmtMin = new Intl.NumberFormat("en-US").format(min);
  const fmtMax = new Intl.NumberFormat("en-US").format(max);

  if (min === max) return `${symbol}${fmtMin}`;
  if (Math.abs(max - min) / min < 0.1) return `${symbol}${fmtMin}`;
  return `${symbol}${fmtMin} – ${symbol}${fmtMax}`;
}
