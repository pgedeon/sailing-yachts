import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../drizzle/schema";

let dbInstance: any = null;

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

// Proxy to lazily initialize DB and forward all method calls
export const db = new Proxy({}, {
  get(_, prop: string | symbol) {
    if (typeof prop === "symbol") return undefined;
    return (...args: any[]) => getDb()[prop](...args);
  },
}) as any;
