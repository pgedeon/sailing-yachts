/**
 * P26.2 — Lead Scoring Engine
 *
 * Scores leads based on behavior signals to prioritize follow-up.
 * Score range: 0-100
 *
 * Signals & Weights:
 * - Lead type (dealer_inquiry, price_request > find_similar > general): 0-25
 * - Yacht count (more yachts = higher intent): 0-20
 * - UTM source quality (paid > organic > direct): 0-15
 * - Has phone number (shows serious intent): 0-10
 * - Has message (engagement signal): 0-10
 * - Recency bonus (newer leads score higher): 0-10
 * - Repeat email (returning visitor): 0-10
 */

export interface ScoringInput {
  leadType: string | null;
  yachtIds: string;       // comma-separated yacht IDs
  yachtCount?: number;    // computed from yachtIds if not provided
  utmSource: string | null;
  utmMedium: string | null;
  phone: string | null;
  message: string | null;
  email: string | null;
  createdAt: Date | null;
  existingLeadCount?: number; // how many previous leads from same email
}

export interface ScoreBreakdown {
  total: number;
  tier: "hot" | "warm" | "cold";
  signals: {
    leadType: number;
    yachtCount: number;
    utmQuality: number;
    hasPhone: number;
    hasMessage: number;
    recency: number;
    repeatVisitor: number;
  };
}

// Lead type scoring
const LEAD_TYPE_SCORES: Record<string, number> = {
  dealer_inquiry: 25,
  price_request: 22,
  find_similar: 15,
  general: 8,
};

// UTM source quality
const UTM_SOURCE_SCORES: Record<string, number> = {
  google: 12,
  facebook: 10,
  instagram: 10,
  linkedin: 14,
  newsletter: 13,
  youtube: 9,
  bing: 8,
};

const UTM_MEDIUM_SCORES: Record<string, number> = {
  cpc: 15,
  ppc: 14,
  email: 13,
  social: 11,
  organic: 10,
  referral: 9,
};

export function scoreLead(input: ScoringInput): ScoreBreakdown {
  const signals = {
    leadType: scoreLeadType(input.leadType),
    yachtCount: scoreYachtCount(input.yachtIds, input.yachtCount),
    utmQuality: scoreUtmQuality(input.utmSource, input.utmMedium),
    hasPhone: input.phone ? 10 : 0,
    hasMessage: input.message && input.message.trim().length > 10 ? 10 : (input.message ? 5 : 0),
    recency: scoreRecency(input.createdAt),
    repeatVisitor: (input.existingLeadCount && input.existingLeadCount > 0) ? Math.min(10, input.existingLeadCount * 5) : 0,
  };

  const total = Math.min(
    100,
    Object.values(signals).reduce((sum, v) => sum + v, 0)
  );

  const tier = total >= 60 ? "hot" : total >= 35 ? "warm" : "cold";

  return { total, tier, signals };
}

function scoreLeadType(leadType: string | null): number {
  if (!leadType) return 5;
  return LEAD_TYPE_SCORES[leadType] ?? 5;
}

function scoreYachtCount(yachtIds: string, override?: number): number {
  const count = override ?? (yachtIds ? yachtIds.split(",").filter(Boolean).length : 0);
  if (count >= 5) return 20;
  if (count >= 3) return 16;
  if (count >= 2) return 12;
  if (count === 1) return 8;
  return 0;
}

function scoreUtmQuality(utmSource: string | null, utmMedium: string | null): number {
  let score = 0;

  // Medium is the stronger signal
  if (utmMedium) {
    score = UTM_MEDIUM_SCORES[utmMedium.toLowerCase()] ?? 5;
  }

  // Source adds a bump
  if (utmSource) {
    const sourceScore = UTM_SOURCE_SCORES[utmSource.toLowerCase()] ?? 3;
    score = Math.max(score, sourceScore);
  }

  // If both present, take the max (avoid double-counting)
  return Math.min(15, score);
}

function scoreRecency(createdAt: Date | null): number {
  if (!createdAt) return 5;
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (ageHours <= 1) return 10;   // Last hour
  if (ageHours <= 24) return 8;   // Last day
  if (ageHours <= 72) return 5;   // Last 3 days
  if (ageHours <= 168) return 3;  // Last week
  return 1;                        // Older
}

/**
 * Get a human-readable explanation of the score
 */
export function explainScore(breakdown: ScoreBreakdown): string {
  const parts: string[] = [];
  const s = breakdown.signals;

  if (s.leadType >= 20) parts.push("high-intent lead type");
  else if (s.leadType >= 15) parts.push("moderate-intent lead type");

  if (s.yachtCount >= 16) parts.push("comparing multiple yachts");
  if (s.utmQuality >= 12) parts.push("quality traffic source");
  if (s.hasPhone > 0) parts.push("provided phone number");
  if (s.hasMessage >= 10) parts.push("detailed message");
  if (s.repeatVisitor > 0) parts.push("returning lead");

  return parts.length > 0 ? parts.join("; ") : "low engagement signals";
}

/**
 * Configuration for auto-routing rules
 */
export interface RoutingConfig {
  hotMinScore: number;     // default: 60
  warmMinScore: number;    // default: 35
  autoPriorityStatus: string;  // status to set for hot leads
}

export const DEFAULT_ROUTING: RoutingConfig = {
  hotMinScore: 60,
  warmMinScore: 35,
  autoPriorityStatus: "priority",
};
