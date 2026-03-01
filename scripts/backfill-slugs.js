#!/usr/bin/env node
/**
 * Backfill missing slugs for yacht_models table.
 *
 * Usage:
 *   node scripts/backfill-slugs.js
 *
 * Options:
 *   --dry-run   Show what would be updated without making changes
 *   --verbose   Log each slug generation
 */

import { parseArgs } from 'node:util';
import { getPool } from '@/lib/db';
import { slugify } from '@/lib/utils/slugify';

const args = parseArgs({
  options: {
    dryRun: { type: 'boolean', short: 'd' },
    verbose: { type: 'boolean', short: 'v' },
  },
  strict: false,
});

const dryRun = args.values.dryRun;
const verbose = args.values.verbose;

async function run() {
  const pool = await getPool();
  const client = await pool.connect();

  try {
    // Fetch all yachts with empty or NULL slug
    const result = await client.query(
      `SELECT id, model_name FROM yacht_models WHERE slug IS NULL OR slug = ''`
    );
    const yachts = result.rows;
    console.log(`Found ${yachts.length} yachts with missing slugs.`);

    if (yachts.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    if (dryRun) {
      console.log('DRY RUN: No changes will be made.\n');
    }

    for (const yacht of yachts) {
      const { id, model_name } = yacht;
      const baseSlug = model_name?.trim();
      if (!baseSlug) {
        console.warn(`Yacht ID ${id} has no model_name; skipping.`);
        continue;
      }
      const newSlug = slugify(baseSlug);
      if (!newSlug) {
        console.warn(`Yacht ID ${id} could not generate slug from model_name: "${baseSlug}"`);
        continue;
      }

      if (verbose) {
        console.log(`Yacht ID ${id}: "${model_name}" -> "${newSlug}"`);
      }

      if (!dryRun) {
        const update = await client.query(
          `UPDATE yacht_models SET slug = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
          [newSlug, id]
        );
        if (update.rowCount === 0) {
          console.warn(`Failed to update yacht ID ${id}`);
        }
      }
    }

    if (!dryRun) {
      console.log(`\nBackfill complete. Updated ${yachts.length} records.`);
    } else {
      console.log(`\nDry run complete. Run without --dry-run to apply.`);
    }
  } finally {
    client.release();
  }
}

run().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
