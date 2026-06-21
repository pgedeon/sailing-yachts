/**
 * Test manufacturer filter query via pg driver
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
    ? { rejectUnauthorized: false }
    : undefined,
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT m.name, COUNT(y.id) as yacht_count
      FROM manufacturers m
      LEFT JOIN yacht_models y ON y.manufacturer_id = m.id
      GROUP BY m.name
      ORDER BY yacht_count DESC
    `);
    console.log('Manufacturer counts:');
    res.rows.forEach(r => console.log(`  ${r.name}: ${r.yacht_count}`));
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
