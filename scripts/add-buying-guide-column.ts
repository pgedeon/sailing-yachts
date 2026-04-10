/**
 * Script to add buying_guide_template_id column to articles table
 * Run with: npx tsx scripts/add-buying-guide-column.ts
 */

import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addColumn() {
  console.log("Adding buying_guide_template_id column to articles table...");

  try {
    // Add the column if it doesn't exist
    await pool.query(`
      ALTER TABLE articles
      ADD COLUMN IF NOT EXISTS buying_guide_template_id VARCHAR(100)
    `);
    console.log("✅ Column buying_guide_template_id added successfully");

    // Create index if it doesn't exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_buying_guide_template_id
      ON articles(buying_guide_template_id)
    `);
    console.log("✅ Index idx_articles_buying_guide_template_id created successfully");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

addColumn().catch(console.error);
