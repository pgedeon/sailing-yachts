/**
 * Test OCI PostgreSQL connection via pg driver
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
    ? { rejectUnauthorized: false }
    : undefined,
});

(async () => {
  const client = await pool.connect();
  try {
    const countRes = await client.query('SELECT COUNT(*) as count FROM yacht_models LEFT JOIN manufacturers ON yacht_models.manufacturer_id = manufacturers.id');
    console.log('Count:', countRes.rows[0].count);
    const rows = await client.query('SELECT id, model_name, slug FROM yacht_models ORDER BY id');
    console.log('All yachts:');
    rows.rows.forEach(r => console.log(`ID ${r.id}: ${r.model_name}, slug: ${r.slug || 'null'}`));
  } finally {
    client.release();
    await pool.end();
  }
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
