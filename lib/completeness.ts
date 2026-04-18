/**
 * Spec Completeness Scoring (P10.5)
 * 
 * Calculates a 0-100% completeness score for yacht models
 * based on how many spec fields are populated, with weighted categories.
 */

// Fields that contribute to completeness, grouped by category with weights
const SPEC_CATEGORIES = {
  // Core dimensions — most important (weight: 30)
  dimensions: {
    weight: 30,
    fields: ["lengthOverall", "beam", "draft"] as const,
  },
  // Performance specs (weight: 20)
  performance: {
    weight: 20,
    fields: ["displacement", "ballast", "sailAreaMain", "rigType", "keelType"] as const,
  },
  // Construction (weight: 15)
  construction: {
    weight: 15,
    fields: ["hullMaterial", "engineHp", "engineType"] as const,
  },
  // Accommodation (weight: 15)
  accommodation: {
    weight: 15,
    fields: ["cabins", "berths", "heads"] as const,
  },
  // Tankage & utility (weight: 10)
  utility: {
    weight: 10,
    fields: ["fuelCapacity", "waterCapacity"] as const,
  },
  // Descriptive content (weight: 10)
  content: {
    weight: 10,
    fields: ["description", "designNotes"] as const,
  },
} as const;

type YachtModel = Record<string, unknown>;

// Accept any object with string keys for flexibility
function toRecord(obj: object): Record<string, unknown> {
  return obj as Record<string, unknown>;
}

/**
 * Calculate the completeness score for a single yacht model.
 * Returns a number between 0 and 100.
 */
export function calculateCompletenessScore(yacht: object): number {
  const record = toRecord(yacht);
  let totalScore = 0;

  for (const category of Object.values(SPEC_CATEGORIES)) {
    const populatedCount = category.fields.filter((field) => {
      const value = record[field];
      if (value === null || value === undefined) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      return true;
    }).length;

    const categoryScore = populatedCount / category.fields.length;
    totalScore += categoryScore * category.weight;
  }

  return Math.round(totalScore);
}

/**
 * Get completeness level for display purposes.
 */
export function getCompletenessLevel(score: number): {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
} {
  if (score >= 80) {
    return {
      label: "Comprehensive",
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    };
  }
  if (score >= 60) {
    return {
      label: "Good",
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    };
  }
  if (score >= 40) {
    return {
      label: "Partial",
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
    };
  }
  if (score >= 20) {
    return {
      label: "Basic",
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
    };
  }
  return {
    label: "Minimal",
    color: "bg-red-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
  };
}

/**
 * Check if a yacht should be noindexed based on completeness.
 * Below 30% completeness → noindex to avoid thin content SEO issues.
 */
export function shouldNoindex(score: number, threshold = 30): boolean {
  return score < threshold;
}

/**
 * Calculate average completeness for an array of yachts.
 */
export function calculateAverageScore(yachts: YachtModel[]): number {
  if (yachts.length === 0) return 0;
  const total = yachts.reduce((sum, y) => sum + calculateCompletenessScore(y), 0);
  return Math.round(total / yachts.length);
}

/**
 * Get the list of missing fields for a yacht model (for improvement suggestions).
 */
export function getMissingFields(yacht: object): string[] {
  const record = toRecord(yacht);
  const missing: string[] = [];

  for (const category of Object.values(SPEC_CATEGORIES)) {
    for (const field of category.fields) {
      const value = record[field];
      if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
        missing.push(field);
      }
    }
  }

  return missing;
}

// Export category info for display
export { SPEC_CATEGORIES };
