import { pgTable, serial, varchar, numeric, integer, text, timestamp, index, uniqueIndex, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { manufacturers } from "./manufacturers";

export const yachtModels = pgTable(
  "yacht_models",
  {
    id: serial("id").primaryKey(),
    manufacturerId: integer("manufacturer_id")
      .notNull()
      .references(() => manufacturers.id, { onDelete: "cascade" }),
    modelName: varchar("model_name", { length: 255 }).notNull(),
    year: integer("year").notNull(),
    slug: varchar("slug", { length: 500 }).unique(),

    // Core numeric specs (indexed)
    lengthOverall: numeric("length_overall", { precision: 5, scale: 2 }),
    beam: numeric("beam", { precision: 5, scale: 2 }),
    draft: numeric("draft", { precision: 5, scale: 2 }),
    displacement: numeric("displacement", { precision: 8, scale: 2 }),
    ballast: numeric("ballast", { precision: 8, scale: 2 }),
    sailAreaMain: numeric("sail_area_main", { precision: 6, scale: 2 }),

    // Core categorical
    rigType: varchar("rig_type", { length: 100 }),
    keelType: varchar("keel_type", { length: 100 }),
    hullMaterial: varchar("hull_material", { length: 100 }),

    // Accommodation
    cabins: integer("cabins"),
    berths: integer("berths"),
    heads: integer("heads"),
    maxOccupancy: integer("max_occupancy"),

    // Technical
    engineHp: numeric("engine_hp", { precision: 6, scale: 2 }),
    engineType: varchar("engine_type", { length: 100 }),
    fuelCapacity: numeric("fuel_capacity", { precision: 6, scale: 2 }),
    waterCapacity: numeric("water_capacity", { precision: 6, scale: 2 }),

    // Metadata
    designNotes: text("design_notes"),
    description: text("description"),
    sourceUrl: varchar("source_url", { length: 500 }),
    sourceAttribution: text("source_attribution"),
    adminLinks:
      jsonb("admin_links").$type<Array<{ label: string; url: string }>>(),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    idxManufacturer: index("idx_yacht_models_manufacturer").on(
      table.manufacturerId,
    ),
    idxSlug: uniqueIndex("idx_yacht_models_slug").on(table.slug),
    idxLength: index("idx_yacht_models_length").on(table.lengthOverall),
    idxDisplacement: index("idx_yacht_models_displacement").on(
      table.displacement,
    ),
    idxRig: index("idx_yacht_models_rig").on(table.rigType),
    idxKeel: index("idx_yacht_models_keel").on(table.keelType),
  }),
);

// Zod schemas
export const insertYachtModelSchema = createInsertSchema(yachtModels);
export const selectYachtModelSchema = createSelectSchema(yachtModels);
