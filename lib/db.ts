/**
 * Full database module (Node.js runtime only).
 * Re-exports Edge-safe `db` + schema from db-edge.ts,
 * plus `pool` (pg) and `ensureSchema` which require Node.js runtime.
 *
 * IMPORTANT: Do NOT import this from Edge runtime routes.
 * Use `import { db } from '@/lib/db-edge'` instead.
 */
import { Pool } from "pg";

// Re-export everything Edge-safe
export { db, getDb } from "./db-edge";
export * from "../drizzle/schema";

let poolInstance: Pool | null = null;

function getDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  return connectionString;
}

function getPool() {
  if (!poolInstance) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) {
      return null as any;
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

export const pool = new Proxy({}, {
  get(_, prop: string | symbol) {
    if (typeof prop === "symbol") return undefined;
    const instance = getPool() as any;
    if (!instance) {
      throw new Error("Cannot access database during build (DATABASE_URL is not set)");
    }
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        confirmed BOOLEAN DEFAULT FALSE,
        source VARCHAR(100) DEFAULT 'website',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        confirmed_at TIMESTAMPTZ
      );
    `);



    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_offers (
        id SERIAL PRIMARY KEY,
        manufacturer_id INT REFERENCES manufacturers(id) ON DELETE CASCADE,
        dealer_name TEXT NOT NULL,
        dealer_type TEXT NOT NULL DEFAULT 'dealer',
        contact_name TEXT,
        email TEXT,
        phone TEXT,
        website_url TEXT,
        location_city TEXT,
        location_country TEXT,
        service_area TEXT,
        specializations JSONB DEFAULT '[]'::jsonb,
        offer_type TEXT NOT NULL DEFAULT 'new_sales',
        offer_title TEXT NOT NULL,
        offer_description TEXT,
        price_range_min NUMERIC(12,2),
        price_range_max NUMERIC(12,2),
        currency TEXT DEFAULT 'EUR',
        validity_start TIMESTAMPTZ,
        validity_end TIMESTAMPTZ,
        source_confidence INT NOT NULL DEFAULT 3,
        data_source TEXT NOT NULL DEFAULT 'manual',
        data_source_url TEXT,
        last_verified_at TIMESTAMPTZ,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_partner_offers_manufacturer ON partner_offers(manufacturer_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_partner_offers_active ON partner_offers(is_active);
    `);

    // ─── Newsletter monetization tables ───────────────────────────────
    // Ensure newsletter_subscribers has monetization columns
    const nlSubCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'newsletter_subscribers' AND table_schema = 'public'
    `);
    const nlSubExisting = new Set(nlSubCols.rows.map((r: any) => r.column_name));
    if (!nlSubExisting.has('tags')) {
      await client.query(`ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[]`);
    }
    if (!nlSubExisting.has('engagement_score')) {
      await client.query(`ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_campaigns (
        id SERIAL PRIMARY KEY,
        subject VARCHAR(500) NOT NULL,
        preheader VARCHAR(500),
        body_markdown TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        target_segment VARCHAR(100),
        scheduled_for TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        recipient_count INTEGER DEFAULT 0,
        open_count INTEGER DEFAULT 0,
        click_count INTEGER DEFAULT 0,
        revenue NUMERIC(10,2) DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nl_campaigns_status ON newsletter_campaigns(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nl_campaigns_scheduled ON newsletter_campaigns(scheduled_for);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_sponsor_slots (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
        sponsor_name VARCHAR(255) NOT NULL,
        sponsor_logo VARCHAR(500),
        headline VARCHAR(500) NOT NULL,
        body_text TEXT,
        cta_text VARCHAR(100),
        cta_url VARCHAR(500) NOT NULL,
        slot_position VARCHAR(20) NOT NULL DEFAULT 'middle',
        revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nl_sponsor_campaign ON newsletter_sponsor_slots(campaign_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nl_sponsor_position ON newsletter_sponsor_slots(slot_position);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_opens (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
        subscriber_id INTEGER REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
        user_agent VARCHAR(500),
        ip_address VARCHAR(45),
        opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nl_opens_campaign ON newsletter_opens(campaign_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nl_opens_subscriber ON newsletter_opens(subscriber_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nl_opens_when ON newsletter_opens(opened_at);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_clicks (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
        subscriber_id INTEGER REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
        url VARCHAR(500) NOT NULL,
        link_label VARCHAR(200),
        clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nl_clicks_campaign ON newsletter_clicks(campaign_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nl_clicks_subscriber ON newsletter_clicks(subscriber_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nl_clicks_when ON newsletter_clicks(clicked_at);`);
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
      'created_at', 'updated_at',
      'data_source', 'source_confidence', 'last_verified_at', 'completeness_score', 'description_source', 'description_status', 'description_generated_at'
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
          case 'data_source':
            sql = 'ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS data_source VARCHAR(100) DEFAULT \'manual\'';
            break;
          case 'source_confidence':
            sql = 'ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS source_confidence INTEGER DEFAULT 50';
            break;
          case 'last_verified_at':
            sql = 'ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ';
            break;
          case 'completeness_score':
            sql = 'ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS completeness_score INTEGER';
            break;
          case 'description_source':
            sql = "ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS description_source VARCHAR(20) DEFAULT 'manual'";
            break;
          case 'description_status':
            sql = "ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS description_status VARCHAR(20) DEFAULT 'approved'";
            break;
          case 'description_generated_at':
            sql = 'ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS description_generated_at TIMESTAMPTZ';
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
