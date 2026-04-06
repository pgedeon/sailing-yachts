/**
 * Build-safe wrapper for data fetching during static generation.
 *
 * When `DATABASE_URL` is not set (CI build without secrets), Next.js tries
 * to pre-render ISR pages and hits the db-proxy guard which throws.
 * This wrapper catches that specific error and returns `fallback` instead,
 * allowing the build to succeed while ISR populates real data at runtime.
 */

const BUILD_DB_ERROR = "Cannot access database during build";

export function isBuildTime(): boolean {
  return !process.env.DATABASE_URL;
}

export async function buildSafeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.message?.includes(BUILD_DB_ERROR)) {
      console.warn(`[build-safe] Returning fallback data during build (no DATABASE_URL)`);
      return fallback;
    }
    throw err;
  }
}
