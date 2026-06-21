import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, count } from 'drizzle-orm';
import { yachtModels, manufacturers } from './drizzle/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
    ? { rejectUnauthorized: false }
    : undefined,
});

async function run() {
  const db = drizzle(pool);

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

  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
