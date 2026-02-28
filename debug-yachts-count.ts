import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, count } from 'drizzle-orm';
import { db, yachtModels, manufacturers } from './lib/db';

async function run() {
  // Do not use the imported db (which uses connection string from env). Instead create a new connection with explicit string to avoid .env differences.
  const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const sqlDb = neon(connectionString);
  const myDb = drizzle(sqlDb);

  // Use the schema from lib/db's exported tables? Actually those are from drizzle/schema. We can import the actual schema objects.
  const { yachtModels: YM, manufacturers: M } = await import('./drizzle/schema');

  // Simulate API with empty filters
  let query = myDb
    .select({
      yacht: YM,
      manufacturer: M.name,
    })
    .from(YM)
    .leftJoin(
      M,
      eq(YM.manufacturerId, M.id),
    );

  // Count via subquery
  const countResult = await myDb
    .select({ count: count() })
    .from(query.as('count_subquery'));
  console.log('Total count from subquery:', Number(countResult[0]?.count || 0));

  // Direct count on base join
  const directCountResult = await myDb
    .select({ count: count() })
    .from(YM)
    .leftJoin(
      M,
      eq(YM.manufacturerId, M.id)
    );
  console.log('Direct count from base join:', Number(directCountResult[0]?.count || 0));

  // Fetch rows
  const rows = await query;
  console.log('Rows fetched:', rows.length);
  rows.forEach(r => console.log(`ID ${r.yacht.id}: ${r.yacht.modelName}, slug: ${r.yacht.slug ?? 'null'}`));

  await sqlDb.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
