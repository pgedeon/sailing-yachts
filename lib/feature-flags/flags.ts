/**
 * Feature Flag Definitions
 *
 * All flags are declared here with:
 * - type: "boolean" (on/off) or "variant" (multi-way experiment)
 * - defaultValue: the safe fallback when flag is not overridden
 * - description: what the flag controls
 * - variants?: for experiment flags, the list of possible values
 */

export type BooleanFlag = {
  type: "boolean";
  defaultValue: boolean;
  description: string;
};

export type VariantFlag<T extends string = string> = {
  type: "variant";
  defaultValue: T;
  variants: T[];
  description: string;
};

export type FlagDefinition = BooleanFlag | VariantFlag;

export type FlagKey = keyof typeof flags;

/**
 * All feature flags in the system.
 *
 * To add a new flag:
 * 1. Add it here with type, defaultValue, and description
 * 2. It's immediately available via getFlag() / useFeatureFlag()
 */
export const flags = {
  // ─── Compare page experiments ──────────────────────────────────────
  "compare.cta_placement": {
    type: "variant",
    defaultValue: "sidebar",
    variants: ["sidebar", "bottom", "modal"],
    description: "Where to place the CTA on the compare page",
  } satisfies VariantFlag<"sidebar" | "bottom" | "modal">,

  "compare.premium_export": {
    type: "boolean",
    defaultValue: true,
    description: "Enable premium export features on compare page",
  } satisfies BooleanFlag,

  // ─── Yacht listing experiments ─────────────────────────────────────
  "yachts.monetization_badge": {
    type: "boolean",
    defaultValue: false,
    description: "Show partner offer badges on yacht listing cards",
  } satisfies BooleanFlag,

  // ─── Search experiments ────────────────────────────────────────────
  "search.ai_summary": {
    type: "boolean",
    defaultValue: false,
    description: "Show AI-generated summaries in search results",
  } satisfies BooleanFlag,

  // ─── Newsletter experiments ────────────────────────────────────────
  "newsletter.popup_timing": {
    type: "variant",
    defaultValue: "exit_intent",
    variants: ["exit_intent", "timed", "scroll"],
    description: "When to show the newsletter signup popup",
  } satisfies VariantFlag<"exit_intent" | "timed" | "scroll">,

  // ─── Feature toggles ──────────────────────────────────────────────
  "favorites.enabled": {
    type: "boolean",
    defaultValue: true,
    description: "Enable favorites/bookmarks feature",
  } satisfies BooleanFlag,

  "alerts.push_notifications": {
    type: "boolean",
    defaultValue: false,
    description: "Enable browser push notifications for price alerts",
  } satisfies BooleanFlag,

  "guides.show_spotlight": {
    type: "boolean",
    defaultValue: true,
    description: "Show manufacturer spotlight section on guide pages",
  } satisfies BooleanFlag,
} as const;

/**
 * Type helper: get the value type for a flag key
 */
export type FlagValue<K extends FlagKey = FlagKey> =
  (typeof flags)[K] extends BooleanFlag
    ? boolean
    : (typeof flags)[K] extends VariantFlag<infer V>
      ? V
      : never;
