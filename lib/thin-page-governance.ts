/**
 * Thin-page governance utilities for canonical URL and robots meta decisions.
 *
 * This module handles:
 * - Canonical URL generation for paginated/filtered pages
 * - Robots noindex decisions for low-value filter combinations
 * - Deduplication of list pages that only differ by query params
 */

export interface ThinPageMetadata {
  canonical: string;
  noindex: boolean;
  nofollow: boolean;
}

/**
 * Determine if a yachts page URL should be noindexed based on filter params.
 *
 * Rules:
 * - Page 1 with no filters: index (main listing page)
 * - Page 2+ with no filters: index (pagination)
 * - Single meaningful filter: index (valuable niche content)
 * - Multiple filters: noindex if low-value combination
 * - Search params only (sort): index
 */
export function shouldNoindexYachtsPage(searchParams: {
  page?: string;
  manufacturers?: string[];
  rigType?: string;
  keelType?: string;
  hullMaterial?: string;
  lengthMin?: string;
  lengthMax?: string;
  displacementMin?: string;
  displacementMax?: string;
  cabinsMin?: string;
  cabinsMax?: string;
}): boolean {
  const page = parseInt(searchParams.page || '1', 10);
  const hasFilters = hasActiveFilters(searchParams);

  // No filters - always index (canonical pagination)
  if (!hasFilters) {
    return false;
  }

  // Count active filters
  const activeFilters = countActiveFilters(searchParams);

  // Page 1 with 1-2 filters: index (valuable niche pages)
  if (page === 1 && activeFilters <= 2) {
    return false;
  }

  // Page 2+ with filters: noindex (duplicate content)
  if (page > 1 && hasFilters) {
    return true;
  }

  // 3+ filters: likely very specific/low traffic, noindex
  if (activeFilters >= 3) {
    return true;
  }

  // Broad ranges only (e.g., lengthMin=10, lengthMax=50): noindex
  // This creates too many combinations with little value
  if (hasBroadRangesOnly(searchParams)) {
    return true;
  }

  return false;
}

/**
 * Generate canonical URL for yachts page.
 *
 * Rules:
 * - No filters or pagination: canonical is `/yachts`
 * - Pagination: canonical is `/yachts?page=N`
 * - Filters (single or pair): canonical includes those filters
 * - Multiple low-value filters: canonical is `/yachts` (but noindex)
 */
export function generateYachtsPageCanonical(searchParams: {
  page?: string;
  manufacturers?: string[];
  rigType?: string;
  keelType?: string;
  hullMaterial?: string;
  lengthMin?: string;
  lengthMax?: string;
  displacementMin?: string;
  displacementMax?: string;
  cabinsMin?: string;
  cabinsMax?: string;
}): string {
  const noindex = shouldNoindexYachtsPage(searchParams);

  // If noindexed, canonical points to base page
  if (noindex) {
    return '/yachts';
  }

  const page = searchParams.page || '1';
  const hasFilters = hasActiveFilters(searchParams);

  // No filters, page 1: base URL
  if (!hasFilters && page === '1') {
    return '/yachts';
  }

  // No filters, pagination only
  if (!hasFilters && page !== '1') {
    return `/yachts?page=${page}`;
  }

  // Has filters - build query string with active filters
  const params = new URLSearchParams();

  // Only include meaningful filters (not broad ranges)
  if (searchParams.page && searchParams.page !== '1') {
    params.append('page', searchParams.page);
  }

  if (searchParams.manufacturers?.length) {
    searchParams.manufacturers.forEach((m) => params.append('filters[manufacturers]', m));
  }

  if (searchParams.rigType) params.append('filters[rigType]', searchParams.rigType);
  if (searchParams.keelType) params.append('filters[keelType]', searchParams.keelType);
  if (searchParams.hullMaterial) params.append('filters[hullMaterial]', searchParams.hullMaterial);
  if (searchParams.lengthMin) params.append('filters[lengthMin]', searchParams.lengthMin);
  if (searchParams.lengthMax) params.append('filters[lengthMax]', searchParams.lengthMax);
  if (searchParams.displacementMin) params.append('filters[displacementMin]', searchParams.displacementMin);
  if (searchParams.displacementMax) params.append('filters[displacementMax]', searchParams.displacementMax);
  if (searchParams.cabinsMin) params.append('filters[cabinsMin]', searchParams.cabinsMin);
  if (searchParams.cabinsMax) params.append('filters[cabinsMax]', searchParams.cabinsMax);

  const queryString = params.toString();
  return queryString ? `/yachts?${queryString}` : '/yachts';
}

/**
 * Compare page with ?ids= should always be noindex since canonical
 * compare pages exist at /compare/slugA-vs-slugB
 */
export function shouldNoindexComparePage(ids?: (string | number)[]): boolean {
  // Only noindex the ?ids= version; base /compare page should be indexed
  return (ids?.length ?? 0) > 0;
}

/**
 * Search page should always be noindex (search results are user-specific)
 */
export function shouldNoindexSearchPage(): boolean {
  return true;
}

/**
 * Manufacturers page with filters should be noindexed
 */
export function shouldNoindexManufacturersPage(searchParams: { page?: string }): boolean {
  // Page 1 is canonical, page 2+ should noindex
  // (manufacturers listing is small enough to fit on one page)
  const page = parseInt(searchParams.page || '1', 10);
  return page > 1;
}

/**
 * Generate canonical URL for manufacturers page
 */
export function generateManufacturersPageCanonical(searchParams: { page?: string }): string {
  const noindex = shouldNoindexManufacturersPage(searchParams);
  return noindex ? '/manufacturers' : '/manufacturers';
}

// Helper functions

function hasActiveFilters(searchParams: any): boolean {
  return countActiveFilters(searchParams) > 0;
}

function countActiveFilters(searchParams: any): number {
  let count = 0;
  if (searchParams.manufacturers?.length) count++;
  if (searchParams.rigType) count++;
  if (searchParams.keelType) count++;
  if (searchParams.hullMaterial) count++;
  if (searchParams.lengthMin) count++;
  if (searchParams.lengthMax) count++;
  if (searchParams.displacementMin) count++;
  if (searchParams.displacementMax) count++;
  if (searchParams.cabinsMin) count++;
  if (searchParams.cabinsMax) count++;
  return count;
}

function hasBroadRangesOnly(searchParams: any): boolean {
  // Check if only broad range filters are active (no specific filters)
  const hasSpecificFilters =
    searchParams.manufacturers?.length ||
    searchParams.rigType ||
    searchParams.keelType ||
    searchParams.hullMaterial;

  if (hasSpecificFilters) {
    return false;
  }

  // Check if ranges cover too much (e.g., min=10, max=50)
  const lengthMin = parseInt(searchParams.lengthMin || '0', 10);
  const lengthMax = parseInt(searchParams.lengthMax || '100', 10);
  const lengthRange = lengthMax - lengthMin;

  // If length range is > 30ft, consider it broad
  if (lengthRange > 30) {
    return true;
  }

  return false;
}
