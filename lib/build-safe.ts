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

// Patterns that indicate DB connectivity issues (not SQL bugs)
const DB_CONNECTION_ERRORS = [
  BUILD_DB_ERROR,
  "password authentication failed",
  "ECONNREFUSED",
  "ENOTFOUND",
  "connect ETIMEDOUT",
  "Failed to parse URL",
  "terminating connection due to administrator command",
  "connection terminated unexpectedly",
  "too many clients already",
  // SSL/TLS errors (common with self-hosted PostgreSQL)
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "self-signed certificate",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "CERT_HAS_EXPIRED",
  "unable to verify the first certificate",
  // Network errors
  "fetch failed",
  "network",
];

function isDbConnectionError(err: any): boolean {
  const msg = err?.message || "";
  const causeMsg = err?.cause?.message || "";
  const combined = `${msg} ${causeMsg}`;
  return DB_CONNECTION_ERRORS.some((pattern) => combined.includes(pattern));
}

export async function buildSafeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const msg = err?.cause?.message || err?.message || "unknown";
      console.warn(`[build-safe] Returning fallback data (DB unavailable: ${msg.slice(0, 100)})`);
      return fallback;
    }
    throw err;
  }
}


/**
 * Wraps any async data fetcher to return null on DB connection errors.
 * Use in page components and generateMetadata during SSG.
 *
 * Example:
 *   const data = await safeDataFetch(() => getBestYearSizePageData(year, slug));
 *   if (!data) notFound();
 */
export async function safeDataFetch<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const msg = err?.cause?.message || err?.message || "unknown";
      console.warn(`[build-safe] Data fetch returned null (DB unavailable: ${msg.slice(0, 100)})`);
      return null;
    }
    throw err;
  }
}
