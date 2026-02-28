const { Pool } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

(async () => {
  const client = await pool.connect();
  try {
    const countRes = await client.query(`
      SELECT COUNT(*) as total
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
    `);
    console.log('Total count from simple join:', countRes.rows[0].total);

    const rowsRes = await client.query(`
      SELECT y.id, y.model_name, y.slug, m.name as manufacturer
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      ORDER BY y.id
    `);
    console.log('All yachts:');
    rowsRes.rows.forEach(r => console.log(`ID ${r.id}: ${r.manufacturer} ${r.model_name}, slug: ${r.slug || 'null'}`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
})();
