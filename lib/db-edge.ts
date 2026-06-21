/**
 * Edge-safe database module.
 *
 * Previously used @neondatabase/serverless for Neon HTTP queries.
 * After migrating to OCI PostgreSQL, now uses pg Pool for all connections.
 * This module is kept for import compatibility — it re-exports from db.ts.
 *
 * Safe to import from any route (no longer Edge-runtime specific).
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../drizzle/schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;
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

export function getDb() {
  if (!dbInstance) {
    const pool = getPool();
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

// Proxy that forwards both methods and properties
export const db = new Proxy({}, {
  get(_, prop: string | symbol) {
    if (typeof prop === "symbol") return undefined;
    const instance = getDb() as any;
    const value = instance[prop];
    if (typeof value === "function") {
      return (...args: any[]) => value.apply(instance, args);
    }
    return value;
  },
}) as any;

// Re-export all tables and schemas for direct imports
export * from "../drizzle/schema";
