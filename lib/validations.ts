import { z } from "zod";

// ─── Manufacturer Validation ─────────────────────────────────────────────

export const createManufacturerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  country: z.string().max(100).optional(),
  foundedYear: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 1)
    .optional(),
  websiteUrl: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  logoUrl: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  description: z.string().max(5000).optional(),
});

export const updateManufacturerSchema = createManufacturerSchema.partial();

// ─── Yacht Model Validation ──────────────────────────────────────────────

export const createYachtModelSchema = z.object({
  modelName: z.string().min(1, "Model name is required").max(255),
  manufacturerId: z.number().int().positive("Manufacturer ID must be positive"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2),
  slug: z.string().max(500).optional(),

  // Numeric specs
  lengthOverall: z.number().positive().optional().nullable(),
  beam: z.number().positive().optional().nullable(),
  draft: z.number().positive().optional().nullable(),
  displacement: z.number().positive().optional().nullable(),
  ballast: z.number().positive().optional().nullable(),
  sailAreaMain: z.number().positive().optional().nullable(),

  // Categorical
  rigType: z.string().max(100).optional().nullable(),
  keelType: z.string().max(100).optional().nullable(),
  hullMaterial: z.string().max(100).optional().nullable(),

  // Accommodation
  cabins: z.number().int().min(0).optional().nullable(),
  berths: z.number().int().min(0).optional().nullable(),
  heads: z.number().int().min(0).optional().nullable(),
  maxOccupancy: z.number().int().min(0).optional().nullable(),

  // Technical
  engineHp: z.number().positive().optional().nullable(),
  engineType: z.string().max(100).optional().nullable(),
  fuelCapacity: z.number().positive().optional().nullable(),
  waterCapacity: z.number().positive().optional().nullable(),

  // Metadata
  designNotes: z.string().max(10000).optional().nullable(),
  description: z.string().max(50000).optional().nullable(),
});

export const updateYachtModelSchema = createYachtModelSchema.partial().extend({
  modelName: z.string().min(1).max(255).optional(),
  manufacturerId: z.number().int().positive().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional(),
});

// ─── Spec Category Validation ─────────────────────────────────────────────

export const createSpecCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  dataType: z.enum(["numeric", "text"], { message: "Must be 'numeric' or 'text'" }),
  unit: z.string().max(50).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  categoryGroup: z.string().max(100).optional().nullable(),
  isFilterable: z.boolean().optional(),
});

export const updateSpecCategorySchema = createSpecCategorySchema.partial();

// ─── Review Validation ────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  yachtModelId: z.number().int().positive("Yacht model ID must be positive"),
  source: z.string().min(1, "Source is required").max(100),
  rating: z.number().min(0).max(10).multipleOf(0.1).optional().nullable(),
  summary: z.string().max(500).optional().nullable(),
  fullText: z.string().max(50000).optional().nullable(),
  reviewDate: z.string().datetime({ message: "Invalid date format" }).optional().nullable(),
  authorName: z.string().max(200).optional().nullable(),
  sourceUrl: z.string().url("Invalid URL").max(500).optional().nullable().or(z.literal("")),
});

export const updateReviewSchema = z.object({
  yachtModelId: z.number().int().positive().optional(),
  source: z.string().min(1).max(100).optional(),
  rating: z.number().min(0).max(10).multipleOf(0.1).optional().nullable(),
  summary: z.string().max(500).optional().nullable(),
  fullText: z.string().max(50000).optional().nullable(),
  reviewDate: z.string().datetime({ message: "Invalid date format" }).optional().nullable(),
  authorName: z.string().max(200).optional().nullable(),
  sourceUrl: z.string().url("Invalid URL").max(500).optional().nullable().or(z.literal("")),
});

// ─── Public Review Submission (P10.4) ─────────────────────────────────────

export const publicReviewSubmissionSchema = z.object({
  yachtModelId: z.number().int().positive("Yacht model ID must be positive"),
  reviewerType: z.enum(["owner", "previous_owner", "sailed_on", "broker", "considering"]).default("considering"),
  rating: z.number().min(1).max(5).int("Rating must be a whole number"),
  summary: z.string().min(5, "Please write at least 5 characters").max(500),
  fullText: z.string().max(5000).optional().nullable(),
  authorName: z.string().min(1, "Name is required").max(200),
  ratingBreakdown: z.object({
    build_quality: z.number().min(1).max(5).int().optional().nullable(),
    sailing_performance: z.number().min(1).max(5).int().optional().nullable(),
    comfort: z.number().min(1).max(5).int().optional().nullable(),
    value_for_money: z.number().min(1).max(5).int().optional().nullable(),
  }).optional().nullable(),
  pros: z.array(z.string().max(200)).max(10).optional().default([]),
  cons: z.array(z.string().max(200)).max(10).optional().default([]),
  // Honeypot - must be empty
  website: z.string().max(0).optional(),
});


// ─── Manufacturer Spotlight Validation ───────────────────────────────────

const manufacturerSpotlightNotableModelSchema = z.object({
  yachtSlug: z.string().min(1, "Yacht slug is required").max(500),
  reason: z.string().min(1, "Reason is required").max(1000),
});

const manufacturerSpotlightMilestoneSchema = z.object({
  year: z.number().int().min(1800).max(new Date().getFullYear() + 2),
  event: z.string().min(1, "Milestone event is required").max(1000),
});

export const createManufacturerSpotlightSchema = z.object({
  manufacturerId: z.number().int().positive("Manufacturer ID must be positive"),
  slug: z.string().min(1, "Slug is required").max(255),
  title: z.string().min(1, "Title is required").max(500),
  metaDescription: z.string().max(500).optional().nullable(),
  historyMarkdown: z.string().min(1, "History markdown is required").max(50000),
  brandPositioning: z.string().max(20000).optional().nullable(),
  notableModels: z.array(manufacturerSpotlightNotableModelSchema).max(20).optional(),
  milestones: z.array(manufacturerSpotlightMilestoneSchema).max(50).optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().datetime({ message: "Invalid date format" }).optional().nullable(),
});

export const updateManufacturerSpotlightSchema = createManufacturerSpotlightSchema
  .partial()
  .extend({
    manufacturerId: z.number().int().positive().optional(),
    slug: z.string().min(1).max(255).optional(),
    title: z.string().min(1).max(500).optional(),
    historyMarkdown: z.string().min(1).max(50000).optional(),
  });

// ─── Query Parameter Validation ───────────────────────────────────────────

export const yachtQuerySchema = z.object({
  manufacturer: z.string().max(255).optional(),
  minLength: z.coerce.number().positive().optional(),
  maxLength: z.coerce.number().positive().optional(),
  rigType: z.string().max(100).optional(),
  keelType: z.string().max(100).optional(),
  sort: z.enum(["name", "length", "year", "displacement"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const compareQuerySchema = z.object({
  ids: z.string().refine(
    (val) => {
      const parts = val.split(",");
      return parts.length >= 2 && parts.length <= 4 && parts.every((p) => /^\d+$/.test(p.trim()));
    },
    { message: "Must be 2-4 comma-separated numeric IDs" }
  ),
});

// ─── Helper ───────────────────────────────────────────────────────────────

export type ValidationSuccess<T> = { success: true; data: T };
export type ValidationFailure = { success: false; errors: string[] };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validate<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

// ─── P27.2: API Input Validation Schemas ─────────────────────────────────

// Email-yacht sharing
export const emailYachtSchema = z.object({
  recipientEmail: z.string().email("Valid recipient email is required").max(255),
  yachtSlug: z.string().min(1, "Yacht slug is required").max(500),
  senderName: z.string().max(200).optional(),
  senderEmail: z.string().email("Invalid sender email").max(255).optional(),
  message: z.string().max(2000).optional(),
});

// Compare share
export const compareShareSchema = z.object({
  yachtIds: z.array(z.number().int().positive()).min(2, "At least 2 yachts required").max(4, "Maximum 4 yachts"),
  title: z.string().max(500).optional().nullable(),
});

// FAQ proposal
export const faqProposalActionSchema = z.object({
  action: z.enum(["create", "harvest", "update", "delete"]).optional().default("create"),
  question: z.string().min(1, "Question is required").max(1000).optional(),
  suggestedAnswer: z.string().max(5000).optional(),
  category: z.string().max(200).optional(),
  source: z.string().max(500).optional(),
  id: z.coerce.number().int().positive().optional(),
  status: z.enum(["approved", "rejected", "published"]).optional(),
  adminNotes: z.string().max(5000).optional(),
});

// Quiz answers
export const quizAnswersSchema = z.object({
  experience: z.string().max(100),
  sailingType: z.string().max(100),
  crewSize: z.string().max(100),
  budget: z.string().max(100),
  preferredLength: z.string().max(100),
  keelPreference: z.string().max(100),
  priority: z.string().max(100),
});

// Revenue events
export const revenueEventItemSchema = z.object({
  type: z.string().min(1).max(100),
  page: z.string().max(500).optional(),
  source: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().max(200).optional(),
  timestamp: z.union([z.string(), z.number(), z.date()]),
});

export const revenueEventsSchema = z.object({
  events: z.array(revenueEventItemSchema).min(1, "No events provided").max(50, "Maximum 50 events per batch"),
});

// Affiliate tracking
export const affiliateTrackSchema = z.object({
  action: z.enum(["click", "conversion"]),
  variantId: z.coerce.number().int().positive(),
  placementId: z.coerce.number().int().positive(),
  sessionId: z.string().max(200).optional(),
  page: z.string().max(500).optional(),
  yachtId: z.number().int().positive().optional(),
  revenue: z.number().nonnegative().optional(),
  metadata: z.record(z.string(), z.string().or(z.number()).or(z.null())).optional(),
});

// Compare report (PDF)
export const compareReportSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  name: z.string().max(200).optional(),
  yachtIds: z.array(z.number().int().positive()).min(2, "Between 2 and 4 yachts required").max(4, "Between 2 and 4 yachts required"),
});

// Auth register
export const authRegisterSchema = z.object({
  email: z.string().email("Please enter a valid email address.").max(255),
  password: z.string().min(8, "Password must be at least 8 characters long.").max(72, "Password must be 72 characters or fewer."),
  name: z.string().max(200).optional(),
});

// ─── P27.2: Additional API Input Validation Schemas ─────────────────────

// A/B test event
export const abEventSchema = z.object({
  experimentId: z.string().min(1).max(100),
  variantId: z.string().min(1).max(100),
  userId: z.string().min(1).max(200),
  eventType: z.enum(["impression", "conversion", "click"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Search intent record
export const searchIntentRecordSchema = z.object({
  searchQuery: z.string().min(1, "searchQuery is required").max(500),
  matchedIntentSlug: z.string().max(500).optional().nullable(),
});

// User favorite add
export const userFavoriteSchema = z.object({
  yachtModelId: z.number().int().positive("yachtModelId must be a positive integer"),
});

// User saved search
export const userSavedSearchSchema = z.object({
  name: z.string().max(255).optional(),
  searchParams: z.record(z.string(), z.unknown()),
  resultCount: z.number().int().nonnegative().optional().nullable(),
  alertEnabled: z.boolean().optional().default(false),
});

// User saved search update
export const userSavedSearchUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(255).optional(),
  alertEnabled: z.boolean().optional(),
  searchParams: z.record(z.string(), z.unknown()).optional(),
});

// User saved comparison
export const userSavedComparisonSchema = z.object({
  name: z.string().max(255).optional(),
  yachtIds: z.array(z.number().int().positive()).min(2).max(4),
});

// User account (privacy settings update)
export const userAccountUpdateSchema = z.object({
  analyticsOptOut: z.boolean().optional(),
  communicationOptOut: z.boolean().optional(),
  dataSharingConsent: z.boolean().optional(),
});

// Push subscription
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("endpoint must be a valid URL").max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
  notifyNewMatches: z.boolean().optional().default(true),
  notifyPriceChanges: z.boolean().optional().default(true),
  frequency: z.enum(["instant", "daily", "weekly"]).optional().default("daily"),
  quietHoursStart: z.string().max(10).optional().nullable(),
  quietHoursEnd: z.string().max(10).optional().nullable(),
});

// Alert preferences
export const alertPreferencesSchema = z.object({
  alertType: z.enum(["new_yachts", "price_changes", "new_reviews"]),
  enabled: z.boolean().optional().default(true),
  frequency: z.enum(["instant", "daily", "weekly"]).optional().default("daily"),
});

// Content freshness query params
export const contentFreshnessQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional().default(90),
  status: z.enum(["fresh", "due", "stale"]).optional(),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});

// Analytics tracking event
export const analyticsEventSchema = z.object({
  events: z.array(
    z.object({
      type: z.string().min(1).max(100),
      page: z.string().max(500).optional(),
      referrer: z.string().max(500).optional(),
      sessionId: z.string().max(200).optional(),
      duration: z.number().nonnegative().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      timestamp: z.union([z.string(), z.number(), z.date()]).optional(),
    })
  ).min(1, "At least one event required").max(100, "Maximum 100 events per batch"),
});

// Vitals (Web Vitals reporting)
export const vitalsSchema = z.object({
  metric: z.object({
    name: z.enum(["CLS", "LCP", "FID", "INP", "FCP", "TTFB"]),
    value: z.number(),
    rating: z.enum(["good", "needs-improvement", "poor"]),
    delta: z.number().optional(),
    id: z.string().max(200).optional(),
    navigationType: z.string().max(50).optional(),
  }),
  page: z.string().max(500).optional(),
  sessionId: z.string().max(200).optional(),
});
