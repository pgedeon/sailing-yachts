/**
 * Apply buying guide template migration
 *
 * This script adds the buying_guide_template_id column to the articles table.
 * Run with: npx tsx scripts/apply-migration.ts
 */

import { pool } from "../lib/db";

async function applyMigration() {
  try {
    console.log("Applying buying guide template migration...");

    // Check if column already exists
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'articles' AND column_name = 'buying_guide_template_id'
    `);

    if (checkResult.rows.length > 0) {
      console.log("Column buying_guide_template_id already exists. Skipping migration.");
      return;
    }

    // Add the column
    await pool.query(`
      ALTER TABLE articles
      ADD COLUMN buying_guide_template_id varchar(100)
    `);

    console.log("✓ Migration applied successfully");
    console.log("  - Added buying_guide_template_id column to articles table");
  } catch (error: any) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
