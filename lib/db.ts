import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../drizzle/schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const sql = neon(connectionString);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

// Proxy that forwards both methods and properties
export const db = new Proxy({}, {
  get(_, prop: string | symbol) {
    if (typeof prop === "symbol") return undefined;
    const dbInstance = getDb() as any;
    const value = dbInstance[prop];
    if (typeof value === "function") {
      return (...args: any[]) => value.apply(dbInstance, args);
    }
    return value;
  },
}) as any;

// Export getDb for direct usage in serverless functions where proxy may cause issues
export { getDb };

// Re-export all tables and schemas for direct imports
export * from "../drizzle/schema";
