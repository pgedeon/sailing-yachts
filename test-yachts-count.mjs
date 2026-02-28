import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, count } from 'drizzle-orm';
import { yachtModels, manufacturers } from './drizzle/schema';

const connectionString = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function run() {
  const sql = neon(connectionString);
  const db = drizzle(sql);

  // Build the exact base query from /api/yachts (no filters)
  let query = db
    .select({
      yacht: yachtModels,
      manufacturer: manufacturers.name,
    })
    .from(yachtModels)
    .leftJoin(
      manufacturers,
      eq(yachtModels.manufacturerId, manufacturers.id)
    );

  // Count via subquery
  const countResult = await db
    .select({ count: count() })
    .from(query.as('count_subquery'));
  const total = Number(countResult[0]?.count || 0);
  console.log('Total from count subquery:', total);

  // Direct fetch
  const rows = await query;
  console.log('Rows fetched:', rows.length);

  await sql.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
