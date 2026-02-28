import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, count } from 'drizzle-orm';
import { yachtModels, manufacturers } from './drizzle/schema.ts';

const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function test() {
  const sqlDb = neon(connectionString);
  const db = drizzle(sqlDb);

  // Build base queries as in the API
  let query = db
    .select({ yacht: yachtModels, manufacturer: manufacturers.name })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id));

  let countQuery = db
    .select({ count: count() })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id));

  // Execute both
  const [countRes, rows] = await Promise.all([
    countQuery,
    query,
  ]);

  console.log('Count result:', Number(countRes[0]?.count || 0));
  console.log('Rows fetched:', rows.length);
  // await sqlDb.end();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
