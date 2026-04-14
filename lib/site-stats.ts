import { pool } from "./db";

export interface SiteStats {
  manufacturerCount: number;
  yachtModelCount: number;
  reviewCount: number;
  lastUpdated: string;
}

let cachedStats: SiteStats | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const FALLBACK_STATS: SiteStats = {
  manufacturerCount: 0,
  yachtModelCount: 0,
  reviewCount: 0,
  lastUpdated: new Date().toISOString(),
};

/**
 * Get live site statistics from the database.
 * Results are cached in-memory for 5 minutes to avoid hammering the DB on every page load.
 */
export async function getSiteStats(): Promise<SiteStats> {
  const now = Date.now();
  if (cachedStats && now - cachedAt < CACHE_TTL_MS) {
    return cachedStats;
  }

  const stats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM manufacturers WHERE name IS NOT NULL) as manufacturer_count,
      (SELECT COUNT(*) FROM yacht_models WHERE model_name IS NOT NULL) as yacht_model_count,
      (SELECT COUNT(*) FROM yacht_models) as yacht_count,
      (SELECT COUNT(*) FROM reviews) as review_count
  `);

  const counts = stats.rows[0];

  const result: SiteStats = {
    manufacturerCount: parseInt(counts.manufacturer_count || "0", 10),
    yachtModelCount: parseInt(counts.yacht_model_count || "0", 10),
    reviewCount: parseInt(counts.review_count || "0", 10),
    lastUpdated: new Date().toISOString(),
  };

  cachedStats = result;
  cachedAt = now;
  return result;
}

/**
 * Format a count for display, e.g. "200+" for 200, "300+" for 300.
 * Uses round numbers so the claim stays true as the count grows.
 */
export function formatCount(n: number): string {
  if (n >= 1000) {
    const hundreds = Math.floor(n / 100);
    return `${hundreds * 100}+`;
  }
  // Round down to nearest 10 for small numbers, or just show exact
  if (n >= 100) {
    const tens = Math.floor(n / 10);
    return `${tens * 10}+`;
  }
  return `${n}`;
}

/**
 * Build a human-readable phrase like "200+ sailing yachts" using the actual DB count.
 */
export function formatYachtPhrase(stats: SiteStats): string {
  // Use yacht model count for the main claim
  return `${formatCount(stats.yachtModelCount)} sailing yachts`;
}

/**
 * Build FAQ answer text for "How many yachts are in the database?"
 */
export function formatYachtCountFAQ(stats: SiteStats): string {
  const models = stats.yachtModelCount;
  const mfrs = stats.manufacturerCount;
  return `The database includes ${models} sailing yacht models across ${mfrs} manufacturers worldwide, with detailed specifications including dimensions, sail plans, and accommodation.`;
}