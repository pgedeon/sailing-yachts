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
    websiteUrl: varchar("website_url", { length: 500 }),
    description: text("description"),
    logoUrl: varchar("logo_url", { length: 500 }),
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

// Newsletter subscribers
export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    confirmed: boolean("confirmed").default(false),
    source: varchar("source", { length: 100 }).default("website"),
    createdAt: timestamp("created_at").defaultNow(),
    confirmedAt: timestamp("confirmed_at"),
  },
  (table) => ({
    idxEmail: uniqueIndex("idx_newsletter_email").on(table.email),
    idxConfirmed: index("idx_newsletter_confirmed").on(table.confirmed),
  }),
);

// Articles / Guides
export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    excerpt: varchar("excerpt", { length: 1000 }),
    content: text("content"),
    contentMarkdown: text("content_markdown"),
    category: varchar("category", { length: 100 }),
    author: varchar("author", { length: 255 }),
    authorTitle: varchar("author_title", { length: 255 }),
    featuredImage: varchar("featured_image", { length: 500 }),
    readingTimeMinutes: integer("reading_time_minutes"),
    buyingGuideTemplateId: varchar("buying_guide_template_id", { length: 100 }),
    isPublished: boolean("is_published").default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    idxSlug: uniqueIndex("idx_articles_slug").on(table.slug),
    idxCategory: index("idx_articles_category").on(table.category),
    idxPublished: index("idx_articles_published").on(table.isPublished),
  }),
);

// Search intents for P6.9: Search intent pages from real usage
export const searchIntents = pgTable(
  "search_intents",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    metaDescription: varchar("meta_description", { length: 500 }),
    intro: text("intro").notNull(),
    icon: varchar("icon", { length: 50 }).default("🔍"),
    filters: jsonb("filters").$type<{
      lengthMin?: number;
      lengthMax?: number;
      cabinsMin?: number;
      cabinsMax?: number;
      keelType?: string;
      rigType?: string;
      hullMaterial?: string;
      displacementMin?: number;
      displacementMax?: number;
    }>(),
    maxResults: integer("max_results").default(12),
    category: varchar("category", { length: 100 }),
    isPublished: boolean("is_published").default(false),
    searchQuery: varchar("search_query", { length: 500 }),
    searchCount: integer("search_count").default(0),
    lastSearchedAt: timestamp("last_searched_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    idxSlug: uniqueIndex("idx_search_intents_slug").on(table.slug),
    idxPublished: index("idx_search_intents_published").on(table.isPublished),
    idxSearchCount: index("idx_search_intents_search_count").on(
      table.searchCount,
    ),
    idxCategory: index("idx_search_intents_category").on(table.category),
  }),
);

// Manufacturer spotlights for P7.3: Long-form builder pages
export const manufacturerSpotlights = pgTable(
  "manufacturer_spotlights",
  {
    id: serial("id").primaryKey(),
    manufacturerId: integer("manufacturer_id")
      .notNull()
      .references(() => manufacturers.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    metaDescription: varchar("meta_description", { length: 500 }),
    historyMarkdown: text("history_markdown").notNull(),
    brandPositioning: text("brand_positioning"),
    notableModels:
      jsonb("notable_models").$type<
        Array<{ yacht_slug: string; reason: string }>
      >(),
    milestones:
      jsonb("milestones").$type<Array<{ year: number; event: string }>>(),
    isPublished: boolean("is_published").default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    idxManufacturer: uniqueIndex("idx_manufacturer_spotlights_manufacturer").on(
      table.manufacturerId,
    ),
    idxSlug: uniqueIndex("idx_manufacturer_spotlights_slug").on(table.slug),
    idxPublished: index("idx_manufacturer_spotlights_published").on(
      table.isPublished,
    ),
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

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers);
export const selectNewsletterSubscriberSchema = createSelectSchema(newsletterSubscribers);

export const insertArticleSchema = createInsertSchema(articles);
export const selectArticleSchema = createSelectSchema(articles);

export const insertSearchIntentSchema = createInsertSchema(searchIntents);
export const selectSearchIntentSchema = createSelectSchema(searchIntents);

export const insertManufacturerSpotlightSchema = createInsertSchema(manufacturerSpotlights);
export const selectManufacturerSpotlightSchema = createSelectSchema(manufacturerSpotlights);

// FAQ Proposals for P7.6: FAQ harvesting pipeline
export const faqProposals = pgTable(
  "faq_proposals",
  {
    id: serial("id").primaryKey(),
    source: varchar("source", { length: 50 }).notNull().default("search"),
    sourceQuery: text("source_query"),
    question: text("question").notNull(),
    suggestedAnswer: text("suggested_answer"),
    category: varchar("category", { length: 100 }),
    intentType: varchar("intent_type", { length: 50 }),
    frequency: integer("frequency").notNull().default(1),
    priorityScore: numeric("priority_score", { precision: 5, scale: 2 }).notNull().default("0"),
    status: varchar("status", { length: 30 }).notNull().default("proposed"),
    relatedYachtSlugs: jsonb("related_yacht_slugs").$type<string[]>(),
    relatedArticleSlugs: jsonb("related_article_slugs").$type<string[]>(),
    matchedSearchIntentSlug: varchar("matched_search_intent_slug", { length: 255 }),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => ({
    idxStatus: index("idx_faq_proposals_status").on(table.status),
    idxSource: index("idx_faq_proposals_source").on(table.source),
    idxPriority: index("idx_faq_proposals_priority").on(table.priorityScore),
    idxCategory: index("idx_faq_proposals_category").on(table.category),
  }),
);

// Compare usage tracking for P7.6
export const compareUsage = pgTable(
  "compare_usage",
  {
    id: serial("id").primaryKey(),
    yachtSlugA: varchar("yacht_slug_a", { length: 255 }).notNull(),
    yachtSlugB: varchar("yacht_slug_b", { length: 255 }).notNull(),
    compareCount: integer("compare_count").notNull().default(1),
    lastComparedAt: timestamp("last_compared_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxUnique: uniqueIndex("idx_compare_usage_unique").on(table.yachtSlugA, table.yachtSlugB),
    idxCount: index("idx_compare_usage_count").on(table.compareCount),
  }),
);

export const insertFaqProposalSchema = createInsertSchema(faqProposals);
export const selectFaqProposalSchema = createSelectSchema(faqProposals);
export const insertCompareUsageSchema = createInsertSchema(compareUsage);
export const selectCompareUsageSchema = createSelectSchema(compareUsage);

// P8.1: Price data schema for yacht pricing intelligence
export const yachtPrices = pgTable(
  "yacht_prices",
  {
    id: serial("id").primaryKey(),
    yachtModelId: integer("yacht_model_id").notNull().references(() => yachtModels.id, { onDelete: "cascade" }),
    priceMin: numeric("price_min", { precision: 12, scale: 2 }).notNull(),
    priceMax: numeric("price_max", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    condition: varchar("condition", { length: 20 }).notNull().default("new"),
    year: integer("year"),
    source: varchar("source", { length: 255 }).notNull(),
    sourceType: varchar("source_type", { length: 30 }).notNull().default("manual"),
    sourceUrl: varchar("source_url", { length: 500 }),
    confidenceScore: integer("confidence_score").notNull().default(50),
    notes: text("notes"),
    effectiveDate: timestamp("effective_date", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxYachtId: index("idx_yacht_prices_yacht_id").on(table.yachtModelId),
    idxCondition: index("idx_yacht_prices_condition").on(table.condition),
    idxActive: index("idx_yacht_prices_active").on(table.isActive),
    idxEffective: index("idx_yacht_prices_effective_date").on(table.effectiveDate),
    idxSourceType: index("idx_yacht_prices_source_type").on(table.sourceType),
    idxUnique: uniqueIndex("idx_yacht_prices_unique").on(table.yachtModelId, table.condition, table.source, table.effectiveDate),
  }),
);

export const priceSnapshots = pgTable(
  "price_snapshots",
  {
    id: serial("id").primaryKey(),
    yachtModelId: integer("yacht_model_id").notNull().references(() => yachtModels.id, { onDelete: "cascade" }),
    priceMin: numeric("price_min", { precision: 12, scale: 2 }).notNull(),
    priceMax: numeric("price_max", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    condition: varchar("condition", { length: 20 }).notNull().default("new"),
    sourceType: varchar("source_type", { length: 30 }).notNull().default("manual"),
    confidenceScore: integer("confidence_score").notNull().default(50),
    snapshotDate: timestamp("snapshot_date", { withTimezone: true }).notNull().defaultNow(),
    snapshotReason: varchar("snapshot_reason", { length: 30 }).notNull().default("scheduled"),
    recordCount: integer("record_count").default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxYachtId: index("idx_price_snapshots_yacht_id").on(table.yachtModelId),
    idxDate: index("idx_price_snapshots_date").on(table.snapshotDate),
    idxYachtDate: index("idx_price_snapshots_yacht_date").on(table.yachtModelId, table.snapshotDate),
    idxCondition: index("idx_price_snapshots_condition").on(table.condition),
  }),
);

export const insertYachtPriceSchema = createInsertSchema(yachtPrices);
export const selectYachtPriceSchema = createSelectSchema(yachtPrices);
export const insertPriceSnapshotSchema = createInsertSchema(priceSnapshots);
export const selectPriceSnapshotSchema = createSelectSchema(priceSnapshots);
