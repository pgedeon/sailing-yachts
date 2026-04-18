/**
 * Apply data expansion source tracking migration (P10.1)
 *
 * Adds source provenance, completeness scoring, and import_jobs table.
 * Run with: npx tsx scripts/apply-migration-data-expansion.ts
 */

import { pool } from "../lib/db";

async function applyMigration() {
  const client = await pool.connect();
  try {
    console.log("Applying data expansion source tracking migration...");

    // 1. Add new columns to yacht_models
    const newColumns = [
      { name: "data_source", sql: "ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS data_source VARCHAR(100) DEFAULT 'manual'" },
      { name: "source_confidence", sql: "ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS source_confidence INTEGER DEFAULT 50" },
      { name: "last_verified_at", sql: "ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE" },
      { name: "completeness_score", sql: "ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS completeness_score INTEGER" },
    ];

    for (const col of newColumns) {
      // Check if column exists
      const check = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'yacht_models' AND column_name = $1`,
        [col.name]
      );
      if (check.rows.length === 0) {
        await client.query(col.sql);
        console.log(`  + Added column: ${col.name}`);
      } else {
        console.log(`  ✓ Column exists: ${col.name}`);
      }
    }

    // 2. Add indexes
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_yacht_models_completeness ON yacht_models(completeness_score)",
      "CREATE INDEX IF NOT EXISTS idx_yacht_models_data_source ON yacht_models(data_source)",
    ];
    for (const idx of indexes) {
      await client.query(idx);
      console.log(`  ✓ Index ensured: ${idx.split("ON ")[1]}`);
    }

    // 3. Create import_jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS import_jobs (
        id SERIAL PRIMARY KEY,
        source VARCHAR(100) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        total_records INTEGER DEFAULT 0,
        added INTEGER DEFAULT 0,
        duplicates INTEGER DEFAULT 0,
        errors INTEGER DEFAULT 0,
        error_details JSONB,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log("  ✓ Table ensured: import_jobs");

    await client.query("CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_import_jobs_source ON import_jobs(source)");
    console.log("  ✓ Indexes ensured on import_jobs");

    // 4. Backfill completeness scores
    const backfillResult = await client.query(`
      UPDATE yacht_models
      SET completeness_score = (
        (CASE WHEN length_overall IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN beam IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN draft IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN displacement IS NOT NULL THEN 7 ELSE 0 END) +
        (CASE WHEN ballast IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN sail_area_main IS NOT NULL THEN 7 ELSE 0 END) +
        (CASE WHEN rig_type IS NOT NULL THEN 4 ELSE 0 END) +
        (CASE WHEN keel_type IS NOT NULL THEN 4 ELSE 0 END) +
        (CASE WHEN hull_material IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN cabins IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN berths IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN heads IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN engine_hp IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN engine_type IS NOT NULL THEN 3 ELSE 0 END) +
        (CASE WHEN fuel_capacity IS NOT NULL THEN 4 ELSE 0 END) +
        (CASE WHEN water_capacity IS NOT NULL THEN 3 ELSE 0 END) +
        (CASE WHEN description IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN design_notes IS NOT NULL THEN 3 ELSE 0 END) +
        (CASE WHEN source_url IS NOT NULL THEN 2 ELSE 0 END)
      )
      WHERE completeness_score IS NULL
    `);
    console.log(`  ✓ Backfilled completeness scores for ${backfillResult.rowCount} rows`);

    // 5. Report current stats
    const modelCount = await client.query("SELECT COUNT(*) as cnt FROM yacht_models");
    const mfrCount = await client.query("SELECT COUNT(*) as cnt FROM manufacturers");
    const avgScore = await client.query("SELECT ROUND(AVG(completeness_score)) as avg FROM yacht_models");
    console.log(`\n📊 DB Stats: ${modelCount.rows[0].cnt} models, ${mfrCount.rows[0].cnt} manufacturers, avg completeness: ${avgScore.rows[0].avg}%`);

    console.log("\n✅ Migration applied successfully!");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
