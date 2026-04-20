/**
 * Feature Flag Evaluation Engine
 *
 * Provides deterministic evaluation:
 * - Environment variable overrides (highest priority)
 * - Query param overrides (for admin testing)
 * - Deterministic hash bucketing for experiments
 * - Fallback to flag defaultValue
 */

import { flags, type FlagKey, type FlagValue, type FlagDefinition, type BooleanFlag, type VariantFlag } from "./flags";

// ─── Environment variable override ─────────────────────────────────────────

/**
 * Check for environment variable override.
 * Flag "compare.cta_placement" maps to FEATURE_FLAG_COMPARE_CTA_PLACEMENT
 */
function getEnvOverride<K extends FlagKey>(key: K): FlagValue<K> | undefined {
  const envKey = `FEATURE_FLAG_${key.toUpperCase().replace(/\./g, "_")}`;
  const envValue = process.env[envKey];
  if (envValue === undefined) return undefined;

  const flag = flags[key] as FlagDefinition;
  if (flag.type === "boolean") {
    return (envValue === "true" || envValue === "1") as FlagValue<K>;
  }
  return envValue as FlagValue<K>;
}

// ─── Deterministic bucketing ───────────────────────────────────────────────

/**
 * FNV-1a hash for deterministic bucketing.
 * Same user ID always gets the same variant for a given flag.
 */
function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5; // 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // 16777619
  }
  return hash >>> 0; // ensure unsigned
}

/**
 * Determine which variant a user gets for an experiment flag.
 * Uses deterministic hashing: same (userId, flagKey) always returns same variant.
 */
function bucketVariant<K extends FlagKey>(
  key: K,
  userId: string,
): FlagValue<K> {
  const flag = flags[key] as VariantFlag;
  const hash = fnv1aHash(`${key}:${userId}`);
  const bucket = hash % flag.variants.length;
  return flag.variants[bucket] as FlagValue<K>;
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface FlagContext {
  /** User identifier for deterministic bucketing */
  userId?: string;
  /** Query param overrides (from request URL searchParams) */
  overrides?: Record<string, string>;
  /** Whether to allow query param overrides (admin-only gate) */
  allowOverrides?: boolean;
}

/**
 * Evaluate a feature flag.
 *
 * Priority (highest first):
 * 1. Query param override (if allowOverrides is true)
 * 2. Environment variable override
 * 3. Deterministic bucketing (for variant flags, requires userId)
 * 4. Flag defaultValue
 */
export function getFlag<K extends FlagKey>(
  key: K,
  context: FlagContext = {},
): FlagValue<K> {
  const flag = flags[key] as FlagDefinition;

  // 1. Query param overrides (admin testing)
  if (context.allowOverrides && context.overrides && key in context.overrides) {
    const override = context.overrides[key];
    if (flag.type === "boolean") {
      return (override === "true" || override === "1") as FlagValue<K>;
    }
    // Validate variant is in the allowed list
    if (flag.type === "variant" && flag.variants.includes(override as any)) {
      return override as FlagValue<K>;
    }
  }

  // 2. Environment variable override
  const envValue = getEnvOverride(key);
  if (envValue !== undefined) return envValue;

  // 3. Deterministic bucketing for variant flags
  if (flag.type === "variant" && context.userId) {
    return bucketVariant(key, context.userId);
  }

  // 4. Default value
  return flag.defaultValue as FlagValue<K>;
}

/**
 * Get all flag values at once.
 * Useful for serializing flags to pass to client components.
 */
export function getAllFlags(context: FlagContext = {}): Record<FlagKey, FlagValue> {
  const result = {} as Record<FlagKey, FlagValue>;
  for (const key of Object.keys(flags) as FlagKey[]) {
    result[key] = getFlag(key, context);
  }
  return result;
}

/**
 * Get flag definitions (metadata only, no evaluation).
 * Useful for admin UI and debugging.
 */
export function getFlagDefinitions(): Record<FlagKey, FlagDefinition & { key: string }> {
  const result = {} as Record<FlagKey, FlagDefinition & { key: string }>;
  for (const key of Object.keys(flags) as FlagKey[]) {
    result[key] = { ...flags[key], key };
  }
  return result;
}

/**
 * Server-side helper: extract flag overrides from URL searchParams.
 */
export function extractFlagOverrides(
  searchParams: URLSearchParams,
): Record<string, string> {
  const overrides: Record<string, string> = {};
  for (const [paramKey, paramValue] of searchParams.entries()) {
    if (paramKey in flags) {
      overrides[paramKey] = paramValue;
    }
  }
  return overrides;
}
