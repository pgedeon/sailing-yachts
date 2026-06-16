/**
 * Shared API validation helpers.
 * Wraps Zod safeParse with consistent error formatting.
 */
import type { ZodType } from "zod";
import { NextResponse } from "next/server";

export function validateBody<T>(
  schema: ZodType<T>,
  data: unknown
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    response: NextResponse.json(
      {
        error: "Invalid request body",
        details: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    ),
  };
}

export function validateQuery<T>(
  schema: ZodType<T>,
  data: unknown
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    response: NextResponse.json(
      {
        error: "Invalid query parameters",
        details: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    ),
  };
}

// Re-export all validation schemas for convenience
export {
  abEventSchema,
  searchIntentRecordSchema,
  userFavoriteSchema,
  userSavedSearchSchema,
  userSavedSearchUpdateSchema,
  userSavedComparisonSchema,
  userAccountUpdateSchema,
  pushSubscriptionSchema,
  alertPreferencesSchema,
  contentFreshnessQuerySchema,
  analyticsEventSchema,
  vitalsSchema,
} from "./validations";
