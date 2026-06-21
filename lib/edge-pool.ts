/**
 * Database query helper using pg Pool.
 *
 * Previously wrapped @neondatabase/serverless for Edge runtime.
 * After OCI PostgreSQL migration, uses standard pg Pool.
 * Kept for import compatibility.
 *
 * Usage:
 *   import { edgePool } from '@/lib/edge-pool';
 *   const result = await edgePool.query('SELECT * FROM yachts WHERE id = $1', [42]);
 */
import { Pool } from "pg";

let poolInstance: Pool | null = null;

function getPool(): Pool {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    poolInstance = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return poolInstance;
}

export interface EdgeQueryResult {
  rows: Record<string, any>[];
  rowCount: number;
}

/**
 * Pool-like wrapper using pg Pool.
 * Returns { rows, rowCount } compatible with pg.Pool.query().
 */
export const edgePool = {
  async query(text: string, params?: any[]): Promise<EdgeQueryResult> {
    const pool = getPool();
    const result = await pool.query(text, params);
    return { rows: result.rows as Record<string, any>[], rowCount: result.rowCount ?? 0 };
  },
};
