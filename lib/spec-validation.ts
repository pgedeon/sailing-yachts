/**
 * Specification Validation & Derived Calculations (P21.3)
 *
 * Provides validation rules for yacht specs to catch data errors,
 * and calculates derived performance ratios from base specs.
 */

import {
  displacementLengthRatio,
  sailAreaDisplacementRatio,
  ballastRatio,
} from "./yacht-ratios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YachtSpecs {
  lengthOverall: number | null | string;
  beam: number | null | string;
  draft: number | null | string;
  displacement: number | null | string;
  ballast: number | null | string;
  sailAreaMain: number | null | string;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | null | string;
  berths: number | null | string;
  heads: number | null | string;
  maxOccupancy: number | null | string;
  engineHp: number | null | string;
  engineType: string | null;
  fuelCapacity: number | null | string;
  waterCapacity: number | null | string;
  hullSpeed?: number | null | string;
  sailAreaDisplacement?: number | null | string;
  displacementLength?: number | null | string;
  ballastRatioPercent?: number | null | string;
}

export type Severity = "error" | "warning" | "info";

export interface ValidationIssue {
  rule: string;
  severity: Severity;
  message: string;
  field: string;
  value: unknown;
}

export interface DerivedSpec {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  description: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  derivedSpecs: DerivedSpec[];
  issueCount: { error: number; warning: number; info: number };
  isValid: boolean; // no errors
}

// ---------------------------------------------------------------------------
// Helpers — coerce DB values (string/number/null) → number | null
// ---------------------------------------------------------------------------

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Detect multihulls (catamarans/trimarans) by beam-to-LOA ratio.
// Catamarans typically have beam >45% of LOA; monohulls 25–35%.
function isMultihull(beam: number | null, loa: number | null): boolean {
  if (!beam || !loa || loa <= 0) return false;
  return beam / loa > 0.45;
}

// ---------------------------------------------------------------------------
// Validation Rules
// ---------------------------------------------------------------------------

type ValidationRule = {
  id: string;
  field: string;
  severity: Severity;
  message: string;
  check: (s: YachtSpecs) => boolean; // true = issue found
};

const RULES: ValidationRule[] = [
  // --- Dimensional consistency ---
  {
    id: "beam_exceeds_loa",
    field: "beam",
    severity: "error",
    message: "Beam exceeds Length Overall — this is physically impossible",
    check: (s) => {
      const loa = toNum(s.lengthOverall);
      const b = toNum(s.beam);
      return loa !== null && b !== null && b >= loa;
    },
  },
  {
    id: "beam_too_wide",
    field: "beam",
    severity: "warning",
    message: "Beam is unusually wide (>40% of LOA). Typical ratio is 25–35% for monohulls (multihulls exempt)",
    check: (s) => {
      const loa = toNum(s.lengthOverall);
      const b = toNum(s.beam);
      if (loa === null || b === null || loa <= 0) return false;
      if (isMultihull(b, loa)) return false;
      return b / loa > 0.4;
    },
  },
  {
    id: "beam_too_narrow",
    field: "beam",
    severity: "warning",
    message: "Beam is unusually narrow (<15% of LOA). Typical ratio is 25–35% for sailboats",
    check: (s) => {
      const loa = toNum(s.lengthOverall);
      const b = toNum(s.beam);
      return loa !== null && b !== null && loa > 3 && b / loa < 0.15;
    },
  },
  {
    id: "draft_exceeds_loa",
    field: "draft",
    severity: "error",
    message: "Draft exceeds Length Overall — this is physically impossible",
    check: (s) => {
      const loa = toNum(s.lengthOverall);
      const d = toNum(s.draft);
      return loa !== null && d !== null && d >= loa;
    },
  },
  {
    id: "draft_exceeds_beam",
    field: "draft",
    severity: "warning",
    message: "Draft exceeds beam — unusual for sailboats, typically draft < beam",
    check: (s) => {
      const b = toNum(s.beam);
      const d = toNum(s.draft);
      return b !== null && d !== null && d > b;
    },
  },
  {
    id: "draft_too_deep",
    field: "draft",
    severity: "warning",
    message: "Draft is unusually deep (>30% of LOA). Typical is 10–20%",
    check: (s) => {
      const loa = toNum(s.lengthOverall);
      const d = toNum(s.draft);
      return loa !== null && d !== null && loa > 0 && d / loa > 0.3;
    },
  },

  // --- Displacement sanity ---
  {
    id: "displacement_too_low",
    field: "displacement",
    severity: "warning",
    message: "Displacement seems too low for this LOA (expected >300 kg/m for monohulls)",
    check: (s) => {
      const loa = toNum(s.lengthOverall);
      const disp = toNum(s.displacement);
      const b = toNum(s.beam);
      if (isMultihull(b, loa)) return false;
      return loa !== null && disp !== null && loa > 0 && disp / loa < 300;
    },
  },
  {
    id: "displacement_too_high",
    field: "displacement",
    severity: "warning",
    message: "Displacement seems extremely high for this LOA (expected <5000 kg/m)",
    check: (s) => {
      const loa = toNum(s.lengthOverall);
      const disp = toNum(s.displacement);
      return loa !== null && disp !== null && loa > 0 && disp / loa > 5000;
    },
  },
  {
    id: "ballast_exceeds_displacement",
    field: "ballast",
    severity: "error",
    message: "Ballast exceeds total displacement — this is physically impossible",
    check: (s) => {
      const disp = toNum(s.displacement);
      const bal = toNum(s.ballast);
      return disp !== null && bal !== null && bal > disp;
    },
  },
  {
    id: "ballast_ratio_very_high",
    field: "ballast",
    severity: "warning",
    message: "Ballast ratio exceeds 60% — very high, typical is 25–45%",
    check: (s) => {
      const disp = toNum(s.displacement);
      const bal = toNum(s.ballast);
      return disp !== null && bal !== null && disp > 0 && bal / disp > 0.6;
    },
  },
  {
    id: "ballast_ratio_very_low",
    field: "ballast",
    severity: "info",
    message: "Ballast ratio is below 15% — unusually low, typical is 25–45%",
    check: (s) => {
      const disp = toNum(s.displacement);
      const bal = toNum(s.ballast);
      return disp !== null && bal !== null && disp > 0 && bal > 0 && bal / disp < 0.15;
    },
  },

  // --- Sail area sanity ---
  {
    id: "sail_area_zero",
    field: "sailAreaMain",
    severity: "warning",
    message: "Sail area is zero — should have positive sail area for a sailboat",
    check: (s) => {
      const sa = toNum(s.sailAreaMain);
      return sa === 0;
    },
  },
  {
    id: "sail_area_very_low",
    field: "sailAreaMain",
    severity: "warning",
    message: "Sail area seems very low for this LOA (expected >3.5 m²/m)",
    check: (s) => {
      const loa = toNum(s.lengthOverall);
      const sa = toNum(s.sailAreaMain);
      const b = toNum(s.beam);
      if (isMultihull(b, loa)) return false;
      return loa !== null && sa !== null && loa > 0 && sa > 0 && sa / loa < 3.5;
    },
  },
  {
    id: "sail_area_very_high",
    field: "sailAreaMain",
    severity: "warning",
    message: "Sail area seems very high for this LOA (expected <35 m²/m)",
    check: (s) => {
      const loa = toNum(s.lengthOverall);
      const sa = toNum(s.sailAreaMain);
      const b = toNum(s.beam);
      if (isMultihull(b, loa)) return false;
      return loa !== null && sa !== null && loa > 0 && sa / loa > 35;
    },
  },

  // --- Accommodation ---
  {
    id: "berths_fewer_than_cabins",
    field: "berths",
    severity: "warning",
    message: "Berths fewer than cabins — unusual, typically at least 1 berth per cabin",
    check: (s) => {
      const cab = toNum(s.cabins);
      const ber = toNum(s.berths);
      return cab !== null && ber !== null && cab > 0 && ber > 0 && ber < cab;
    },
  },
  {
    id: "heads_exceed_cabins",
    field: "heads",
    severity: "info",
    message: "More heads than cabins — unusual but possible on luxury yachts",
    check: (s) => {
      const cab = toNum(s.cabins);
      const h = toNum(s.heads);
      return cab !== null && h !== null && cab > 0 && h > cab;
    },
  },
  {
    id: "occupancy_less_than_berths",
    field: "maxOccupancy",
    severity: "warning",
    message: "Max occupancy is less than berths — occupancy should typically equal or exceed berths",
    check: (s) => {
      const ber = toNum(s.berths);
      const occ = toNum(s.maxOccupancy);
      return ber !== null && occ !== null && ber > 0 && occ > 0 && occ < ber;
    },
  },

  // --- Negative values ---
  {
    id: "negative_loa",
    field: "lengthOverall",
    severity: "error",
    message: "Length Overall is negative",
    check: (s) => {
      const v = toNum(s.lengthOverall);
      return v !== null && v < 0;
    },
  },
  {
    id: "negative_beam",
    field: "beam",
    severity: "error",
    message: "Beam is negative",
    check: (s) => {
      const v = toNum(s.beam);
      return v !== null && v < 0;
    },
  },
  {
    id: "negative_draft",
    field: "draft",
    severity: "error",
    message: "Draft is negative",
    check: (s) => {
      const v = toNum(s.draft);
      return v !== null && v < 0;
    },
  },
  {
    id: "negative_displacement",
    field: "displacement",
    severity: "error",
    message: "Displacement is negative",
    check: (s) => {
      const v = toNum(s.displacement);
      return v !== null && v < 0;
    },
  },
  {
    id: "negative_ballast",
    field: "ballast",
    severity: "error",
    message: "Ballast is negative",
    check: (s) => {
      const v = toNum(s.ballast);
      return v !== null && v < 0;
    },
  },

  // --- Extreme LOA values ---
  {
    id: "loa_very_small",
    field: "lengthOverall",
    severity: "warning",
    message: "LOA is less than 5m — verify this is correct for a sailing yacht",
    check: (s) => {
      const v = toNum(s.lengthOverall);
      return v !== null && v > 0 && v < 5;
    },
  },
  {
    id: "loa_very_large",
    field: "lengthOverall",
    severity: "warning",
    message: "LOA exceeds 30m — verify this is correct (superyacht territory)",
    check: (s) => {
      const v = toNum(s.lengthOverall);
      return v !== null && v > 30;
    },
  },
];

// ---------------------------------------------------------------------------
// Validation Engine
// ---------------------------------------------------------------------------

/**
 * Validate a yacht's specs against all rules.
 */
export function validateSpecs(specs: YachtSpecs): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const rule of RULES) {
    if (rule.check(specs)) {
      issues.push({
        rule: rule.id,
        severity: rule.severity,
        message: rule.message,
        field: rule.field,
        value: (specs as unknown as Record<string, unknown>)[rule.field] ?? null,
      });
    }
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  return {
    issues,
    derivedSpecs: calculateDerivedSpecs(specs),
    issueCount: { error: errorCount, warning: warningCount, info: infoCount },
    isValid: errorCount === 0,
  };
}

// ---------------------------------------------------------------------------
// Derived Specs
// ---------------------------------------------------------------------------

/**
 * Calculate derived performance specs from base yacht data.
 */
export function calculateDerivedSpecs(specs: YachtSpecs): DerivedSpec[] {
  const loa = toNum(specs.lengthOverall);
  const beam = toNum(specs.beam);
  const draft = toNum(specs.draft);
  const disp = toNum(specs.displacement);
  const ballast = toNum(specs.ballast);
  const sailArea = toNum(specs.sailAreaMain);

  return [
    {
      key: "hullSpeed",
      label: "Hull Speed",
      value: loa ? Math.round(Math.sqrt(loa * 1.0) * 1.34 * 100) / 100 : null, // knots: 1.34 * sqrt(LWL in feet); approximated as 1.34 * sqrt(LOA * 3.28084)
      unit: "knots",
      description: "Theoretical maximum hull speed ≈ 1.34 × √LWL (ft)",
    },
    {
      key: "displacementLength",
      label: "Displacement/Length Ratio",
      value: displacementLengthRatio(disp, loa),
      unit: "",
      description: "D/L ratio: racer ≈ 100–150, cruiser ≈ 200–300, heavy ≈ 300+",
    },
    {
      key: "sailAreaDisplacement",
      label: "Sail Area/Displacement Ratio",
      value: sailAreaDisplacementRatio(sailArea, disp),
      unit: "",
      description: "SA/D: typical ≈ 16–20, performance > 22",
    },
    {
      key: "ballastRatioPercent",
      label: "Ballast Ratio",
      value: ballastRatio(ballast, disp),
      unit: "%",
      description: "Ballast/Displacement: typical 25–45%",
    },
    {
      key: "lengthBeamRatio",
      label: "Length/Beam Ratio",
      value: loa && beam && beam > 0 ? Math.round((loa / beam) * 100) / 100 : null,
      unit: "",
      description: "L/B ratio: typical 2.5–4.0 for sailboats",
    },
    {
      key: "beamDraftRatio",
      label: "Beam/Draft Ratio",
      value: beam && draft && draft > 0 ? Math.round((beam / draft) * 100) / 100 : null,
      unit: "",
      description: "B/D ratio: typical 1.5–3.0 for sailboats",
    },
    {
      key: "capsizeScreening",
      label: "Capsize Screening Value",
      value: beam && disp && disp > 0
        ? Math.round((beam / Math.pow(disp * 2.2046 / 64, 1 / 3)) * 100) / 100
        : null,
      unit: "",
      description: "CSV: < 2.0 preferred for offshore safety",
    },
    {
      key: "comfortRatio",
      label: "Motion Comfort Ratio",
      value: disp && loa && beam
        ? Math.round((disp * 0.65 / (loa * 0.65 * Math.pow(beam, 1.33))) * 100) / 100
        : null,
      unit: "",
      description: "Higher = more comfortable in rough seas (20–40 typical)",
    },
  ];
}

// ---------------------------------------------------------------------------
// Bulk Validation Helpers
// ---------------------------------------------------------------------------

export interface BulkValidationSummary {
  totalYachts: number;
  yachtsWithErrors: number;
  yachtsWithWarnings: number;
  yachtsClean: number;
  totalIssues: { error: number; warning: number; info: number };
  topIssues: { rule: string; message: string; count: number; severity: Severity }[];
}

export interface YachtValidationEntry {
  id: number;
  modelName: string;
  manufacturer: string;
  year: number | null;
  slug: string | null;
  issues: ValidationIssue[];
  derivedSpecs: DerivedSpec[];
  issueCount: { error: number; warning: number; info: number };
  isValid: boolean;
}

/**
 * Summarize validation results across multiple yachts.
 */
export function summarizeBulkValidation(entries: YachtValidationEntry[]): BulkValidationSummary {
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfos = 0;
  const issueCounts: Record<string, { rule: string; message: string; count: number; severity: Severity }> = {};

  for (const entry of entries) {
    totalErrors += entry.issueCount.error;
    totalWarnings += entry.issueCount.warning;
    totalInfos += entry.issueCount.info;

    for (const issue of entry.issues) {
      if (!issueCounts[issue.rule]) {
        issueCounts[issue.rule] = { rule: issue.rule, message: issue.message, count: 0, severity: issue.severity };
      }
      issueCounts[issue.rule].count++;
    }
  }

  return {
    totalYachts: entries.length,
    yachtsWithErrors: entries.filter((e) => e.issueCount.error > 0).length,
    yachtsWithWarnings: entries.filter((e) => e.issueCount.warning > 0).length,
    yachtsClean: entries.filter((e) => e.issues.length === 0).length,
    totalIssues: { error: totalErrors, warning: totalWarnings, info: totalInfos },
    topIssues: Object.values(issueCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
  };
}

// Export rules for introspection/testing
export { RULES };
