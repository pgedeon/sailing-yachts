// API Contract Types for Sailing Yachts
// Generated from actual API responses to ensure type safety

export interface Yacht {
  id: number;
  manufacturer: string;
  modelName: string;
  year?: number;
  slug?: string;
  lengthOverall?: number;
  beam?: number;
  draft?: number;
  displacement?: number;
  ballast?: number;
  sailAreaMain?: number;
  rigType?: string;
  keelType?: string;
  hullMaterial?: string;
  cabins?: number;
  berths?: number;
  heads?: number;
  maxOccupancy?: number;
  engineHp?: number;
  engineType?: string;
  fuelCapacity?: number;
  waterCapacity?: number;
  designNotes?: string;
  description?: string;
  sourceUrl?: string;
  sourceAttribution?: string;
  adminLinks?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchSuggestion {
  id: number;
  modelName: string;
  manufacturer: string;
  slug: string;
  year?: number;
  lengthOverall?: number;
  display: string;
}

export interface ApiResponse<T> {
  yachts?: T[];
  suggestions?: SearchSuggestion[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  distinct?: {
    rigTypes: string[];
    keelTypes: string[];
    hullMaterials: string[];
  };
  query?: string;
  error?: string;
  details?: string;
}

export interface APIError {
  error: string;
  details?: string;
}

// Contract validation helpers
export function validateYachtContract(data: any): data is Yacht {
  return (
    typeof data === 'object' &&
    typeof data.id === 'number' &&
    typeof data.manufacturer === 'string' &&
    typeof data.modelName === 'string' &&
    (data.year === undefined || typeof data.year === 'number') &&
    (data.slug === undefined || typeof data.slug === 'string') &&
    (data.lengthOverall === undefined || typeof data.lengthOverall === 'number')
  );
}

export function validateApiResponseContract<T>(data: any): data is ApiResponse<T> {
  return (
    typeof data === 'object' &&
    (data.yachts === undefined || Array.isArray(data.yachts)) &&
    (data.suggestions === undefined || Array.isArray(data.suggestions)) &&
    (data.total === undefined || typeof data.total === 'number') &&
    (data.page === undefined || typeof data.page === 'number') &&
    (data.limit === undefined || typeof data.limit === 'number') &&
    (data.totalPages === undefined || typeof data.totalPages === 'number') ||
    (data.distinct === undefined || 
      (typeof data.distinct === 'object' &&
        Array.isArray(data.distinct?.rigTypes) &&
        Array.isArray(data.distinct?.keelTypes) &&
        Array.isArray(data.distinct?.hullMaterials)))
  );
}

export function validateSearchSuggestionContract(data: any): data is SearchSuggestion {
  return (
    typeof data === 'object' &&
    typeof data.id === 'number' &&
    typeof data.modelName === 'string' &&
    typeof data.manufacturer === 'string' &&
    typeof data.display === 'string' &&
    (data.year === undefined || typeof data.year === 'number') &&
    (data.lengthOverall === undefined || typeof data.lengthOverall === 'number')
  );
}