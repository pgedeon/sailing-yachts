import { pgTable, text } from "drizzle-orm/pg-core";

export const specCategories = pgTable("spec_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});