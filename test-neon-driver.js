const { neon } = require('@neondatabase/serverless');
const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';
(async () => {
  const sql = neon(connectionString);
  try {
    const countRes = await sql`SELECT COUNT(*) as count FROM yacht_models LEFT JOIN manufacturers ON yacht_models.manufacturer_id = manufacturers.id`;
    console.log('Count (neon driver):', countRes[0].count);
    const rows = await sql`SELECT id, model_name, slug FROM yacht_models ORDER BY id`;
    console.log('All yachts:');
    rows.forEach(r => console.log(`ID ${r.id}: ${r.model_name}, slug: ${r.slug || 'null'}`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sql.end();
  }
})();
