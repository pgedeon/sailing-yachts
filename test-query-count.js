const { Pool } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

(async () => {
  const client = await pool.connect();
  try {
    // Count exactly as Drizzle would for the base query (no filters)
    const countResult = await client.query(`
      SELECT COUNT(*) AS count
      FROM (
        SELECT yacht_models.id
        FROM yacht_models
        LEFT JOIN manufacturers ON yacht_models.manufacturer_id = manufacturers.id
      ) AS count_subquery
    `);
    const total = parseInt(countResult.rows[0].count, 10);
    console.log('Count from subquery:', total);

    // Count using COUNT(*) over the join directly
    const countResult2 = await client.query(`
      SELECT COUNT(*) AS count
      FROM yacht_models
      LEFT JOIN manufacturers ON yacht_models.manufacturer_id = manufacturers.id
    `);
    console.log('Count directly on join:', countResult2.rows[0].count);

    // Count yacht_models only
    const countResult3 = await client.query('SELECT COUNT(*) FROM yacht_models');
    console.log('Count yacht_models only:', countResult3.rows[0].count);

    // Fetch the rows as Drizzle would (select all columns from yacht_models + manufacturers.name)
    const rows = await client.query(`
      SELECT yacht_models.*, manufacturers.name AS manufacturer
      FROM yacht_models
      LEFT JOIN manufacturers ON yacht_models.manufacturer_id = manufacturers.id
      ORDER BY yacht_models.id
    `);
    console.log('Rows fetched:', rows.rows.length);
    rows.rows.forEach(r => console.log(`ID ${r.id}: ${r.model_name}, manufacturer: ${r.manufacturer}, slug: ${r.slug}`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
})();
