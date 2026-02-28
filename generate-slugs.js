const { Pool } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

function generateSlug(modelName, manufacturer) {
  return (manufacturer.toLowerCase() + '-' + modelName.toLowerCase())
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function updateSlugs() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, model_name, manufacturer_id FROM yacht_models WHERE slug IS NULL');
    console.log('Found', result.rows.length, 'yachts without slugs');
    
    for (const yacht of result.rows) {
      const mfgrResult = await client.query('SELECT name FROM manufacturers WHERE id = $1', [yacht.manufacturer_id]);
      const manufacturerName = mfgrResult.rows[0]?.name || 'unknown';
      const slug = generateSlug(yacht.model_name, manufacturerName);
      await client.query('UPDATE yacht_models SET slug = $1 WHERE id = $2', [slug, yacht.id]);
      console.log('Updated ID', yacht.id, 'slug:', slug);
    }
    
    const verify = await client.query('SELECT id, model_name, slug FROM yacht_models ORDER BY id');
    console.log('All yachts after update:');
    verify.rows.forEach(y => console.log('ID', y.id, y.model_name, '→', y.slug || '(null)'));
    console.log('Total:', verify.rows.length);
  } finally {
    client.release();
    pool.end();
  }
}

updateSlugs().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
