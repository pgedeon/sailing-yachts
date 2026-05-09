/**
 * Seed manufacturer metadata (country, founding year, website, description, description_fr)
 *
 * Usage: npx tsx scripts/seed-manufacturer-metadata.ts
 *
 * This script reads manufacturer-data.json and manufacturer-descriptions-fr.json
 * and updates existing rows in the manufacturers table. It is idempotent.
 *
 * Uses the Neon HTTP client (no psql/drizzle-kit push needed).
 */

import { neon } from "@neondatabase/serverless";
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

const sql = neon(DATABASE_URL);

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

  // Verify current state
  const current = await sql`SELECT name, country, founded_year FROM manufacturers ORDER BY name`;
  console.log(`Found ${current.length} manufacturers in database`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const mf of manufacturers) {
    const descFr = frDescriptions[mf.name] || null;
    try {
      const result = await sql`
        UPDATE manufacturers
        SET
          country = ${mf.country},
          founded_year = ${mf.foundedYear},
          website_url = ${mf.websiteUrl},
          description = ${mf.description},
          description_fr = ${descFr}
        WHERE name = ${mf.name}
      `;

      if (result.count === 0) {
        // Try case-insensitive match
        const result2 = await sql`
          UPDATE manufacturers
          SET
            country = ${mf.country},
            founded_year = ${mf.foundedYear},
            website_url = ${mf.websiteUrl},
            description = ${mf.description},
            description_fr = ${descFr}
          WHERE LOWER(name) = LOWER(${mf.name})
        `;

        if (result2.count === 0) {
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
  const verify = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(country) as with_country,
      COUNT(founded_year) as with_founded_year,
      COUNT(website_url) as with_website,
      COUNT(description) as with_description,
      COUNT(description_fr) as with_description_fr
    FROM manufacturers
  `;
  console.log(`\n--- Verification ---`);
  console.log(`Total manufacturers: ${verify[0].total}`);
  console.log(`With country: ${verify[0].with_country}`);
  console.log(`With founded_year: ${verify[0].with_founded_year}`);
  console.log(`With website_url: ${verify[0].with_website}`);
  console.log(`With description: ${verify[0].with_description}`);
  console.log(`With description_fr: ${verify[0].with_description_fr}`);

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
