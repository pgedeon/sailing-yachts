/**
 * Server-side caching utilities for API routes.
 *
 * Uses Next.js unstable_cache for ISR-style caching with
 * tag-based revalidation. This avoids hitting the database
 * for every request on data that rarely changes.
 */

import { unstable_cache } from 'next/cache';

/** Cache a function result with a tag for on-demand revalidation */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keys: string[],
  tags: string[],
  revalidateSeconds: number = 60,
): T {
  return unstable_cache(fn, keys, {
    revalidate: revalidateSeconds,
    tags,
  }) as T;
}

/** Revalidate all caches for a given tag */
export async function revalidateTag(tag: string): Promise<void> {
  const { revalidateTag: rt } = await import('next/cache');
  rt(tag, 'default');
}

/** Cache durations */
export const CACHE_TTL = {
  /** Filter options (rig types, keel types, etc.) — change very rarely */
  FILTER_OPTIONS: 300, // 5 minutes
  /** Yacht list pages — moderate freshness needed */
  YACHT_LIST: 60, // 1 minute
  /** Yacht detail — changes infrequently */
  YACHT_DETAIL: 120, // 2 minutes
  /** Search autocomplete — needs to be fresh */
  SEARCH_AUTOCOMPLETE: 30, // 30 seconds
  /** Manufacturer list — very stable */
  MANUFACTURERS: 300, // 5 minutes
  /** Stats — for dashboard display */
  STATS: 120, // 2 minutes
} as const;

/** Cache tags for revalidation */
export const CACHE_TAGS = {
  YACHTS: 'yachts',
  YACHT_DETAIL: 'yacht-detail',
  MANUFACTURERS: 'manufacturers',
  FILTER_OPTIONS: 'filter-options',
  SEARCH: 'search',
  STATS: 'stats',
} as const;
