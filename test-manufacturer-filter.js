const { neon } = require('@neondatabase/serverless');

const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function run() {
  const sql = neon(connectionString);

  // Check manufacturers
  const manufacturers = await sql`
    SELECT id, name FROM manufacturers ORDER BY id
  `;
  console.log('Manufacturers:', manufacturers);

  // Check yachts count total
  const totalYachts = await sql`
    SELECT COUNT(*) as count FROM yacht_models
  `;
  console.log('Total yachts:', totalYachts[0].count);

  // Check yachts with manufacturer_id not null and with a manufacturer that exists
  const withMfg = await sql`
    SELECT COUNT(*) as count FROM yacht_models WHERE manufacturer_id IS NOT NULL
  `;
  console.log('Yachts with non-null manufacturer_id:', withMfg[0].count);

  // For each manufacturer, count yachts
  for (const m of manufacturers) {
    const countResult = await sql`
      SELECT COUNT(*) as count FROM yacht_models WHERE manufacturer_id = ${m.id}
    `;
    console.log(`Manufacturer ${m.id} (${m.name}): ${countResult[0].count} yachts`);
  }

  // Test the ANY filter as the server does
  if (manufacturers.length > 0) {
    const testIds = manufacturers.slice(0, 2).map(m => m.id);
    console.log('Testing ANY filter with IDs:', testIds);
    const anyResult = await sql`
      SELECT COUNT(*) as count FROM yacht_models WHERE manufacturer_id = ANY(${testIds})
    `;
    console.log('Count via ANY:', anyResult[0].count);
  }

  await sql.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
