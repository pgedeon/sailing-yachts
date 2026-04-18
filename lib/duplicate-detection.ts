/**
 * Duplicate Detection for Yacht Data Imports (P10.1)
 * 
 * Provides fuzzy matching on model name + manufacturer + year
 * to catch near-duplicates like "Oceanis 34.1" vs "Oceanis 341".
 */

/**
 * Normalize a model name for comparison by removing common variations.
 */
export function normalizeModelName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove dots between numbers: "34.1" → "341"
    .replace(/(\d)\.(\d)/g, "$1$2")
    // Remove special characters except spaces and hyphens
    .replace(/[^a-z0-9\s-]/g, "")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    // Remove trailing/leading spaces
    .trim();
}

/**
 * Normalize a manufacturer name for comparison.
 */
export function normalizeManufacturerName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common suffixes
    .replace(/\s*(yachts|boats|marine|sailing|shipyard)\s*$/i, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio (0-1) between two strings.
 */
export function similarity(a: string, b: string): number {
  const normA = normalizeModelName(a);
  const normB = normalizeModelName(b);

  if (normA === normB) return 1;
  if (!normA || !normB) return 0;

  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;

  const dist = levenshteinDistance(normA, normB);
  return 1 - dist / maxLen;
}

/**
 * Match confidence levels.
 */
export type MatchConfidence = "exact" | "high" | "medium" | "low" | "none";

export interface DuplicateMatch {
  existingId: number;
  existingModelName: string;
  existingManufacturer: string;
  existingYear: number;
  confidence: MatchConfidence;
  score: number;
  matchType: "model_name" | "model_name_and_year" | "full";
}

export interface ExistingRecord {
  id: number;
  modelName: string;
  manufacturer: string;
  year: number;
}

/**
 * Find potential duplicates for a new yacht record.
 * 
 * @param newModelName - The model name to check
 * @param newManufacturer - The manufacturer name to check  
 * @param newYear - The year to check
 * @param existingRecords - All existing records from the DB
 * @param threshold - Minimum similarity score (0-1) to consider a match, default 0.7
 * @returns Array of potential duplicate matches sorted by confidence (highest first)
 */
export function findDuplicates(
  newModelName: string,
  newManufacturer: string,
  newYear: number,
  existingRecords: ExistingRecord[],
  threshold = 0.7,
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  const normNewMfr = normalizeManufacturerName(newManufacturer);

  for (const existing of existingRecords) {
    const normExistingMfr = normalizeManufacturerName(existing.manufacturer);

    // If manufacturers don't match at all, skip
    const mfrSimilarity = similarity(newManufacturer, existing.manufacturer);
    // For normalized comparison
    const normMfrSimilarity = similarity(normNewMfr, normExistingMfr);
    
    // Manufacturers must be reasonably similar (> 0.5) or exactly match after normalization
    const mfrMatch = normNewMfr === normExistingMfr || 
                     mfrSimilarity > 0.8 || 
                     normMfrSimilarity > 0.8;
    
    if (!mfrMatch) continue;

    // Check model name similarity
    const modelScore = similarity(newModelName, existing.modelName);
    
    if (modelScore < threshold) continue;

    // Also check with normalized model names
    const normNewModel = normalizeModelName(newModelName);
    const normExistingModel = normalizeModelName(existing.modelName);
    const normModelScore = normNewModel === normExistingModel ? 1 : modelScore;

    const bestScore = Math.max(modelScore, normModelScore);

    // Determine match type and confidence
    let matchType: DuplicateMatch["matchType"];
    let confidence: MatchConfidence;

    if (bestScore >= 0.99 && newYear === existing.year) {
      matchType = "full";
      confidence = "exact";
    } else if (bestScore >= 0.99) {
      matchType = "model_name";
      confidence = "high";
    } else if (bestScore >= 0.85 && newYear === existing.year) {
      matchType = "model_name_and_year";
      confidence = "high";
    } else if (bestScore >= 0.85) {
      matchType = "model_name";
      confidence = "medium";
    } else if (bestScore >= 0.7 && newYear === existing.year) {
      matchType = "model_name_and_year";
      confidence = "medium";
    } else {
      matchType = "model_name";
      confidence = "low";
    }

    matches.push({
      existingId: existing.id,
      existingModelName: existing.modelName,
      existingManufacturer: existing.manufacturer,
      existingYear: existing.year,
      confidence,
      score: bestScore,
      matchType,
    });
  }

  // Sort by confidence (exact > high > medium > low)
  const confidenceOrder: Record<MatchConfidence, number> = {
    exact: 4,
    high: 3,
    medium: 2,
    low: 1,
    none: 0,
  };

  matches.sort((a, b) => {
    const confDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    if (confDiff !== 0) return confDiff;
    return b.score - a.score;
  });

  return matches;
}

/**
 * Check if a record is an exact duplicate (same model name, manufacturer, year).
 */
export function isExactDuplicate(
  newModelName: string,
  newManufacturer: string,
  newYear: number,
  existingRecords: ExistingRecord[],
): ExistingRecord | null {
  const normNewModel = normalizeModelName(newModelName);
  const normNewMfr = normalizeManufacturerName(newManufacturer);

  for (const existing of existingRecords) {
    const normExistingModel = normalizeModelName(existing.modelName);
    const normExistingMfr = normalizeManufacturerName(existing.manufacturer);

    if (
      normNewModel === normExistingModel &&
      normNewMfr === normExistingMfr &&
      newYear === existing.year
    ) {
      return existing;
    }
  }

  return null;
}
