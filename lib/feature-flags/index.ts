/**
 * Feature flags barrel export.
 *
 * Server-side usage:
 *   import { getFlag, getAllFlags } from "@/lib/feature-flags";
 *
 * Client-side usage:
 *   import { useFeatureFlag, FeatureFlagProvider } from "@/lib/feature-flags";
 */

// Flag definitions
export { flags, type FlagKey, type FlagValue, type FlagDefinition, type BooleanFlag, type VariantFlag } from "./flags";

// Evaluation engine (server-side)
export { getFlag, getAllFlags, getFlagDefinitions, extractFlagOverrides, type FlagContext } from "./evaluate";

// React context + hooks (client-side)
export { FeatureFlagProvider, useFeatureFlag, useIsFeatureEnabled, type FeatureFlagProviderProps } from "./context";
