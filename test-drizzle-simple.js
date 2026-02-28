const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { eq, count } = require('drizzle-orm');
const schema = require('./drizzle/schema');

const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function run() {
  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });

  const { yachtModels, manufacturers } = schema;

  // Build the exact base query from app/api/yachts/route.ts
  let query = db
    .select({
      yacht: yachtModels,
      manufacturer: manufacturers.name,
    })
    .from(yachtModels)
    .leftJoin(
      manufacturers,
      eq(yachtModels.manufacturerId, manufacturers.id),
    );

  // No filters

  // Get count the same way as the api
  const countResult = await db
    .select({ count: count() })
    .from(query.as('count_subquery'));
  const total = Number(countResult[0]?.count || 0);
  console.log('Total count (Drizzle):', total);

  const results = await query;
  console.log('Rows fetched:', results.length);
  results.forEach(r => console.log(`ID ${r.yacht.id}: ${r.yacht.modelName}, slug: ${r.yacht.slug || 'null'}`));

  await sql.end();
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
