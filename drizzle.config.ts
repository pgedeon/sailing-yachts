import { defineConfig } from "drizzle-kit";
export default defineConfig({
  out: "./drizzle/migrations",
  schema: "./drizzle/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
});
