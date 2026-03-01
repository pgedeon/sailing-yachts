import { migrate } from "drizzle-orm/migrate";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import path from "path";

async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = neon(dbUrl);
  const db = drizzle(sql);

  // Run all pending migrations from ./drizzle/migrations
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle/migrations"),
  });

  console.log("✅ Drizzle migrations applied successfully");
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
