import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql, and } from 'drizzle-orm';
import { yachtModels, manufacturers } from './drizzle/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function run() {
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);

  // Build base query like in the API
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

  // Apply manufacturer filter using ANY as in the route
  const filters = { manufacturers: [23, 24] };
  const conditions: any[] = [];

  if (filters.manufacturers && Array.isArray(filters.manufacturers) && filters.manufacturers.length > 0) {
    conditions.push(sql`${yachtModels.manufacturerId} = ANY(${filters.manufacturers})`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Optionally, see the SQL
  const sqlQuery = query.sql();
  console.log('Generated SQL:');
  console.log(sqlQuery.sql);
  console.log('Params:', sqlQuery.params);

  // Execute
  const results = await query;
  console.log('Results count:', results.length);
  console.log('Results:', JSON.stringify(results, null, 2));

  await sqlClient.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
