import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import * as schema from "../drizzle/schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let poolInstance: Pool | null = null;
let schemaPromise: Promise<void> | null = null;

function getDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return connectionString;
}

function getDb() {
  if (!dbInstance) {
    const sql = neon(getDatabaseUrl());
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: getDatabaseUrl(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return poolInstance;
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

export const pool = new Proxy({}, {
  get(_, prop: string | symbol) {
    if (typeof prop === "symbol") return undefined;
    const instance = getPool() as any;
    const value = instance[prop];
    if (typeof value === "function") {
      return (...args: any[]) => value.apply(instance, args);
    }
    return value;
  },
}) as Pool;

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const client = await getPool().connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS manufacturers (
            id SERIAL PRIMARY KEY,
            name TEXT,
            country TEXT,
            founded_year INT,
            website_url TEXT,
            logo_url TEXT,
            description TEXT
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS yacht_models (
            id SERIAL PRIMARY KEY,
            model_name TEXT,
            manufacturer_id INT REFERENCES manufacturers(id) ON DELETE SET NULL,
            year INT,
            length_overall NUMERIC,
            beam NUMERIC,
            draft NUMERIC,
            displacement NUMERIC,
            ballast NUMERIC,
            sail_area_main NUMERIC,
            rig_type TEXT,
            keel_type TEXT,
            hull_material TEXT,
            cabins INT,
            berths INT,
            heads INT,
            max_occupancy INT,
            engine_hp NUMERIC,
            engine_type TEXT,
            fuel_capacity NUMERIC,
            water_capacity NUMERIC,
            design_notes TEXT,
            description TEXT
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS spec_categories (
            id SERIAL PRIMARY KEY,
            name TEXT,
            data_type TEXT,
            unit TEXT,
            description TEXT,
            category_group TEXT,
            is_filterable BOOLEAN DEFAULT true
          );
        `);
      } finally {
        client.release();
      }
    })();
  }

  return schemaPromise;
}

// Export getDb for direct usage in serverless functions where proxy may cause issues
export { getDb };

// Re-export all tables and schemas for direct imports
export * from "../drizzle/schema";
