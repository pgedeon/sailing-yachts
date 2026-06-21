/**
 * Test drizzle filter queries via pg driver
 */
require('dotenv').config();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq, sql, and } = require('drizzle-orm');
const { yachtModels, manufacturers } = require('./drizzle/schema');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
    ? { rejectUnauthorized: false }
    : undefined,
});

async function run() {
  const db = drizzle(pool);

  const result = await db
    .select({ yacht: yachtModels, manufacturer: manufacturers.name })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .limit(5);

  console.log('Sample results:');
  for (const row of result) {
    console.log(`  ${row.manufacturer} ${row.yacht.modelName}`);
  }

  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
