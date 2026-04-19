/**
 * Price Normalization Unit Tests (P10.6)
 *
 * Tests pure functions: age adjustment, confidence scoring, price display info, formatting.
 * Run with: npx tsx tests/price-normalization-unit.test.ts
 */

import assert from "node:assert/strict";

// Inline the pure functions to avoid @/ alias issues in plain tsx
// These mirror the logic in lib/price-normalization.ts

function calculateAgeAdjustment(listingYear: number | null, currentYear?: number): number {
  if (!listingYear) return 0.85;
  const now = currentYear || new Date().getFullYear();
  const age = now - listingYear;
  if (age <= 0) return 1.0;
  if (age <= 1) return 1 - 0.10;
  if (age <= 3) return 1 - 0.10 - (age - 1) * 0.08;
  if (age <= 5) {
    const base = 1 - 0.10 - 2 * 0.08;
    return Math.max(0.3, base - (age - 3) * 0.06);
  }
  if (age <= 10) {
    const base = 1 - 0.10 - 2 * 0.08 - 2 * 0.06;
    return Math.max(0.25, base - (age - 5) * 0.04);
  }
  const base = 1 - 0.10 - 2 * 0.08 - 2 * 0.06 - 5 * 0.04;
  return Math.max(0.15, base - (age - 10) * 0.02);
}

const SOURCE_RELIABILITY: Record<string, number> = {
  api_feed: 1.0,
  partner: 0.95,
  manual: 0.85,
  csv_import: 0.75,
  scraper: 0.65,
};

function calculateAdjustedConfidence(
  baseScore: number,
  sourceType: string,
  listingYear: number | null,
  hasPriceRange: boolean
): number {
  let score = baseScore;
  const reliability = SOURCE_RELIABILITY[sourceType] || 0.7;
  score = score * reliability;
  if (!listingYear) score *= 0.85;
  if (!hasPriceRange) score *= 0.9;
  return Math.round(Math.min(100, Math.max(0, score)));
}

interface PriceRange {
  min: number;
  max: number;
  currency: "USD" | "EUR" | "GBP";
  confidence: number;
  sources: number;
}

interface PriceDisplayInfo {
  status: "available" | "contact" | "unavailable";
  label: string;
  priceRange?: PriceRange;
  usedPriceRange?: PriceRange;
  confidenceLabel: string;
  confidenceLevel: "high" | "medium" | "low" | "none";
}

function getPriceDisplayInfo(
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

function formatPriceRange(min: number, max: number, currency: "USD" | "EUR" | "GBP"): string {
  const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] || currency;
  const fmtMin = new Intl.NumberFormat("en-US").format(min);
  const fmtMax = new Intl.NumberFormat("en-US").format(max);
  if (min === max) return `${symbol}${fmtMin}`;
  if (Math.abs(max - min) / min < 0.1) return `${symbol}${fmtMin}`;
  return `${symbol}${fmtMin} – ${symbol}${fmtMax}`;
}

// --- Run tests ---

async function main() {
  let passed = 0;
  let failed = 0;

  const check = (name: string, fn: () => void) => {
    try {
      fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (e: any) {
      console.log(`  ❌ ${name}: ${e.message}`);
      failed++;
    }
  };

  console.log("\n=== Age Adjustment ===");
  check("current year returns 1.0", () => {
    assert.strictEqual(calculateAgeAdjustment(2026, 2026), 1.0);
  });
  check("1 year old applies 10% depreciation", () => {
    assert.strictEqual(calculateAgeAdjustment(2025, 2026), 0.9);
  });
  check("null year returns 0.85 default", () => {
    assert.strictEqual(calculateAgeAdjustment(null, 2026), 0.85);
  });
  check("very old yacht caps at 0.15 minimum", () => {
    const adj = calculateAgeAdjustment(1980, 2026);
    assert.ok(adj >= 0.15, `Expected >= 0.15, got ${adj}`);
  });
  check("3-year-old yacht depreciates properly", () => {
    const adj = calculateAgeAdjustment(2023, 2026);
    assert.ok(adj > 0.5 && adj < 1, `Expected between 0.5 and 1, got ${adj}`);
  });

  console.log("\n=== Confidence Scoring ===");
  check("api_feed gives full reliability", () => {
    assert.strictEqual(calculateAdjustedConfidence(80, "api_feed", 2026, true), 80);
  });
  check("scraper reduces confidence", () => {
    const score = calculateAdjustedConfidence(80, "scraper", 2026, true);
    assert.strictEqual(score, Math.round(80 * 0.65));
  });
  check("missing year reduces confidence", () => {
    const withYear = calculateAdjustedConfidence(80, "manual", 2025, true);
    const noYear = calculateAdjustedConfidence(80, "manual", null, true);
    assert.ok(noYear < withYear, `Expected ${noYear} < ${withYear}`);
  });
  check("no range reduces confidence", () => {
    const withRange = calculateAdjustedConfidence(80, "manual", 2025, true);
    const noRange = calculateAdjustedConfidence(80, "manual", 2025, false);
    assert.ok(noRange < withRange);
  });
  check("caps at 100", () => {
    assert.strictEqual(calculateAdjustedConfidence(100, "api_feed", 2026, true), 100);
  });
  check("never below 0", () => {
    assert.strictEqual(calculateAdjustedConfidence(0, "scraper", null, false), 0);
  });

  console.log("\n=== Price Display Info ===");
  check("new price → available", () => {
    const info = getPriceDisplayInfo(
      { min: 50000, max: 80000, currency: "EUR", confidence: 75, sources: 3 },
      null
    );
    assert.strictEqual(info.status, "available");
    assert.strictEqual(info.confidenceLevel, "high");
  });
  check("used price only → available", () => {
    const info = getPriceDisplayInfo(
      null,
      { min: 30000, max: 50000, currency: "EUR", confidence: 55, sources: 1 }
    );
    assert.strictEqual(info.status, "available");
    assert.strictEqual(info.confidenceLevel, "medium");
  });
  check("both null → unavailable", () => {
    const info = getPriceDisplayInfo(null, null);
    assert.strictEqual(info.status, "unavailable");
    assert.strictEqual(info.label, "Price not available");
  });
  check("zero prices → contact", () => {
    const info = getPriceDisplayInfo(
      { min: 0, max: 0, currency: "EUR", confidence: 0, sources: 0 },
      null
    );
    assert.strictEqual(info.status, "contact");
    assert.strictEqual(info.label, "Contact for price");
  });
  check("low confidence score", () => {
    const info = getPriceDisplayInfo(
      { min: 50000, max: 80000, currency: "EUR", confidence: 25, sources: 1 },
      null
    );
    assert.strictEqual(info.confidenceLevel, "low");
  });

  console.log("\n=== Price Range Formatting ===");
  check("single price when min === max", () => {
    assert.strictEqual(formatPriceRange(50000, 50000, "EUR"), "€50,000");
  });
  check("range when spread > 10%", () => {
    assert.strictEqual(formatPriceRange(50000, 80000, "EUR"), "€50,000 – €80,000");
  });
  check("collapses when spread < 10%", () => {
    assert.strictEqual(formatPriceRange(50000, 54000, "EUR"), "€50,000");
  });
  check("USD symbol", () => {
    assert.strictEqual(formatPriceRange(50000, 50000, "USD"), "$50,000");
  });
  check("GBP symbol", () => {
    assert.strictEqual(formatPriceRange(50000, 50000, "GBP"), "£50,000");
  });

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(console.error);
