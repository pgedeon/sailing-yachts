/**
 * P27.1 — Query Performance Monitoring
 *
 * Lightweight timing wrapper for database queries.
 * Logs slow queries (> threshold) in development and logs all in test mode.
 *
 * Usage:
 *   import { timedQuery } from '@/lib/query-monitor';
 *   const result = await timedQuery('getYachtDetail', () => db.select(...));
 */

type LogLevel = 'silent' | 'warn' | 'all';

const LOG_LEVEL: LogLevel =
  process.env.NODE_ENV === 'test' ? 'all' :
  process.env.NODE_ENV === 'development' ? 'warn' :
  'silent';

const SLOW_QUERY_THRESHOLD_MS = 100;

/**
 * Wrap an async DB query with timing instrumentation.
 * Returns the original result; logs if the query exceeds the slow threshold.
 */
export async function timedQuery<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (LOG_LEVEL === 'silent') {
    return fn();
  }

  const start = Date.now();
  try {
    const result = await fn();
    const elapsed = Date.now() - start;

    if (LOG_LEVEL === 'all') {
      console.log(`[db] ${label}: ${elapsed}ms`);
    } else if (elapsed > SLOW_QUERY_THRESHOLD_MS) {
      console.warn(`[db:slow] ${label}: ${elapsed}ms (threshold: ${SLOW_QUERY_THRESHOLD_MS}ms)`);
    }

    return result;
  } catch (error) {
    const elapsed = Date.now() - start;
    console.error(`[db:error] ${label} failed after ${elapsed}ms:`, error);
    throw error;
  }
}

/**
 * Wrap multiple parallel async DB queries with timing.
 * Logs the total batch time and individual timings.
 */
export async function timedBatch<T>(
  label: string,
  fns: Array<{ name: string; fn: () => Promise<any> }>,
): Promise<T[]> {
  if (LOG_LEVEL === 'silent') {
    return Promise.all(fns.map((f) => f.fn())) as Promise<T[]>;
  }

  const batchStart = Date.now();
  const results = await Promise.all(
    fns.map(async (f) => {
      const start = Date.now();
      const result = await f.fn();
      const elapsed = Date.now() - start;
      if (LOG_LEVEL === 'all') {
        console.log(`[db] ${label}.${f.name}: ${elapsed}ms`);
      } else if (elapsed > SLOW_QUERY_THRESHOLD_MS) {
        console.warn(`[db:slow] ${label}.${f.name}: ${elapsed}ms`);
      }
      return result;
    }),
  );

  const batchElapsed = Date.now() - batchStart;
  if (LOG_LEVEL === 'all') {
    console.log(`[db] ${label} (batch of ${fns.length}): ${batchElapsed}ms total`);
  } else if (batchElapsed > SLOW_QUERY_THRESHOLD_MS * 2) {
    console.warn(`[db:slow] ${label} batch: ${batchElapsed}ms total (${fns.length} queries)`);
  }

  return results as T[];
}
