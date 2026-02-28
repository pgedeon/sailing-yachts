const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { eq, inArray, and, count, gte, lte, sql } = require('drizzle-orm');

// Load schema
const schema = require('./drizzle/schema');

const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function testQuery() {
  const sqlDb = neon(connectionString);
  const db = drizzle(sqlDb, { schema });

  const { yachtModels, manufacturers, specValues, specCategories } = schema;

  // Simulate the exact GET logic with no filters
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

  // No filters applied

  // Get count
  const countResult = await db
    .select({ count: count() })
    .from(query.as('count_subquery'));
  const total = Number(countResult[0]?.count || 0);
  console.log('Total count from Drizzle query:', total);

  // Get actual rows
  const results = await query;
  console.log('Rows returned:', results.length);
  results.forEach(r => {
    console.log(`ID ${r.yacht.id}: ${r.yacht.modelName}, slug: ${r.yacht.slug || 'null'}`);
  });

  await sqlDb.end();
}

testQuery().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
