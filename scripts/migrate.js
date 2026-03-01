#!/usr/bin/env node
/**
 * Database migration runner for sailing-yachts app.
 * Runs pending Drizzle migrations to ensure schema is up-to-date.
 *
 * Usage: node scripts/migrate.js
 */

import { migrate } from 'drizzle-kit';
import { defineConfig } from 'drizzle-kit';
import { readFileSync } from 'fs';
import { join } from 'path';

const configPath = join(process.cwd(), 'drizzle.config.ts');
const configContent = readFileSync(configPath, 'utf-8');
// eslint-disable-next-line no-eval
const config = eval(configContent).default;

async function run() {
  console.log('Running database migrations...');
  try {
    await migrate(config, { push: true });
    console.log('Migrations completed successfully.');
    process.exit(0);
  } catch (err: any) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
