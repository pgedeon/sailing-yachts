/**
 * P21.4 — Lightweight A/B Testing Framework
 *
 * Provides deterministic variant assignment based on a user identifier
 * (e.g., a session cookie hash). No external services required.
 * Results are exposed via an API endpoint for analytics aggregation.
 *
 * Design:
 * - Experiments are defined in code (type-safe)
 * - Variant assignment is deterministic: hash(experimentId + userId) % numVariants
 * - Impressions and conversions are logged to DB for analysis
 * - Server-side rendering gets the variant via a cookie/header
 */

export type ExperimentId = "yacht_description_style" | "yacht_cta_style";

export interface ExperimentDefinition {
  id: ExperimentId;
  name: string;
  description: string;
  variants: VariantDefinition[];
  isActive: boolean;
  startDate: string;
}

export interface VariantDefinition {
  id: string;
  name: string;
  weight: number; // 0-1, relative weight for traffic allocation
  description: string;
}

// ──────────────────────────────────────────
// Experiment Registry
// ──────────────────────────────────────────

export const EXPERIMENTS: Record<ExperimentId, ExperimentDefinition> = {
  yacht_description_style: {
    id: "yacht_description_style",
    name: "Yacht Description Style",
    description:
      "Tests whether technical, marketing, or balanced descriptions lead to higher engagement.",
    variants: [
      { id: "balanced", name: "Balanced (Control)", weight: 0.5, description: "Default balanced description style" },
      { id: "technical", name: "Technical", weight: 0.25, description: "Specs-focused, data-driven descriptions" },
      { id: "marketing", name: "Marketing", weight: 0.25, description: "Aspirational, lifestyle-focused descriptions" },
    ],
    isActive: true,
    startDate: "2026-05-21",
  },
  yacht_cta_style: {
    id: "yacht_cta_style",
    name: "Yacht CTA Style",
    description:
      "Tests different call-to-action button labels on yacht detail pages.",
    variants: [
      { id: "default", name: "Default CTA", weight: 0.5, description: "Current CTA text" },
      { id: "action", name: "Action-oriented CTA", weight: 0.25, description: "Stronger action verbs" },
      { id: "benefit", name: "Benefit-oriented CTA", weight: 0.25, description: "Benefit-focused text" },
    ],
    isActive: true,
    startDate: "2026-05-21",
  },
};

// ──────────────────────────────────────────
// Deterministic Variant Assignment
// ──────────────────────────────────────────

/**
 * Simple, fast hash function (FNV-1a 32-bit).
 * Returns a 32-bit integer hash of the input string.
 */
function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Assign a variant to a user for a given experiment.
 * Uses deterministic hashing so the same user always gets the same variant.
 */
export function assignVariant(
  experimentId: ExperimentId,
  userId: string,
): VariantDefinition {
  const experiment = EXPERIMENTS[experimentId];
  if (!experiment || !experiment.isActive) {
    // Return control (first variant) if experiment not found or inactive
    return experiment?.variants[0] ?? {
      id: "control",
      name: "Control",
      weight: 1,
      description: "Default variant",
    };
  }

  const hash = fnv1aHash(`${experimentId}:${userId}`);
  const bucket = (hash % 1000) / 1000; // 0.000 - 0.999

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant;
    }
  }

  // Fallback to last variant
  return experiment.variants[experiment.variants.length - 1];
}

/**
 * Get all experiments with their variant assignments for a given user.
 */
export function getAllAssignments(
  userId: string,
): Record<ExperimentId, VariantDefinition> {
  const assignments: Record<string, VariantDefinition> = {};
  for (const id of Object.keys(EXPERIMENTS) as ExperimentId[]) {
    assignments[id] = assignVariant(id, userId);
  }
  return assignments as Record<ExperimentId, VariantDefinition>;
}

// ──────────────────────────────────────────
// Event Logging Types
// ──────────────────────────────────────────

export type AbEventType = "impression" | "conversion" | "click";

export interface AbEvent {
  experimentId: ExperimentId;
  variantId: string;
  eventType: AbEventType;
  userId: string;
  metadata?: Record<string, string>;
  timestamp: string;
}

/**
 * Create an AB test event.
 */
export function createEvent(
  experimentId: ExperimentId,
  variantId: string,
  eventType: AbEventType,
  userId: string,
  metadata?: Record<string, string>,
): AbEvent {
  return {
    experimentId,
    variantId,
    eventType,
    userId,
    metadata,
    timestamp: new Date().toISOString(),
  };
}
