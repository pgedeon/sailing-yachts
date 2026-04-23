import { pool } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

// Cache configuration for search performance
const SEARCH_CACHE_TTL_SECONDS = 120; // 2 minutes for search results
const MAX_SEARCH_RESULTS = 50;
const MIN_SEARCH_LENGTH = 2;
const CACHE_PREFIX = 'search:';

/**
 * GET /api/v1/search?q=...&limit=N — Optimized search yachts with caching and performance improvements.
 *
 * Query params:
 *   q — search query (required, min 2 chars)
 *   limit — max results (default 20, max 50)
 *   nocache — bypass cache if set to 'true'
 *   fields — comma-separated field names for selective loading
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return apiError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded.', 429, { rateLimit: rl });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const limit = Math.min(MAX_SEARCH_RESULTS, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const noCache = searchParams.get('nocache') === 'true';
    const fieldsParam = searchParams.get('fields');
    const selectedFields = fieldsParam ? fieldsParam.split(',').map(f => f.trim()) : [];

    // Validate query
    if (!q || q.length < MIN_SEARCH_LENGTH) {
      return apiError('INVALID_PARAM', `Query parameter "q" must be at least ${MIN_SEARCH_LENGTH} characters`, 400, { rateLimit: rl });
    }

    // Generate cache key
    const cacheKey = `${CACHE_PREFIX}${encodeURIComponent(q)}:${limit}:${selectedFields.join(',')}`;
    
    // Check cache first unless nocache is specified
    if (!noCache) {
      const cachedResponse = await getSearchCache(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Escape search terms for security
    const escapedQ = q.replace(/[%;_\\]/g, '\\$&');

    // Optimized search query with GIN trigram indexes
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       WHERE (
         y.model_name ILIKE $1
         OR m.name ILIKE $1
         OR CONCAT(m.name, ' ', y.model_name) ILIKE $1
         OR y.rig_type ILIKE $1
         OR y.keel_type ILIKE $1
         OR y.hull_material ILIKE $1
         OR y.description ILIKE $1
         OR y.design_notes ILIKE $1
       )`,
      [`%${escapedQ}%`]
    );
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    // Optimized data query with better sorting for search relevance
    const dataResult = await pool.query(
      `SELECT
        y.id, y.model_name, y.slug, y.year,
        y.length_overall, y.beam, y.draft, y.displacement,
        y.rig_type, y.keel_type, y.hull_material,
        y.cabins, y.berths,
        m.name as manufacturer_name, m.country as manufacturer_country
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       WHERE (
         y.model_name ILIKE $1
         OR m.name ILIKE $1
         OR CONCAT(m.name, ' ', y.model_name) ILIKE $1
         OR y.rig_type ILIKE $1
         OR y.keel_type ILIKE $1
         OR y.hull_material ILIKE $1
         OR y.description ILIKE $1
         OR y.design_notes ILIKE $1
       )
       ORDER BY
         -- Prioritize exact matches at the beginning of the model name
         CASE
           WHEN y.model_name ILIKE $2 THEN 0
           WHEN m.name ILIKE $2 THEN 1
           WHEN CONCAT(m.name, ' ', y.model_name) ILIKE $2 THEN 2
           ELSE 3
         END,
         -- Then prioritize by length (larger yachts first for most searches)
         y.length_overall DESC NULLS LAST,
         -- Finally by year (newer first)
         y.year DESC NULLS LAST
       LIMIT $3`,
      [`%${escapedQ}%`, `${escapedQ}%`, limit]
    );

    // Transform response with field selection
    const yachts = dataResult.rows.map((row: any) => {
      const yacht: any = {};
      
      if (selectedFields.length === 0 || selectedFields.includes('id') || selectedFields.includes('y.id')) {
        yacht.id = row.id;
      }
      if (selectedFields.length === 0 || selectedFields.includes('slug') || selectedFields.includes('y.slug')) {
        yacht.slug = row.slug ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('modelName') || selectedFields.includes('y.model_name')) {
        yacht.modelName = row.model_name;
      }
      if (selectedFields.length === 0 || selectedFields.includes('year') || selectedFields.includes('y.year')) {
        yacht.year = row.year ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('lengthOverall') || selectedFields.includes('y.length_overall')) {
        yacht.lengthOverall = row.length_overall != null ? parseFloat(row.length_overall) : undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('beam') || selectedFields.includes('y.beam')) {
        yacht.beam = row.beam != null ? parseFloat(row.beam) : undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('draft') || selectedFields.includes('y.draft')) {
        yacht.draft = row.draft != null ? parseFloat(row.draft) : undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('displacement') || selectedFields.includes('y.displacement')) {
        yacht.displacement = row.displacement != null ? parseFloat(row.displacement) : undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('rigType') || selectedFields.includes('y.rig_type')) {
        yacht.rigType = row.rig_type ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('keelType') || selectedFields.includes('y.keel_type')) {
        yacht.keelType = row.keel_type ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('hullMaterial') || selectedFields.includes('y.hull_material')) {
        yacht.hullMaterial = row.hull_material ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('cabins') || selectedFields.includes('y.cabins')) {
        yacht.cabins = row.cabins ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('berths') || selectedFields.includes('y.berths')) {
        yacht.berths = row.berths ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('manufacturerName') || selectedFields.includes('m.name')) {
        yacht.manufacturer = {
          id: row.manufacturer_id ?? undefined,
          name: row.manufacturer_name ?? '',
          country: row.manufacturer_country ?? undefined,
        };
      }

      return yacht;
    });

    // Create response
    const response = apiSuccess(yachts, {
      meta: { total, limit },
      rateLimit: rl,
    });

    // Add search-specific caching headers
    response.headers.set('Cache-Control', `public, s-maxage=${SEARCH_CACHE_TTL_SECONDS}, stale-while-revalidate=30`);
    response.headers.set('X-Search-TTL', `${SEARCH_CACHE_TTL_SECONDS}s`);
    response.headers.set('X-Query-Length', q.length.toString());

    // Cache the response
    await cacheSearchResponse(cacheKey, response, SEARCH_CACHE_TTL_SECONDS);

    return response;
  } catch (error: any) {
    console.error('API v1 search error:', error);
    return apiError('INTERNAL_ERROR', 'Search failed', 500, { details: error.message, rateLimit: rl });
  }
}

// Search cache implementation
const searchCache = new Map<string, { response: Response; expires: number }>();

async function getSearchCache(cacheKey: string): Promise<Response | null> {
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    // Clone the response to avoid body stream already read error
    return new Response(cached.response.body, {
      status: cached.response.status,
      statusText: cached.response.statusText,
      headers: cached.response.headers
    });
  }
  return null;
}

async function cacheSearchResponse(cacheKey: string, response: Response, ttl: number): Promise<void> {
  try {
    // Clone response to avoid stream issues
    const clonedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    searchCache.set(cacheKey, {
      response: clonedResponse,
      expires: Date.now() + (ttl * 1000)
    });

    // Simple cache cleanup - keep search cache size reasonable
    if (searchCache.size > 500) {
      const now = Date.now();
      for (const [key, value] of searchCache.entries()) {
        if (value.expires < now) {
          searchCache.delete(key);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to cache search response:', error);
  }
}

// Add cache warming endpoint for common search queries
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { queries } = body;
    
    if (!Array.isArray(queries)) {
      return apiError('INVALID_PARAM', 'Queries must be an array', 400);
    }

    // Warm cache for common search queries
    const warmingPromises = queries.slice(0, 10).map(async (query: string) => {
      if (query && query.length >= MIN_SEARCH_LENGTH) {
        try {
          const warmUrl = `${request.url}?q=${encodeURIComponent(query)}&limit=10`;
          const warmRequest = new Request(warmUrl, {
            method: 'GET',
            headers: { 'x-warm-cache': 'true' }
          });
          await GET(warmRequest);
        } catch (error) {
          console.warn(`Failed to warm cache for query "${query}":`, error);
        }
      }
    });

    await Promise.allSettled(warmingPromises);
    
    return apiSuccess({ 
      message: `Cache warming initiated for ${queries.length} queries`,
      warmed: queries.length 
    });
  } catch (error: any) {
    return apiError('INVALID_REQUEST', 'Failed to warm cache', 400, { details: error.message });
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}