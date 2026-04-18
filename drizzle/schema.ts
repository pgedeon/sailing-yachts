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

    // Source provenance (P10.1)
    dataSource: varchar("data_source", { length: 100 }).default("manual"),
    sourceConfidence: integer("source_confidence").default(50),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    completenessScore: integer("completeness_score"),
    mediaCount: integer("media_count").default(0),

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
    reviewType: text("review_type").notNull().default("expert"),
    verified: boolean("verified").notNull().default(false),
    ratingBreakdown: jsonb("rating_breakdown").$type<{
      build_quality: number | null;
      sailing_performance: number | null;
      comfort: number | null;
      value_for_money: number | null;
    }>().default({ build_quality: null, sailing_performance: null, comfort: null, value_for_money: null }),
    helpfulCount: integer("helpful_count").notNull().default(0),
    reviewerProfile: jsonb("reviewer_profile").$type<Record<string, unknown>>().default({}),
    pros: text("pros").array().default([]),
    cons: text("cons").array().default([]),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    idxYacht: index("idx_reviews_yacht").on(table.yachtModelId),
    idxVerified: index("idx_reviews_verified").on(table.verified),
    idxReviewType: index("idx_reviews_type").on(table.reviewType),
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


export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    message: text("message"),
    yachtIds: text("yacht_ids").notNull(),
    source: varchar("source", { length: 100 }).default("compare_page"),
    status: varchar("status", { length: 50 }).default("new"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    leadType: varchar("lead_type", { length: 50 }).default("general"),
    pageUrl: text("page_url"),
    referrer: text("referrer"),
    utmSource: varchar("utm_source", { length: 100 }),
    utmMedium: varchar("utm_medium", { length: 100 }),
    utmCampaign: varchar("utm_campaign", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    idxEmail: index("idx_leads_email").on(table.email),
    idxStatus: index("idx_leads_status").on(table.status),
    idxSource: index("idx_leads_source").on(table.source),
    idxCreated: index("idx_leads_created").on(table.createdAt),
  }),
);



// Media assets (P10.2 — Rich media support)
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: serial("id").primaryKey(),
    yachtModelId: integer("yacht_model_id")
      .notNull()
      .references(() => yachtModels.id, { onDelete: "cascade" }),
    mediaType: text("media_type").$type<"photo" | "brochure" | "deck_plan" | "interior_layout" | "video" | "360_tour" | "3d_model">().notNull().default("photo"),
    title: varchar("title", { length: 500 }),
    description: text("description"),
    url: varchar("url", { length: 1000 }),
    embedUrl: varchar("embed_url", { length: 1000 }),
    thumbnailUrl: varchar("thumbnail_url", { length: 1000 }),
    sourceUrl: varchar("source_url", { length: 1000 }),
    fileFormat: varchar("file_format", { length: 50 }),
    fileSize: integer("file_size"),
    caption: text("caption"),
    altText: varchar("alt_text", { length: 500 }),
    isPrimary: boolean("is_primary").default(false),
    sortOrder: integer("sort_order").default(0),
    dataSource: varchar("data_source", { length: 100 }).default("manual"),
    sourceConfidence: integer("source_confidence").default(50),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxYacht: index("idx_media_assets_yacht").on(table.yachtModelId),
    idxType: index("idx_media_assets_type").on(table.mediaType),
    idxPrimary: index("idx_media_assets_primary").on(table.yachtModelId),
  }),
);

export const insertMediaAssetSchema = createInsertSchema(mediaAssets);
export const selectMediaAssetSchema = createSelectSchema(mediaAssets);
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


// Import jobs for data expansion pipeline (P10.1)
export const importJobs = pgTable(
  "import_jobs",
  {
    id: serial("id").primaryKey(),
    source: varchar("source", { length: 100 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("pending"),
    totalRecords: integer("total_records").default(0),
    added: integer("added").default(0),
    duplicates: integer("duplicates").default(0),
    errors: integer("errors").default(0),
    errorDetails: jsonb("error_details"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxStatus: index("idx_import_jobs_status").on(table.status),
    idxSource: index("idx_import_jobs_source").on(table.source),
  }),
);

export const insertImportJobSchema = createInsertSchema(importJobs);
export const selectImportJobSchema = createSelectSchema(importJobs);
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

// --- Revenue Events (P8.6) ---

export const revenueEvents = pgTable(
  "revenue_events",
  {
    id: serial("id").primaryKey(),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    page: varchar("page", { length: 500 }).notNull(),
    source: varchar("source", { length: 100 }).notNull(),
    metadata: jsonb("metadata"),
    sessionId: varchar("session_id", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxEventType: index("idx_revenue_events_type").on(table.eventType),
    idxCreatedAt: index("idx_revenue_events_created").on(table.createdAt),
    idxSessionId: index("idx_revenue_events_session").on(table.sessionId),
    idxPage: index("idx_revenue_events_page").on(table.page),
  }),
);

export const insertRevenueEventSchema = createInsertSchema(revenueEvents);
export const selectRevenueEventSchema = createSelectSchema(revenueEvents);

// --- Partner Offers (P8.8) ---

export const partnerOffers = pgTable(
  "partner_offers",
  {
    id: serial("id").primaryKey(),
    manufacturerId: integer("manufacturer_id")
      .notNull()
      .references(() => manufacturers.id, { onDelete: "cascade" }),
    dealerName: varchar("dealer_name", { length: 255 }).notNull(),
    dealerType: varchar("dealer_type", { length: 50 }).notNull().default("dealer"),
    contactName: varchar("contact_name", { length: 255 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    websiteUrl: varchar("website_url", { length: 500 }),
    locationCity: varchar("location_city", { length: 255 }),
    locationCountry: varchar("location_country", { length: 255 }),
    serviceArea: varchar("service_area", { length: 500 }),
    specializations: jsonb("specializations").$type<string[]>().default([]),
    offerType: varchar("offer_type", { length: 50 }).notNull().default("new_sales"),
    offerTitle: varchar("offer_title", { length: 500 }).notNull(),
    offerDescription: text("offer_description"),
    priceRangeMin: numeric("price_range_min", { precision: 12, scale: 2 }),
    priceRangeMax: numeric("price_range_max", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
    validityStart: timestamp("validity_start", { withTimezone: true }),
    validityEnd: timestamp("validity_end", { withTimezone: true }),
    sourceConfidence: integer("source_confidence").notNull().default(3),
    dataSource: varchar("data_source", { length: 255 }).notNull().default("manual"),
    dataSourceUrl: varchar("data_source_url", { length: 500 }),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxManufacturer: index("idx_partner_offers_manufacturer").on(table.manufacturerId),
    idxOfferType: index("idx_partner_offers_offer_type").on(table.offerType),
    idxDealerType: index("idx_partner_offers_dealer_type").on(table.dealerType),
    idxActive: index("idx_partner_offers_active").on(table.isActive),
    idxLocationCountry: index("idx_partner_offers_country").on(table.locationCountry),
  }),
);

export const insertPartnerOfferSchema = createInsertSchema(partnerOffers);
export const selectPartnerOfferSchema = createSelectSchema(partnerOffers);

// Users table (P9.1 — Real auth foundation)
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    image: varchar("image", { length: 500 }),
    passwordHash: text("password_hash"),
    role: varchar("role", { length: 50 }).notNull().default("user"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    analyticsOptOut: boolean("analytics_opt_out").notNull().default(false),
    communicationOptOut: boolean("communication_opt_out").notNull().default(false),
    dataSharingConsent: boolean("data_sharing_consent").notNull().default(false),
    deletionRequestedAt: timestamp("deletion_requested_at", { withTimezone: true }),
    deletionScheduledAt: timestamp("deletion_scheduled_at", { withTimezone: true }),
  },
  (table) => ({
    idxEmail: uniqueIndex("idx_users_email").on(table.email),
    idxRole: index("idx_users_role").on(table.role),
  }),
);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// User favorites table (P9.2 — DB-backed favorites)
export const userFavorites = pgTable(
  "user_favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    yachtModelId: integer("yacht_model_id").notNull().references(() => yachtModels.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxUser: index("idx_user_favorites_user").on(table.userId),
    idxYacht: index("idx_user_favorites_yacht").on(table.yachtModelId),
    idxUnique: uniqueIndex("idx_user_favorites_unique").on(table.userId, table.yachtModelId),
  }),
);

// Saved comparisons table (P9.2)
export const savedComparisons = pgTable(
  "saved_comparisons",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }),
    yachtIds: jsonb("yacht_ids").$type<number[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxUser: index("idx_saved_comparisons_user").on(table.userId),
  }),
);

export const insertUserFavoriteSchema = createInsertSchema(userFavorites);
export const selectUserFavoriteSchema = createSelectSchema(userFavorites);
export const insertSavedComparisonSchema = createInsertSchema(savedComparisons);
export const selectSavedComparisonSchema = createSelectSchema(savedComparisons);

// Saved searches table (P9.3)
export const savedSearches = pgTable(
  "saved_searches",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }),
    searchParams: jsonb("search_params").$type<Record<string, unknown>>().notNull(),
    resultCount: integer("result_count"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxUser: index("idx_saved_searches_user").on(table.userId),
  }),
);

export const insertSavedSearchSchema = createInsertSchema(savedSearches);
export const selectSavedSearchSchema = createSelectSchema(savedSearches);

// Alert preferences (P9.4 — Email alert system)
export const alertPreferences = pgTable(
  "alert_preferences",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    alertType: varchar("alert_type", { length: 30 }).notNull(), // 'new_yachts', 'price_changes', 'new_reviews'
    enabled: boolean("enabled").notNull().default(true),
    frequency: varchar("frequency", { length: 20 }).notNull().default("daily"), // 'instant', 'daily', 'weekly'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxUser: index("idx_alert_preferences_user").on(table.userId),
    idxType: index("idx_alert_preferences_type").on(table.alertType),
    idxUnique: uniqueIndex("idx_alert_preferences_unique").on(table.userId, table.alertType),
  }),
);

// Alert log — tracks sent alerts for dedup and history
export const alertLog = pgTable(
  "alert_log",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    alertType: varchar("alert_type", { length: 30 }).notNull(),
    savedSearchId: integer("saved_search_id"),
    yachtModelId: integer("yacht_model_id"),
    title: varchar("title", { length: 500 }).notNull(),
    body: text("body"),
    emailSent: boolean("email_sent").notNull().default(false),
    emailStatus: varchar("email_status", { length: 30 }), // 'sent', 'failed', 'bounced'
    unsubscribeToken: varchar("unsubscribe_token", { length: 128 }),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxUser: index("idx_alert_log_user").on(table.userId),
    idxType: index("idx_alert_log_type").on(table.alertType),
    idxSent: index("idx_alert_log_sent").on(table.sentAt),
    idxToken: uniqueIndex("idx_alert_log_token").on(table.unsubscribeToken),
    idxDedup: index("idx_alert_log_dedup").on(table.userId, table.alertType, table.yachtModelId, table.sentAt),
  }),
);

export const insertAlertPreferenceSchema = createInsertSchema(alertPreferences);
export const selectAlertPreferenceSchema = createSelectSchema(alertPreferences);
export const insertAlertLogSchema = createInsertSchema(alertLog);
export const selectAlertLogSchema = createSelectSchema(alertLog);

// Push notification subscriptions (P9.7 — Web push notifications)
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    endpoint: varchar("endpoint", { length: 500 }).notNull(),
    p256dh: varchar("p256dh", { length: 255 }).notNull(),
    auth: varchar("auth", { length: 255 }).notNull(),
    notifyNewMatches: boolean("notify_new_matches").notNull().default(true),
    notifyPriceChanges: boolean("notify_price_changes").notNull().default(true),
    frequency: varchar("frequency", { length: 20 }).notNull().default("immediate"), // 'immediate', 'daily', 'weekly'
    quietHoursStart: integer("quiet_hours_start"), // hour 0-23
    quietHoursEnd: integer("quiet_hours_end"), // hour 0-23
    userAgent: varchar("user_agent", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxUser: index("idx_push_subscriptions_user").on(table.userId),
    idxEndpoint: uniqueIndex("idx_push_subscriptions_endpoint").on(table.endpoint),
  }),
);

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions);
export const selectPushSubscriptionSchema = createSelectSchema(pushSubscriptions);
