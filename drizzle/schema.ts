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
import { sql } from "drizzle-orm";

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
    descriptionFr: text("description_fr"),
    logoUrl: varchar("logo_url", { length: 500 }),
    // P26.1: Premium listing tier
    tier: varchar("tier", { length: 20 }).notNull().default("free"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    premiumVideoUrl: varchar("premium_video_url", { length: 500 }),
    premiumDocuments: jsonb("premium_documents").$type<Array<{ title: string; url: string; type: string }>>().default([]),
    premiumTagline: varchar("premium_tagline", { length: 500 }),
    premiumFeaturedSince: timestamp("premium_featured_since", { withTimezone: true }),
    premiumCtaText: varchar("premium_cta_text", { length: 200 }),
    premiumCtaUrl: varchar("premium_cta_url", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    idxName: uniqueIndex("idx_manufacturers_name").on(table.name),
    // P11.2: GIN trigram for search ILIKE
    idxNameTrgm: index("idx_manufacturers_name_trgm").using(
      "gin",
      sql`name gin_trgm_ops`,
    ),
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
    firstBuilt: integer("first_built"),
    lastBuilt: integer("last_built"),
    productionStatus: varchar("production_status", { length: 20 }).default("unknown"),
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
    descriptionSource: varchar("description_source", { length: 20 }).default("manual"),
    descriptionStatus: varchar("description_status", { length: 20 }).default("approved"),
    descriptionGeneratedAt: timestamp("description_generated_at", { withTimezone: true }),
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
    // P11.2: Additional indexes for query performance audit
    idxHull: index("idx_yacht_models_hull").on(table.hullMaterial),
    idxManufacturerLength: index("idx_yacht_models_manufacturer_length").on(
      table.manufacturerId,
      table.lengthOverall,
    ),
    idxManufacturerCreated: index("idx_yacht_models_manufacturer_created").on(
      table.manufacturerId,
      table.createdAt,
    ),
    // GIN trigram indexes for ILIKE search performance
    idxModelNameTrgm: index("idx_yacht_models_model_name_trgm").using(
      "gin",
      sql`model_name gin_trgm_ops`,
    ),
    idxRigTypeTrgm: index("idx_yacht_models_rig_type_trgm").using(
      "gin",
      sql`rig_type gin_trgm_ops`,
    ),
    idxKeelTypeTrgm: index("idx_yacht_models_keel_type_trgm").using(
      "gin",
      sql`keel_type gin_trgm_ops`,
    ),
    idxHullMaterialTrgm: index("idx_yacht_models_hull_material_trgm").using(
      "gin",
      sql`hull_material gin_trgm_ops`,
    ),
    idxDescriptionTrgm: index("idx_yacht_models_description_trgm").using(
      "gin",
      sql`description gin_trgm_ops`,
    ),
    idxDesignNotesTrgm: index("idx_yacht_models_design_notes_trgm").using(
      "gin",
      sql`design_notes gin_trgm_ops`,
    ),
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
    // P11.2: Covering composite index for spec retrieval with values included
    idxYachtCategoryCovering: index("idx_spec_values_yacht_category_covering").on(
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
    // P11.2: Composite index for sorted image retrieval
    idxYachtSort: index("idx_images_yacht_sort").on(table.yachtModelId, table.sortOrder),
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
    reviewSourceId: integer("review_source_id").references(() => reviewSources.id, { onDelete: "set null" }),
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
    tags: text("tags").array().default([]),
    createdAt: timestamp("created_at").defaultNow(),
    confirmedAt: timestamp("confirmed_at"),
    engagementScore: integer("engagement_score").default(0),
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
    // SEO fields (P25.1)
    metaTitle: varchar("meta_title", { length: 500 }),
    metaDescription: varchar("meta_description", { length: 1000 }),
    ogImage: varchar("og_image", { length: 500 }),
    canonicalUrl: varchar("canonical_url", { length: 500 }),
    noindex: boolean("noindex").default(false),
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
    score: integer("score"),
    scoredAt: timestamp("scored_at", { withTimezone: true }),
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
    // P11.2: Composite index for ordered media gallery retrieval
    idxYachtSort: index("idx_media_assets_yacht_sort").on(table.yachtModelId, table.sortOrder, table.createdAt),
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
    alertEnabled: boolean("alert_enabled").notNull().default(false),
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

// User corrections (P10.7 — User-submitted corrections)
export const userCorrections = pgTable(
  "user_corrections",
  {
    id: serial("id").primaryKey(),
    yachtModelId: integer("yacht_model_id")
      .notNull()
      .references(() => yachtModels.id, { onDelete: "cascade" }),
    submitterName: text("submitter_name"),
    submitterEmail: text("submitter_email"),
    correctionType: text("correction_type").notNull().default("incorrect_value"),
    fieldName: text("field_name").notNull(),
    currentValue: text("current_value"),
    suggestedValue: text("suggested_value").notNull(),
    notes: text("notes"),
    sourceUrl: text("source_url"),
    status: text("status").notNull().default("pending"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => ({
    idxYacht: index("idx_corrections_yacht").on(table.yachtModelId),
    idxStatus: index("idx_corrections_status").on(table.status),
  }),
);

export const insertUserCorrectionSchema = createInsertSchema(userCorrections);
export const selectUserCorrectionSchema = createSelectSchema(userCorrections);

// Exchange rates (P10.6 — Regional price normalization)
export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: serial("id").primaryKey(),
    baseCurrency: varchar("base_currency", { length: 3 }).notNull(),
    targetCurrency: varchar("target_currency", { length: 3 }).notNull(),
    rate: numeric("rate", { precision: 12, scale: 6 }).notNull(),
    source: varchar("source", { length: 100 }).notNull().default("fallback"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxPair: uniqueIndex("idx_exchange_rates_pair").on(table.baseCurrency, table.targetCurrency),
  }),
);

export const insertExchangeRateSchema = createInsertSchema(exchangeRates);
export const selectExchangeRateSchema = createSelectSchema(exchangeRates);

// Admin audit log (P11.8 — Admin hardening)
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    userEmail: varchar("user_email", { length: 255 }),
    action: varchar("action", { length: 100 }).notNull(), // e.g. 'create', 'update', 'delete', 'login', 'logout'
    resourceType: varchar("resource_type", { length: 100 }), // e.g. 'yacht', 'manufacturer', 'review'
    resourceId: varchar("resource_id", { length: 100 }),
    details: jsonb("details").$type<Record<string, unknown>>(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 500 }),
    statusCode: integer("status_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxUser: index("idx_audit_logs_user").on(table.userId),
    idxAction: index("idx_audit_logs_action").on(table.action),
    idxResource: index("idx_audit_logs_resource").on(table.resourceType, table.resourceId),
    idxCreated: index("idx_audit_logs_created").on(table.createdAt),
  }),
);

export const insertAuditLogSchema = createInsertSchema(auditLogs);
export const selectAuditLogSchema = createSelectSchema(auditLogs);

// P21.2: Data enrichment pipeline tables
export const enrichmentSources = pgTable(
  "enrichment_sources",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    baseUrl: varchar("base_url", { length: 500 }).notNull(),
    enabled: boolean("enabled").default(true),
    rateLimitMs: integer("rate_limit_ms").default(2000),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    totalFetched: integer("total_fetched").default(0),
    totalUpdated: integer("total_updated").default(0),
    totalErrors: integer("total_errors").default(0),
    config: jsonb("config").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxName: uniqueIndex("idx_enrichment_sources_name").on(table.name),
  }),
);

export const enrichmentLogs = pgTable(
  "enrichment_logs",
  {
    id: serial("id").primaryKey(),
    sourceId: integer("source_id")
      .notNull()
      .references(() => enrichmentSources.id, { onDelete: "cascade" }),
    yachtModelId: integer("yacht_model_id")
      .references(() => yachtModels.id, { onDelete: "set null" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    fieldsUpdated: jsonb("fields_updated").$type<string[]>(),
    oldValues: jsonb("old_values").$type<Record<string, unknown>>(),
    newValues: jsonb("new_values").$type<Record<string, unknown>>(),
    confidence: integer("confidence").default(50),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    idxSource: index("idx_enrichment_logs_source").on(table.sourceId),
    idxYacht: index("idx_enrichment_logs_yacht").on(table.yachtModelId),
    idxStatus: index("idx_enrichment_logs_status").on(table.status),
  }),
);

export const insertEnrichmentSourceSchema = createInsertSchema(enrichmentSources);
export const selectEnrichmentSourceSchema = createSelectSchema(enrichmentSources);
export const insertEnrichmentLogSchema = createInsertSchema(enrichmentLogs);
export const selectEnrichmentLogSchema = createSelectSchema(enrichmentLogs);

// P23.1: Yacht ratings (user-submitted star ratings)
export const yachtRatings = pgTable(
  "yacht_ratings",
  {
    id: serial("id").primaryKey(),
    yachtModelId: integer("yacht_model_id")
      .notNull()
      .references(() => yachtModels.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    score: integer("score").notNull(), // 1-5
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxYacht: index("idx_yacht_ratings_yacht").on(table.yachtModelId),
    idxUser: index("idx_yacht_ratings_user").on(table.userId),
    uniqUserYacht: uniqueIndex("uniq_yacht_ratings_user_yacht").on(
      table.yachtModelId,
      table.userId,
    ).where(sql`${table.userId} IS NOT NULL`),
    uniqIpYacht: uniqueIndex("uniq_yacht_ratings_ip_yacht").on(
      table.yachtModelId,
      table.ipAddress,
    ).where(sql`${table.ipAddress} IS NOT NULL AND ${table.userId} IS NULL`),
  }),
);

export const insertYachtRatingSchema = createInsertSchema(yachtRatings);
export const selectYachtRatingSchema = createSelectSchema(yachtRatings);

// P23.2: Shared comparisons for persistent sharing URLs
export const sharedComparisons = pgTable(
  "shared_comparisons",
  {
    id: serial("id").primaryKey(),
    shareId: varchar("share_id", { length: 12 }).notNull().unique(),
    yachtIds: jsonb("yacht_ids").$type<number[]>().notNull(),
    title: varchar("title", { length: 500 }),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxShareId: uniqueIndex("idx_shared_comparisons_share_id").on(table.shareId),
    idxCreatedAt: index("idx_shared_comparisons_created_at").on(table.createdAt),
  }),
);

export const insertSharedComparisonSchema = createInsertSchema(sharedComparisons);
export const selectSharedComparisonSchema = createSelectSchema(sharedComparisons);

// P23.5: Featured yachts (Yacht of the Week)
export const featuredYachts = pgTable(
  "featured_yachts",
  {
    id: serial("id").primaryKey(),
    yachtModelId: integer("yacht_model_id")
      .notNull()
      .references(() => yachtModels.id, { onDelete: "cascade" }),
    weekStart: timestamp("week_start", { withTimezone: true }).notNull(),
    weekEnd: timestamp("week_end", { withTimezone: true }).notNull(),
    headline: varchar("headline", { length: 500 }),
    editorialText: text("editorial_text"),
    newsletterSent: boolean("newsletter_sent").notNull().default(false),
    isManualOverride: boolean("is_manual_override").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxYacht: index("idx_featured_yachts_yacht").on(table.yachtModelId),
    idxWeekStart: index("idx_featured_yachts_week_start").on(table.weekStart),
    idxWeekEnd: index("idx_featured_yachts_week_end").on(table.weekEnd),
    idxActive: index("idx_featured_yachts_active").on(table.isActive),
  }),
);

export const insertFeaturedYachtSchema = createInsertSchema(featuredYachts);
export const selectFeaturedYachtSchema = createSelectSchema(featuredYachts);

// P24.1: Analytics events (page views, searches, comparisons, interactions)
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    eventType: varchar("event_type", { length: 50 }).notNull(), // 'page_view', 'search', 'compare', 'yacht_view', 'manufacturer_view', 'guide_view', 'cta_click', 'share', 'filter_use'
    page: varchar("page", { length: 500 }).notNull(),
    entityId: integer("entity_id"), // yacht_model_id, manufacturer_id, etc.
    entityType: varchar("entity_type", { length: 50 }), // 'yacht', 'manufacturer', 'guide', 'comparison'
    sessionId: varchar("session_id", { length: 100 }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    referrer: varchar("referrer", { length: 500 }),
    userAgent: varchar("user_agent", { length: 500 }),
    country: varchar("country", { length: 2 }), // ISO country code
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxEventType: index("idx_analytics_events_type").on(table.eventType),
    idxCreatedAt: index("idx_analytics_events_created").on(table.createdAt),
    idxSessionId: index("idx_analytics_events_session").on(table.sessionId),
    idxPage: index("idx_analytics_events_page").on(table.page),
    idxEntity: index("idx_analytics_events_entity").on(table.entityType, table.entityId),
  }),
);

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents);
export const selectAnalyticsEventSchema = createSelectSchema(analyticsEvents);

// P24.2: A/B test events tracking
export const abEvents = pgTable(
  "ab_events",
  {
    id: serial("id").primaryKey(),
    experimentId: varchar("experiment_id", { length: 100 }).notNull(),
    variantId: varchar("variant_id", { length: 100 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    eventType: varchar("event_type", { length: 50 }).notNull(), // 'impression', 'conversion', 'click'
    metadata: jsonb("metadata").$type<Record<string, string>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxAbExperiment: index("idx_ab_events_experiment").on(table.experimentId),
    idxAbExperimentVariant: index("idx_ab_events_experiment_variant").on(table.experimentId, table.variantId),
    idxAbEventType: index("idx_ab_events_type").on(table.experimentId, table.eventType),
    idxAbUser: index("idx_ab_events_user").on(table.userId, table.experimentId),
    idxAbCreated: index("idx_ab_events_created").on(table.createdAt),
  }),
);

export const insertAbEventSchema = createInsertSchema(abEvents);
export const selectAbEventSchema = createSelectSchema(abEvents);


// P25.1: Article-Yacht join table for related yacht linking
export const articleYachts = pgTable(
  "article_yachts",
  {
    id: serial("id").primaryKey(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    yachtModelId: integer("yacht_model_id")
      .notNull()
      .references(() => yachtModels.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxArticle: index("idx_article_yachts_article").on(table.articleId),
    idxYacht: index("idx_article_yachts_yacht").on(table.yachtModelId),
    idxUnique: uniqueIndex("idx_article_yachts_unique").on(table.articleId, table.yachtModelId),
  }),
);

export const insertArticleYachtSchema = createInsertSchema(articleYachts);
export const selectArticleYachtSchema = createSelectSchema(articleYachts);

// P25.2: External review sources (magazines, YouTube channels, expert sites)
export const reviewSources = pgTable(
  "review_sources",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull().unique(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    websiteUrl: varchar("website_url", { length: 500 }),
    logoUrl: varchar("logo_url", { length: 500 }),
    // P26.1: Premium listing tier
    tier: varchar("tier", { length: 20 }).notNull().default("free"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    premiumVideoUrl: varchar("premium_video_url", { length: 500 }),
    premiumDocuments: jsonb("premium_documents").$type<Array<{ title: string; url: string; type: string }>>().default([]),
    premiumTagline: varchar("premium_tagline", { length: 500 }),
    premiumFeaturedSince: timestamp("premium_featured_since", { withTimezone: true }),
    premiumCtaText: varchar("premium_cta_text", { length: 200 }),
    premiumCtaUrl: varchar("premium_cta_url", { length: 500 }),
    description: text("description"),
    credibilityScore: integer("credibility_score").default(50),
    sourceType: varchar("source_type", { length: 50 }).notNull().default("magazine"),
    isActive: boolean("is_active").notNull().default(true),
    lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    idxSlug: uniqueIndex("idx_review_sources_slug").on(table.slug),
    idxActive: index("idx_review_sources_active").on(table.isActive),
  }),
);

export const insertReviewSourceSchema = createInsertSchema(reviewSources);
export const selectReviewSourceSchema = createSelectSchema(reviewSources);

// P25.4: Content translations — multilingual content pipeline
export const contentTranslations = pgTable(
  "content_translations",
  {
    id: serial("id").primaryKey(),
    contentType: varchar("content_type", { length: 50 }).notNull(), // 'yacht_description', 'manufacturer_description', 'article', 'guide', 'glossary_term', 'faq'
    contentId: integer("content_id").notNull(),
    fieldName: varchar("field_name", { length: 100 }).notNull(), // 'description', 'title', 'content', 'excerpt'
    sourceLocale: varchar("source_locale", { length: 5 }).notNull().default("en"),
    targetLocale: varchar("target_locale", { length: 5 }).notNull().default("fr"),
    sourceText: text("source_text"),
    translatedText: text("translated_text").notNull(),
    translationMethod: varchar("translation_method", { length: 30 }).notNull().default("manual"), // 'manual', 'template', 'memory', 'external'
    status: varchar("status", { length: 30 }).notNull().default("pending"), // 'pending', 'auto_translated', 'in_review', 'approved', 'rejected'
    qualityScore: integer("quality_score").default(50),
    reviewerId: integer("reviewer_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxContentType: index("idx_ct_content_type").on(table.contentType),
    idxContentId: index("idx_ct_content_id").on(table.contentId),
    idxStatus: index("idx_ct_status").on(table.status),
    idxLocalePair: index("idx_ct_locale_pair").on(table.sourceLocale, table.targetLocale),
    idxUnique: uniqueIndex("idx_ct_unique").on(table.contentType, table.contentId, table.fieldName, table.sourceLocale, table.targetLocale),
    idxMethod: index("idx_ct_method").on(table.translationMethod),
  }),
);

export const translationMemory = pgTable(
  "translation_memory",
  {
    id: serial("id").primaryKey(),
    sourceLocale: varchar("source_locale", { length: 5 }).notNull().default("en"),
    targetLocale: varchar("target_locale", { length: 5 }).notNull().default("fr"),
    sourceText: text("source_text").notNull(),
    translatedText: text("translated_text").notNull(),
    sourceHash: varchar("source_hash", { length: 64 }).notNull(),
    category: varchar("category", { length: 100 }),
    matchCount: integer("match_count").notNull().default(1),
    qualityScore: integer("quality_score").default(80),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxUnique: uniqueIndex("idx_tm_unique").on(table.sourceHash, table.sourceLocale, table.targetLocale),
    idxCategory: index("idx_tm_category").on(table.category),
    idxSourceHash: index("idx_tm_source_hash").on(table.sourceHash),
  }),
);

export const insertContentTranslationSchema = createInsertSchema(contentTranslations);
export const selectContentTranslationSchema = createSelectSchema(contentTranslations);
export const insertTranslationMemorySchema = createInsertSchema(translationMemory);
export const selectTranslationMemorySchema = createSelectSchema(translationMemory);

// --- P26.3: Affiliate Link Optimization Engine ---

// Affiliate placement locations (where links appear on the site)
export const affiliatePlacements = pgTable(
  "affiliate_placements",
  {
    id: serial("id").primaryKey(),
    placementKey: varchar("placement_key", { length: 100 }).notNull().unique(),
    label: varchar("label", { length: 255 }).notNull(),
    pagePattern: varchar("page_pattern", { length: 255 }).notNull(),
    position: varchar("position", { length: 50 }).notNull().default("sidebar"),
    isActive: boolean("is_active").notNull().default(true),
    rotationStrategy: varchar("rotation_strategy", { length: 50 }).notNull().default("ab_test"),
    autoOptimize: boolean("auto_optimize").notNull().default(true),
    minSampleSize: integer("min_sample_size").notNull().default(100),
    confidenceThreshold: numeric("confidence_threshold", { precision: 3, scale: 2 }).notNull().default("0.95"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxKey: uniqueIndex("idx_affiliate_placements_key").on(table.placementKey),
    idxActive: index("idx_affiliate_placements_active").on(table.isActive),
    idxPagePattern: index("idx_affiliate_placements_page").on(table.pagePattern),
  }),
);

// Affiliate variants (different link/partner configs for a placement)
export const affiliateVariants = pgTable(
  "affiliate_variants",
  {
    id: serial("id").primaryKey(),
    placementId: integer("placement_id").notNull().references(() => affiliatePlacements.id, { onDelete: "cascade" }),
    variantKey: varchar("variant_key", { length: 100 }).notNull(),
    partnerName: varchar("partner_name", { length: 100 }).notNull().default("amazon"),
    linkText: varchar("link_text", { length: 255 }).notNull(),
    linkUrl: varchar("link_url", { length: 1000 }).notNull(),
    affiliateTag: varchar("affiliate_tag", { length: 100 }),
    displayOrder: integer("display_order").default(0),
    trafficWeight: integer("traffic_weight").notNull().default(50),
    isActive: boolean("is_active").notNull().default(true),
    isWinner: boolean("is_winner").notNull().default(false),
    clicks: integer("clicks").notNull().default(0),
    conversions: integer("conversions").notNull().default(0),
    estimatedRevenue: numeric("estimated_revenue", { precision: 10, scale: 2 }).notNull().default("0.00"),
    impressions: integer("impressions").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxPlacement: index("idx_affiliate_variants_placement").on(table.placementId),
    idxPlacementKey: uniqueIndex("idx_affiliate_variants_placement_key").on(table.placementId, table.variantKey),
    idxPartner: index("idx_affiliate_variants_partner").on(table.partnerName),
    idxActive: index("idx_affiliate_variants_active").on(table.isActive),
    idxWinner: index("idx_affiliate_variants_winner").on(table.isWinner),
  }),
);

// Affiliate click/conversion tracking events
export const affiliateTrackingEvents = pgTable(
  "affiliate_tracking_events",
  {
    id: serial("id").primaryKey(),
    variantId: integer("variant_id").notNull().references(() => affiliateVariants.id, { onDelete: "cascade" }),
    placementId: integer("placement_id").notNull().references(() => affiliatePlacements.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    sessionId: varchar("session_id", { length: 100 }),
    page: varchar("page", { length: 500 }),
    yachtId: integer("yacht_id"),
    revenue: numeric("revenue", { precision: 10, scale: 2 }),
    metadata: jsonb("metadata").$type<Record<string, string | number | null>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxVariant: index("idx_affiliate_tracking_variant").on(table.variantId),
    idxPlacement: index("idx_affiliate_tracking_placement").on(table.placementId),
    idxEventType: index("idx_affiliate_tracking_type").on(table.eventType),
    idxCreated: index("idx_affiliate_tracking_created").on(table.createdAt),
    idxSession: index("idx_affiliate_tracking_session").on(table.sessionId),
  }),
);

export const insertAffiliatePlacementSchema = createInsertSchema(affiliatePlacements);
export const selectAffiliatePlacementSchema = createSelectSchema(affiliatePlacements);
export const insertAffiliateVariantSchema = createInsertSchema(affiliateVariants);
export const selectAffiliateVariantSchema = createSelectSchema(affiliateVariants);
export const insertAffiliateTrackingEventSchema = createInsertSchema(affiliateTrackingEvents);
export const selectAffiliateTrackingEventSchema = createSelectSchema(affiliateTrackingEvents);

// ─── Newsletter Monetization ──────────────────────────────────────

// Newsletter campaigns (issues sent to subscribers)
export const newsletterCampaigns = pgTable(
  "newsletter_campaigns",
  {
    id: serial("id").primaryKey(),
    subject: varchar("subject", { length: 500 }).notNull(),
    preheader: varchar("preheader", { length: 500 }),
    bodyMarkdown: text("body_markdown").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, scheduled, sent
    targetSegment: varchar("target_segment", { length: 100 }), // tag name or "all"
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    recipientCount: integer("recipient_count").default(0),
    openCount: integer("open_count").default(0),
    clickCount: integer("click_count").default(0),
    revenue: numeric("revenue", { precision: 10, scale: 2 }).default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxStatus: index("idx_nl_campaigns_status").on(table.status),
    idxScheduled: index("idx_nl_campaigns_scheduled").on(table.scheduledFor),
  }),
);

// Sponsored content slots within newsletter campaigns
export const newsletterSponsorSlots = pgTable(
  "newsletter_sponsor_slots",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").notNull().references(() => newsletterCampaigns.id, { onDelete: "cascade" }),
    sponsorName: varchar("sponsor_name", { length: 255 }).notNull(),
    sponsorLogo: varchar("sponsor_logo", { length: 500 }),
    headline: varchar("headline", { length: 500 }).notNull(),
    bodyText: text("body_text"),
    ctaText: varchar("cta_text", { length: 100 }),
    ctaUrl: varchar("cta_url", { length: 500 }).notNull(),
    slotPosition: varchar("slot_position", { length: 20 }).notNull().default("middle"), // top, middle, bottom
    revenue: numeric("revenue", { precision: 10, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxCampaign: index("idx_nl_sponsor_campaign").on(table.campaignId),
    idxPosition: index("idx_nl_sponsor_position").on(table.slotPosition),
  }),
);

// Newsletter open tracking (tracking pixel)
export const newsletterOpens = pgTable(
  "newsletter_opens",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").notNull().references(() => newsletterCampaigns.id, { onDelete: "cascade" }),
    subscriberId: integer("subscriber_id").references(() => newsletterSubscribers.id, { onDelete: "set null" }),
    userAgent: varchar("user_agent", { length: 500 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxCampaign: index("idx_nl_opens_campaign").on(table.campaignId),
    idxSubscriber: index("idx_nl_opens_subscriber").on(table.subscriberId),
    idxOpened: index("idx_nl_opens_when").on(table.openedAt),
  }),
);

// Newsletter click tracking
export const newsletterClicks = pgTable(
  "newsletter_clicks",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").notNull().references(() => newsletterCampaigns.id, { onDelete: "cascade" }),
    subscriberId: integer("subscriber_id").references(() => newsletterSubscribers.id, { onDelete: "set null" }),
    url: varchar("url", { length: 500 }).notNull(),
    linkLabel: varchar("link_label", { length: 200 }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idxCampaign: index("idx_nl_clicks_campaign").on(table.campaignId),
    idxSubscriber: index("idx_nl_clicks_subscriber").on(table.subscriberId),
    idxClicked: index("idx_nl_clicks_when").on(table.clickedAt),
  }),
);

export const insertNewsletterCampaignSchema = createInsertSchema(newsletterCampaigns);
export const selectNewsletterCampaignSchema = createSelectSchema(newsletterCampaigns);
export const insertNewsletterSponsorSlotSchema = createInsertSchema(newsletterSponsorSlots);
export const selectNewsletterSponsorSlotSchema = createSelectSchema(newsletterSponsorSlots);
export const insertNewsletterOpenSchema = createInsertSchema(newsletterOpens);
export const selectNewsletterOpenSchema = createSelectSchema(newsletterOpens);
export const insertNewsletterClickSchema = createInsertSchema(newsletterClicks);
export const selectNewsletterClickSchema = createSelectSchema(newsletterClicks);
