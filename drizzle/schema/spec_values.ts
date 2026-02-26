import { pgTable, serial, integer, numeric, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { yachtModels } from "./yachts";
import { specCategories } from "./spec_categories";

export const specValues = pgTable(
  "spec_values",
  {
    id: serial("id").primaryKey(),
    yachtModelId: integer("yacht_model_id")
      .notNull()
      .references(() => yachtModels.id, { onDelete: "cascade" }),
    specCategoryId: integer("spec_category_id")
      .notNull()
      .references(() => specCategories.id, { onDelete: "cascade" }),
    valueText: text("value_text"),
    valueNumeric: numeric("value_numeric", { precision: 12, scale: 4 }),
  },
  (table) => ({
    idxYacht: index("idx_spec_values_yacht").on(table.yachtModelId),
    idxCategory: index("idx_spec_values_category").on(table.specCategoryId),
    uniqYachtCategory: uniqueIndex("uniq_spec_values_yacht_category").on(
      table.yachtModelId,
      table.specCategoryId,
    ),
  }),
);

export const insertSpecValueSchema = createInsertSchema(specValues);
export const selectSpecValueSchema = createSelectSchema(specValues);
