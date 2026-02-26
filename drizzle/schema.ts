import {
  pgTable,
  text,
  integer,
  varchar,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Manufacturers table
export const manufacturers = pgTable(
  "manufacturers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    country: varchar("country", { length: 100 }),
    foundedYear: integer("founded_year"),
    website: varchar("website", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    idxName: uniqueIndex("idx_manufacturers_name").on(table.name),
  }),
);

// Yacht models table
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

// Spec categories (dictionary)
export const specCategories = pgTable(
  "spec_categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    unit: varchar("unit", { length: 50 }),
    dataType: varchar("data_type", { length: 20 }).notNull(), // 'numeric' or 'text'
    categoryGroup: varchar("category_group", { length: 100 }),
    displayOrder: integer("display_order").default(0),
    isFilterable: boolean("is_filterable").default(true),
    isSortable: boolean("is_sortable").default(false),
    isComparable: boolean("is_comparable").default(true),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    idxGroup: index("idx_spec_categories_group").on(table.categoryGroup),
  }),
);

// Spec values (dynamic)
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

// Images
export const images = pgTable(
  "images",
  {
    id: serial("id").primaryKey(),
    yachtModelId: integer("yacht_model_id")
      .notNull()
      .references(() => yachtModels.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 1000 }).notNull(),
    caption: text("caption"),
    isPrimary: boolean("is_primary").default(false),
    altText: varchar("alt_text", { length: 500 }),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    idxYacht: index("idx_images_yacht").on(table.yachtModelId),
  }),
);

// Reviews (optional)
export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    yachtModelId: integer("yacht_model_id")
      .notNull()
      .references(() => yachtModels.id, { onDelete: "cascade" }),
    source: varchar("source", { length: 100 }),
    rating: numeric("rating", { precision: 2, scale: 1 }),
    summary: text("summary"),
    fullText: text("full_text"),
    reviewDate: timestamp("review_date"),
    authorName: varchar("author_name", { length: 200 }),
    sourceUrl: varchar("source_url", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    idxYacht: index("idx_reviews_yacht").on(table.yachtModelId),
  }),
);

// ---------- Zod Schemas for validation ----------

export const insertManufacturerSchema = createInsertSchema(manufacturers);
export const selectManufacturerSchema = createSelectSchema(manufacturers);

export const insertYachtModelSchema = createInsertSchema(yachtModels);
export const selectYachtModelSchema = createSelectSchema(yachtModels);

export const insertSpecCategorySchema = createInsertSchema(specCategories);
export const selectSpecCategorySchema = createSelectSchema(specCategories);

export const insertSpecValueSchema = createInsertSchema(specValues);
export const selectSpecValueSchema = createSelectSchema(specValues);

export const insertImageSchema = createInsertSchema(images);
export const selectImageSchema = createSelectSchema(images);

export const insertReviewSchema = createInsertSchema(reviews);
export const selectReviewSchema = createSelectSchema(reviews);
