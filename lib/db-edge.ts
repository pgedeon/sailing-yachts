/**
 * Edge-safe database module.
 * Routes queries through OCI PostgreSQL via HTTP SQL proxy when DATABASE_PROXY_URL is set.
 * Falls back to direct Neon connection when no proxy is configured.
 * Safe to import from Edge runtime routes.
 */
import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "../drizzle/schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let proxyConfigured = false;

function getDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  return connectionString;
}

function configureProxy() {
  if (proxyConfigured) return;
  proxyConfigured = true;
  const proxyUrl = process.env.DATABASE_PROXY_URL;
  if (proxyUrl) {
    // Route all SQL queries through our OCI HTTP SQL proxy
    neonConfig.fetchEndpoint = proxyUrl;
  }
}

export function getDb() {
  if (!dbInstance) {
    configureProxy();
    const connectionString = getDatabaseUrl();
    if (!connectionString) {
      return null as any;
    }
    // When using proxy, the DATABASE_URL is still used by neon() for parsing
    // but actual queries go to DATABASE_PROXY_URL via fetchEndpoint override.
    // DATABASE_URL must be a valid postgresql:// connection string format.
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
