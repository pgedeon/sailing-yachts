import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";

export const yachts = pgTable("yachts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  manufacturer: text("manufacturer").notNull(),
  lengthOverall: real("length_overall"),
  beam: real("beam"),
  draft: real("draft"),
  displacement: integer("displacement"),
  year: integer("year"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
