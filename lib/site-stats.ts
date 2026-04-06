import { db, yachtModels, manufacturers } from "@/lib/db";
import { sql, count } from "drizzle-orm";

export interface SiteStats {
  yachtCount: number;
  manufacturerCount: number;
  lastUpdated: string;
}

let cachedStats: SiteStats | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get live site statistics from the database.
 * Results are cached in-memory for 5 minutes to avoid hammering the DB on every page load.
 */
export async function getSiteStats(): Promise<SiteStats> {
  const now = Date.now();
  if (cachedStats && now - cachedAt < CACHE_TTL_MS) {
    return cachedStats;
  }

  const [yachtResult, mfrResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(yachtModels),
    db
      .select({ count: count() })
      .from(manufacturers),
  ]);

  const stats: SiteStats = {
    yachtCount: Number(yachtResult[0]?.count ?? 0),
    manufacturerCount: Number(mfrResult[0]?.count ?? 0),
    lastUpdated: new Date().toISOString(),
  };

  cachedStats = stats;
  cachedAt = now;
  return stats;
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
  return `${formatCount(stats.yachtCount)} sailing yachts`;
}

/**
 * Build FAQ answer text for "How many yachts are in the database?"
 */
export function formatYachtCountFAQ(stats: SiteStats): string {
  const yachts = stats.yachtCount;
  const mfrs = stats.manufacturerCount;
  return `The database includes ${yachts} sailing yacht model${yachts !== 1 ? "s" : ""} from ${mfrs} manufacturer${mfrs !== 1 ? "s" : ""} worldwide, with detailed specifications including dimensions, sail plans, and accommodation.`;
}
