/**
 * React Context + Hook for client-side feature flag consumption.
 *
 * Usage in a client component:
 *   const variant = useFeatureFlag("compare.cta_placement");
 *   const isEnabled = useFeatureFlag("yachts.monetization_badge");
 *
 * Flags are injected at the layout/provider level via getAllFlags().
 */

"use client";

import {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
} from "react";
import { type FlagKey, type FlagValue } from "./flags";

// ─── Context ───────────────────────────────────────────────────────────────

const FeatureFlagContext = createContext<Record<string, unknown>>({});

export interface FeatureFlagProviderProps {
  flags: Record<string, unknown>;
  children: ReactNode;
}

/**
 * Provider that injects evaluated flag values into the React tree.
 * Place in layout.tsx alongside other providers.
 *
 * Example:
 *   const serverFlags = getAllFlags({ userId: session?.user?.id });
 *   <FeatureFlagProvider flags={serverFlags}>
 *     {children}
 *   </FeatureFlagProvider>
 */
export function FeatureFlagProvider({
  flags: flagValues,
  children,
}: FeatureFlagProviderProps) {
  const value = useMemo(() => flagValues, [flagValues]);
  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

/**
 * Get the current value of a feature flag.
 *
 * Returns the flag's default value if not in context (e.g., SSR without provider).
 * Typed to return boolean for boolean flags, or the variant string for variant flags.
 */
export function useFeatureFlag<K extends FlagKey>(key: K): FlagValue<K> {
  const allFlags = useContext(FeatureFlagContext);
  const value = allFlags[key];

  if (value !== undefined) {
    return value as FlagValue<K>;
  }

  // Fallback: import the flag definition to get default
  // This path is rare (provider missing) but ensures safety
  const { flags } = require("./flags");
  return flags[key].defaultValue as FlagValue<K>;
}

/**
 * Check if a boolean feature flag is enabled.
 * Convenience wrapper around useFeatureFlag for boolean flags.
 */
export function useIsFeatureEnabled(key: FlagKey): boolean {
  return useFeatureFlag(key) as boolean;
}
