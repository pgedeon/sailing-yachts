/**
 * Saved Search Filter Matcher (P17.5)
 *
 * Matches yacht data against saved search filter params to determine
 * which saved searches a yacht would appear in. Used for filter-based alerts.
 */

export interface YachtForMatching {
  id: number;
  manufacturerId: number | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  lengthOverall: number | null;
  displacement: number | null;
  draft: number | null;
  sailArea: number | null;
  cabinCount: number | null;
  berthCount: number | null;
  manufacturerName?: string | null;
  modelName?: string | null;
  useCaseTags?: string[] | null;
  year?: number | null;
}

export interface SearchFilters {
  // Text search
  query?: string;
  q?: string;
  // Range filters
  lengthMin?: number | string;
  lengthMax?: number | string;
  displacementMin?: number | string;
  displacementMax?: number | string;
  draftMin?: number | string;
  draftMax?: number | string;
  sailAreaMin?: number | string;
  sailAreaMax?: number | string;
  // Exact/categorical filters
  manufacturerId?: number | string;
  manufacturerName?: string;
  rigType?: string;
  keelType?: string;
  hullMaterial?: string;
  cabinCount?: number | string;
  berthCount?: number | string;
  // Use case tags
  useCase?: string;
  useCases?: string[];
  // Year range
  yearMin?: number | string;
  yearMax?: number | string;
  // Sort / pagination (ignored for matching)
  sort?: string;
  page?: number | string;
  limit?: number | string;
  [key: string]: unknown;
}

/** Normalize a filter value to a number, returning null if invalid */
function toNum(val: unknown): number | null {
  if (val == null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

/** Check if a value is in a numeric range [min, max] */
function inRange(value: number | null, min: number | null, max: number | null): boolean {
  if (value == null) return false;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

/** Case-insensitive string match (contains) */
function textMatches(haystack: string | null | undefined, needle: string): boolean {
  if (!needle || !haystack) return true; // no filter = match all
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/**
 * Check if a yacht matches the given saved search filters.
 * Returns true if the yacht satisfies ALL filter criteria.
 */
export function yachtMatchesFilters(yacht: YachtForMatching, filters: SearchFilters): boolean {
  // Text search — match against manufacturer name, model name
  const query = filters.query || filters.q;
  if (query && typeof query === "string") {
    const combined = `${yacht.manufacturerName || ""} ${yacht.modelName || ""}`.trim();
    if (!textMatches(combined, query)) return false;
  }

  // Manufacturer filter
  const manufId = toNum(filters.manufacturerId);
  if (manufId != null && yacht.manufacturerId !== manufId) return false;

  if (filters.manufacturerName && typeof filters.manufacturerName === "string") {
    if (!textMatches(yacht.manufacturerName, filters.manufacturerName)) return false;
  }

  // Categorical filters
  if (filters.rigType && typeof filters.rigType === "string" && filters.rigType !== "") {
    if (!textMatches(yacht.rigType, filters.rigType)) return false;
  }

  if (filters.keelType && typeof filters.keelType === "string" && filters.keelType !== "") {
    if (!textMatches(yacht.keelType, filters.keelType)) return false;
  }

  if (filters.hullMaterial && typeof filters.hullMaterial === "string" && filters.hullMaterial !== "") {
    if (!textMatches(yacht.hullMaterial, filters.hullMaterial)) return false;
  }

  // Numeric range filters (only apply when a min/max is specified)
  const lenMin = toNum(filters.lengthMin);
  const lenMax = toNum(filters.lengthMax);
  if (lenMin != null || lenMax != null) {
    if (!inRange(yacht.lengthOverall, lenMin, lenMax)) return false;
  }
  const dispMin = toNum(filters.displacementMin);
  const dispMax = toNum(filters.displacementMax);
  if (dispMin != null || dispMax != null) {
    if (!inRange(yacht.displacement, dispMin, dispMax)) return false;
  }
  const drftMin = toNum(filters.draftMin);
  const drftMax = toNum(filters.draftMax);
  if (drftMin != null || drftMax != null) {
    if (!inRange(yacht.draft, drftMin, drftMax)) return false;
  }
  const saMin = toNum(filters.sailAreaMin);
  const saMax = toNum(filters.sailAreaMax);
  if (saMin != null || saMax != null) {
    if (!inRange(yacht.sailArea, saMin, saMax)) return false;
  }

  // Exact numeric filters
  const cabins = toNum(filters.cabinCount);
  if (cabins != null && yacht.cabinCount !== cabins) return false;

  const berths = toNum(filters.berthCount);
  if (berths != null && yacht.berthCount !== berths) return false;

  // Use case tags
  const useCaseFilter = filters.useCase || (Array.isArray(filters.useCases) ? filters.useCases : null);
  if (useCaseFilter) {
    const tags = yacht.useCaseTags || [];
    const filterTags = Array.isArray(useCaseFilter) ? useCaseFilter : [useCaseFilter];
    if (!filterTags.some((tag) => tags.includes(String(tag)))) return false;
  }

  // Year range
  const yrMin = toNum(filters.yearMin);
  const yrMax = toNum(filters.yearMax);
  if (yrMin != null || yrMax != null) {
    if (!inRange(yacht.year ?? null, yrMin, yrMax)) return false;
  }

  return true;
}

/**
 * Given a yacht and a list of saved searches, return the IDs of searches
 * whose filters the yacht matches. Only considers searches with alertEnabled=true.
 */
export function findMatchingSearches(
  yacht: YachtForMatching,
  searches: Array<{ id: number; searchParams: Record<string, unknown>; alertEnabled?: boolean }>
): number[] {
  return searches
    .filter((s) => s.alertEnabled !== false)
    .filter((s) => yachtMatchesFilters(yacht, s.searchParams as SearchFilters))
    .map((s) => s.id);
}

/**
 * Build a human-readable description of search filters.
 * Returns an array of { label, value } pairs for display.
 */
export function describeFilters(filters: SearchFilters): Array<{ label: string; value: string }> {
  const parts: Array<{ label: string; value: string }> = [];

  const query = filters.query || filters.q;
  if (query && typeof query === "string") {
    parts.push({ label: "Search", value: query });
  }

  const lengthMin = toNum(filters.lengthMin);
  const lengthMax = toNum(filters.lengthMax);
  if (lengthMin != null || lengthMax != null) {
    parts.push({ label: "Length", value: `${lengthMin ?? "any"}–${lengthMax ?? "any"}m` });
  }

  const dispMin = toNum(filters.displacementMin);
  const dispMax = toNum(filters.displacementMax);
  if (dispMin != null || dispMax != null) {
    parts.push({ label: "Displacement", value: `${dispMin ?? "any"}–${dispMax ?? "any"}kg` });
  }

  const draftMin = toNum(filters.draftMin);
  const draftMax = toNum(filters.draftMax);
  if (draftMin != null || draftMax != null) {
    parts.push({ label: "Draft", value: `${draftMin ?? "any"}–${draftMax ?? "any"}m` });
  }

  const saMin = toNum(filters.sailAreaMin);
  const saMax = toNum(filters.sailAreaMax);
  if (saMin != null || saMax != null) {
    parts.push({ label: "Sail Area", value: `${saMin ?? "any"}–${saMax ?? "any"}m²` });
  }

  if (filters.rigType && typeof filters.rigType === "string") {
    parts.push({ label: "Rig Type", value: filters.rigType });
  }
  if (filters.keelType && typeof filters.keelType === "string") {
    parts.push({ label: "Keel Type", value: filters.keelType });
  }
  if (filters.hullMaterial && typeof filters.hullMaterial === "string") {
    parts.push({ label: "Hull Material", value: filters.hullMaterial });
  }

  const cabins = toNum(filters.cabinCount);
  if (cabins != null) parts.push({ label: "Cabins", value: String(cabins) });

  const berths = toNum(filters.berthCount);
  if (berths != null) parts.push({ label: "Berths", value: String(berths) });

  const useCase = filters.useCase || (Array.isArray(filters.useCases) ? filters.useCases.join(", ") : null);
  if (useCase) parts.push({ label: "Use Case", value: String(useCase) });

  const yearMin = toNum(filters.yearMin);
  const yearMax = toNum(filters.yearMax);
  if (yearMin != null || yearMax != null) {
    parts.push({ label: "Year", value: `${yearMin ?? "any"}–${yearMax ?? "any"}` });
  }

  return parts;
}
