import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, count, inArray, gte, lte, sql, and } from 'drizzle-orm';
import * as schema from './drizzle/schema';

const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

async function run() {
  const sqlDb = neon(connectionString);
  const db = drizzle(sqlDb, { schema });

  const { yachtModels, manufacturers, specValues, specCategories } = schema;

  // Simulate API with empty filters
  const filters = {};
  const sortBy = 'lengthOverall';
  const sortOrder = 'asc';

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

  // Apply no filters

  // Count via subquery method (like the API)
  const countResult = await db
    .select({ count: count() })
    .from(query.as('count_subquery'));
  const total = Number(countResult[0]?.count || 0);
  console.log('Total count from subquery:', total);

  // Direct count on base join
  const directCountResult = await db
    .select({ count: count() })
    .from(yachtModels)
    .leftJoin(
      manufacturers,
      eq(yachtModels.manufacturerId, manufacturers.id)
    );
  console.log('Direct count from base join:', Number(directCountResult[0]?.count || 0));

  // Fetch rows to see IDs
  const rows = await query;
  console.log('Rows fetched:', rows.length);
  rows.forEach(r => console.log(`ID ${r.yacht.id}: ${r.yacht.modelName}, slug: ${r.yacht.slug}`));

  await sqlDb.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
