/**
 * Edge-compatible database query helper.
 *
 * Uses neon() HTTP function from @neondatabase/serverless.
 * Routes through OCI PostgreSQL HTTP SQL proxy when DATABASE_PROXY_URL is set.
 * Accepts $1, $2 style parameterized queries (converts to neon() format).
 *
 * Usage:
 *   import { edgePool } from '@/lib/edge-pool';
 *   const result = await edgePool.query('SELECT * FROM yachts WHERE id = $1', [42]);
 */
import { neon, neonConfig } from "@neondatabase/serverless";

let sqlFn: ReturnType<typeof neon> | null = null;
let proxyConfigured = false;

function configureProxy() {
  if (proxyConfigured) return;
  proxyConfigured = true;
  const proxyUrl = process.env.DATABASE_PROXY_URL;
  if (proxyUrl) {
    neonConfig.fetchEndpoint = proxyUrl;
  }
}

function getSql() {
  if (!sqlFn) {
    configureProxy();
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    sqlFn = neon(connectionString);
  }
  return sqlFn;
}

export interface EdgeQueryResult {
  rows: Record<string, any>[];
  rowCount: number;
}

/**
 * Pool-like wrapper using neon() HTTP function.
 * Returns { rows, rowCount } compatible with pg.Pool.query().
 */
export const edgePool = {
  async query(text: string, params?: any[]): Promise<EdgeQueryResult> {
    const sql = getSql();
    // neon() in v1.x has stricter types for tagged template literals.
    // Cast to any to maintain backward compatibility with string + params API.
    const result = params && params.length > 0
      ? await sql(text as any, params as any)
      : await sql(text as any);
    const rows = Array.isArray(result) ? result as Record<string, any>[] : [];
    return { rows, rowCount: rows.length };
  },
};
