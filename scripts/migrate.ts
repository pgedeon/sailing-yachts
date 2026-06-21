import { migrate } from "drizzle-orm/migrate";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import path from "path";

async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  // Run all pending migrations from ./drizzle/migrations
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle/migrations"),
  });

  await pool.end();
  console.log("✅ Drizzle migrations applied successfully");
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
