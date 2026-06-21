/**
 * P27.1 — Database Query Optimization Audit
 *
 * Migration: Add missing composite indexes for common query patterns.
 *
 * Run via: node scripts/p27-index-migration.js
 */

const fs = require('fs');
const path = require('path');

// Load .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="?(.+?)"?\s*$/m);
if (!dbUrlMatch) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}
const DATABASE_URL = dbUrlMatch[1].replace(/"/g, '');

const { Pool } = require('pg');

const indexes = [
  // Year sorting (common in listing pages)
  `CREATE INDEX IF NOT EXISTS idx_yacht_models_year ON yacht_models(year)`,

  // Common filter combinations (categorical + range)
  `CREATE INDEX IF NOT EXISTS idx_yacht_models_hull_length ON yacht_models(hull_material, length_overall)`,
  `CREATE INDEX IF NOT EXISTS idx_yacht_models_rig_length ON yacht_models(rig_type, length_overall)`,
  `CREATE INDEX IF NOT EXISTS idx_yacht_models_keel_length ON yacht_models(keel_type, length_overall)`,

  // Cabin/berth filters (integer range queries)
  `CREATE INDEX IF NOT EXISTS idx_yacht_models_cabins ON yacht_models(cabins)`,
  `CREATE INDEX IF NOT EXISTS idx_yacht_models_berths ON yacht_models(berths)`,

  // Reviews: compound index for verified reviews per yacht
  `CREATE INDEX IF NOT EXISTS idx_reviews_yacht_verified ON reviews(yacht_model_id, verified) WHERE verified = true`,

  // Images: fast primary image lookup
  `CREATE INDEX IF NOT EXISTS idx_images_yacht_primary ON images(yacht_model_id) WHERE is_primary = true`,

  // Analytics: compound index for time-range + event type queries
  `CREATE INDEX IF NOT EXISTS idx_analytics_events_created_type ON analytics_events(created_at, event_type)`,

  // Yacht prices: active price lookup
  `CREATE INDEX IF NOT EXISTS idx_yacht_prices_active_yacht ON yacht_prices(yacht_model_id, is_active, condition) WHERE is_active = true`,

  // Alert log: recent alerts per user
  `CREATE INDEX IF NOT EXISTS idx_alert_log_user_type_sent ON alert_log(user_id, alert_type, sent_at DESC)`,

  // Newsletter opens: campaign analytics with time ordering
  `CREATE INDEX IF NOT EXISTS idx_nl_opens_campaign_time ON newsletter_opens(campaign_id, opened_at DESC)`,

  // Enrichment logs: pending items lookup
  `CREATE INDEX IF NOT EXISTS idx_enrichment_logs_status_yacht ON enrichment_logs(status, yacht_model_id) WHERE status = 'pending'`,

  // Lead scoring: unscored leads lookup
  `CREATE INDEX IF NOT EXISTS idx_leads_unscored ON leads(status, score) WHERE score IS NULL`,

  // Revenue events: time-based analytics
  `CREATE INDEX IF NOT EXISTS idx_revenue_events_created_type ON revenue_events(created_at, event_type)`,

  // AB events: experiment + created for time-range analysis
  `CREATE INDEX IF NOT EXISTS idx_ab_events_experiment_created ON ab_events(experiment_id, created_at DESC)`,
];

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
      ? { rejectUnauthorized: false }
      : undefined,
  });
  let success = 0;
  let skipped = 0;

  console.log(`[P27.1] Running index migration: ${indexes.length} indexes\n`);

  for (const stmt of indexes) {
    const idxName = stmt.match(/idx_[\w_]+/)?.[0] || 'unknown';
    try {
      await pool.query(stmt);
      console.log(`  ✅ Created: ${idxName}`);
      success++;
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`  ⏭️  Exists: ${idxName}`);
        skipped++;
      } else {
        console.error(`  ❌ Failed: ${idxName} — ${err.message}`);
      }
    }
  }

  console.log(`\n[P27.1] Done: ${success} created, ${skipped} already existed, ${indexes.length - success - skipped} failed.`);
  await pool.end();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
