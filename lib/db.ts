import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";
import dotenv from "dotenv";

// Load environment variables from .env and .env.local
dotenv.config();

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });

// Re-export all tables and types
export * from "../drizzle/schema";
