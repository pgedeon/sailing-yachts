const { Pool } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function testDelete() {
  const client = await pool.connect();
  try {
    const yachtId = 30;
    const before = await client.query('SELECT * FROM yacht_models WHERE id = $1', [yachtId]);
    console.log('Before delete:', before.rows.length ? 'Found' : 'Not found');

    const result = await client.query('DELETE FROM yacht_models WHERE id = $1', [yachtId]);
    console.log('Delete result:', result);

    const after = await client.query('SELECT * FROM yacht_models WHERE id = $1', [yachtId]);
    console.log('After delete:', after.rows.length ? 'Still exists' : 'Deleted');
  } catch (err) {
    console.error(err.message);
  } finally {
    client.release();
    pool.end();
  }
}

testDelete();
