/**
 * Edge-safe database module.
 * Only contains the Drizzle + neon-http instance (no pg dependency).
 * Safe to import from Edge runtime routes.
 */
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../drizzle/schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  return connectionString;
}

export function getDb() {
  if (!dbInstance) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) {
      return null as any;
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
    const instance = getDb() as any;
    if (!instance) {
      throw new Error("Cannot access database during build (DATABASE_URL is not set)");
    }
    const value = instance[prop];
    if (typeof value === "function") {
      return (...args: any[]) => value.apply(instance, args);
    }
    return value;
  },
}) as any;

// Re-export all tables and schemas for direct imports
export * from "../drizzle/schema";
