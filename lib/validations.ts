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
