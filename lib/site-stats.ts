import { pool } from "./db";
import { buildSafeQuery } from "./build-safe";

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
 * Results are cached in-memory for 5 minutes to avoid hammering DB on every page load.
 * Uses buildSafeQuery to return fallback data during build time when DATABASE_URL is not set.
 */
export async function getSiteStats(): Promise<SiteStats> {
  const now = Date.now();
  if (cachedStats && now - cachedAt < CACHE_TTL_MS) {
    return cachedStats;
  }

  const stats = await buildSafeQuery(
    async () => {
      return await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM manufacturers WHERE name IS NOT NULL) as manufacturer_count,
          (SELECT COUNT(*) FROM yacht_models WHERE model_name IS NOT NULL) as yacht_model_count,
          (SELECT COUNT(*) FROM yacht_models) as yacht_count,
          (SELECT COUNT(*) FROM reviews) as review_count
      `);
    },
    {
      rows: [{ manufacturer_count: "0", yacht_model_count: "0", yacht_count: "0", review_count: "0" }],
      command: "",
      rowCount: 1,
      oid: 0,
      fields: []
    } as any
  );

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
 * Uses round numbers so the claim stays true as count grows.
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
 * Build a human-readable phrase like "200+ sailing yachts" using actual DB count.
 */
export function formatYachtPhrase(stats: SiteStats, locale = "en"): string {
  // Use yacht model count for main claim
  const count = formatCount(stats.yachtModelCount);
  if (locale === "fr") {
    return `${count} yachts à voile`;
  }
  return `${count} sailing yachts`;
}

/**
 * Build FAQ answer text for "How many yachts are in the database?"
 */
export function formatYachtCountFAQ(stats: SiteStats, locale = "en"): string {
  const models = stats.yachtModelCount;
  const mfrs = stats.manufacturerCount;
  if (locale === "fr") {
    return `La base de données comprend ${models} modèles de yachts à voile de ${mfrs} constructeurs dans le monde, avec des spécifications détaillées incluant les dimensions, le plan de voilure et l'aménagement.`;
  }
  return `The database includes ${models} sailing yacht models across ${mfrs} manufacturers worldwide, with detailed specifications including dimensions, sail plans, and accommodation.`;
}
