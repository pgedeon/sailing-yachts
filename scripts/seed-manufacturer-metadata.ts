/**
 * Seed manufacturer metadata (country, founding year, website, description, description_fr)
 *
 * Usage: npx tsx scripts/seed-manufacturer-metadata.ts
 *
 * This script reads manufacturer-data.json and manufacturer-descriptions-fr.json
 * and updates existing rows in the manufacturers table. It is idempotent.
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

// Load DATABASE_URL from .env
const envPath = path.resolve(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const dbUrlMatch = envContent.match(/DATABASE_URL\s*=\s*["']?([^"'\n]+)["']?/);
if (!dbUrlMatch) {
  console.error("ERROR: DATABASE_URL not found in .env");
  process.exit(1);
}
const DATABASE_URL = dbUrlMatch[1].trim();

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
    ? { rejectUnauthorized: false }
    : undefined,
});

interface ManufacturerData {
  name: string;
  country: string;
  foundedYear: number;
  websiteUrl: string | null;
  description: string;
}

async function main() {
  const dataPath = path.resolve(__dirname, "manufacturer-data.json");
  const manufacturers: ManufacturerData[] = JSON.parse(
    fs.readFileSync(dataPath, "utf-8"),
  );

  // Load French descriptions
  const frDataPath = path.resolve(__dirname, "manufacturer-descriptions-fr.json");
  const frDescriptions: Record<string, string> = JSON.parse(
    fs.readFileSync(frDataPath, "utf-8"),
  );

  console.log(`Loaded ${manufacturers.length} manufacturers from data file`);
  console.log(`Loaded ${Object.keys(frDescriptions).length} French descriptions`);

  const client = await pool.connect();
  try {
    // Verify current state
    const current = await client.query("SELECT name, country, founded_year FROM manufacturers ORDER BY name");
    console.log(`Found ${current.rows.length} manufacturers in database`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const mf of manufacturers) {
      const descFr = frDescriptions[mf.name] || null;
      try {
        const result = await client.query(
          `UPDATE manufacturers
           SET country = $1, founded_year = $2, website_url = $3, description = $4, description_fr = $5
           WHERE name = $6`,
          [mf.country, mf.foundedYear, mf.websiteUrl, mf.description, descFr, mf.name]
        );

        if (result.rowCount === 0) {
          // Try case-insensitive match
          const result2 = await client.query(
            `UPDATE manufacturers
             SET country = $1, founded_year = $2, website_url = $3, description = $4, description_fr = $5
             WHERE LOWER(name) = LOWER($6)`,
            [mf.country, mf.foundedYear, mf.websiteUrl, mf.description, descFr, mf.name]
          );

          if (result2.rowCount === 0) {
            console.warn(`  ⚠ Manufacturer not found: ${mf.name}`);
            skipped++;
          } else {
            console.log(`  ✓ Updated (case-insensitive): ${mf.name}`);
            updated++;
          }
        } else {
          console.log(`  ✓ Updated: ${mf.name} (${mf.country}, ${mf.foundedYear})`);
          updated++;
        }
      } catch (err: any) {
        console.error(`  ✗ Error updating ${mf.name}: ${err.message}`);
        errors++;
      }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);

    // Verify
    const verify = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(country) as with_country,
        COUNT(founded_year) as with_founded_year,
        COUNT(website_url) as with_website,
        COUNT(description) as with_description,
        COUNT(description_fr) as with_description_fr
      FROM manufacturers
    `);
    console.log(`\n--- Verification ---`);
    console.log(`Total manufacturers: ${verify.rows[0].total}`);
    console.log(`With country: ${verify.rows[0].with_country}`);
    console.log(`With founded_year: ${verify.rows[0].with_founded_year}`);
    console.log(`With website_url: ${verify.rows[0].with_website}`);
    console.log(`With description: ${verify.rows[0].with_description}`);
    console.log(`With description_fr: ${verify.rows[0].with_description_fr}`);

    if (errors > 0) {
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
