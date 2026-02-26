import { describe, it, expect } from "vitest";
import { db } from "../lib/db";
import { yachtModels, manufacturers, specCategories } from "../drizzle/schema";
import { sql } from "drizzle-orm";

describe("Database Connection", () => {
  it("should be able to connect to the database", async () => {
    const result = await db.select().from(yachtModels).limit(1);
    expect(result).toBeDefined();
  });

  it("should have seeded manufacturers", async () => {
    const count = await db.select({ count: sql`count(*)` }).from(manufacturers);
    expect(Number(count[0].count)).toBeGreaterThan(0);
  });

  it("should have seeded yachts", async () => {
    const count = await db.select({ count: sql`count(*)` }).from(yachtModels);
    expect(Number(count[0].count)).toBeGreaterThan(0);
  });

  it("should have spec categories", async () => {
    const count = await db
      .select({ count: sql`count(*)` })
      .from(specCategories);
    expect(Number(count[0].count)).toBeGreaterThan(0);
  });
});
