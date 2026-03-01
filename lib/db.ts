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

// Flag to ensure schema check runs only once per process
let schemaInitialized = false;

export async function ensureSchema() {
  if (schemaInitialized) return;
  schemaInitialized = true;

  const client = await getPool().connect();
  try {
    // Create tables if they don't exist (minimal creation)
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

    // Yacht models: create table if not exists with minimal columns
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

    // Create other tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS spec_values (
        id SERIAL PRIMARY KEY,
        yacht_model_id INT REFERENCES yacht_models(id) ON DELETE CASCADE,
        spec_category_id INT REFERENCES spec_categories(id) ON DELETE CASCADE,
        value_text TEXT,
        value_numeric NUMERIC
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        yacht_model_id INT REFERENCES yacht_models(id) ON DELETE CASCADE,
        url TEXT,
        caption TEXT,
        is_primary BOOLEAN DEFAULT FALSE,
        alt_text TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        yacht_model_id INT REFERENCES yacht_models(id) ON DELETE CASCADE,
        source TEXT,
        rating NUMERIC,
        summary TEXT,
        full_text TEXT,
        review_date TIMESTAMPTZ,
        author_name TEXT,
        source_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // After creating base tables, ensure yacht_models has all Drizzle columns
    // (migrate from minimal to full schema if needed)
    const columnResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'yacht_models' AND table_schema = 'public'
    `);
    const existingColumns = new Set(columnResult.rows.map((r: any) => r.column_name));

    const requiredColumns = [
      'slug', 'source_url', 'source_attribution', 'admin_links',
      'created_at', 'updated_at'
    ];

    const missing = requiredColumns.filter(col => !existingColumns.has(col));
    if (missing.length > 0) {
      console.warn(`[db] Detected missing yacht_models columns: ${missing.join(', ')}. Auto-adding...`);
      for (const col of missing) {
        let sql = '';
        switch (col) {
          case 'slug':
            sql = 'ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE';
            break;
          case 'source_url':
            sql = 'ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS source_url TEXT';
            break;
          case 'source_attribution':
            sql = 'ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS source_attribution TEXT';
            break;
          case 'admin_links':
            sql = 'ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS admin_links JSONB';
            break;
          case 'created_at':
            sql = 'ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()';
            break;
          case 'updated_at':
            sql = 'ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()';
            break;
        }
        if (sql) {
          await client.query(sql);
          console.log(`[db] Added column: ${col}`);
        }
      }
      console.log('[db] Schema migration completed');
    }
  } finally {
    client.release();
  }
}

// Export getDb for direct usage in serverless functions where proxy may cause issues
export { getDb };

// Re-export all tables and schemas for direct imports
export * from "../drizzle/schema";
