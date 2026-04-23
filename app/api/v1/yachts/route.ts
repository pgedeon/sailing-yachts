import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { checkRateLimit, getClientIp, rateLimitHeaders, DEFAULT_RATE_LIMIT } from '@/lib/rate-limit';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

// Cache configuration for performance optimization
const CACHE_TTL_SECONDS = 300; // 5 minutes for list data
const CACHE_TTL_SHORT_SECONDS = 60; // 1 minute for filtered searches
const MAX_RESULTS_PER_PAGE = 100;
const DEFAULT_RESULTS_PER_PAGE = 20;

/**
 * GET /api/v1/yachts — Optimized list yachts with caching, pagination, and field selection.
 *
 * Query params:
 *   page (default 1), limit (default 20, max 100)
 *   fields (comma-separated field names for selective loading)
 *   sort (id|modelName|year|lengthOverall|beam|draft|displacement|cabins|berths)
 *   order (asc|desc)
 *   manufacturer — manufacturer name (partial match)
 *   manufacturerId — exact manufacturer ID
 *   rigType, keelType, hullMaterial — exact match
 *   lengthMin, lengthMax — LOA range in meters
 *   yearMin, yearMax — year range
 *   cabinsMin — minimum cabins
 *   nocache — bypass cache if set to 'true'
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return apiError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please slow down.', 429, { rateLimit: rl });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(MAX_RESULTS_PER_PAGE, Math.max(1, parseInt(searchParams.get('limit') || `${DEFAULT_RESULTS_PER_PAGE}`, 10)));
    const noCache = searchParams.get('nocache') === 'true';
    
    // Field selection for reduced payload size
    const fieldsParam = searchParams.get('fields');
    const selectedFields = fieldsParam ? fieldsParam.split(',').map(f => f.trim()) : [];
    
    const cacheKey = `yachts:${page}:${limit}:${selectedFields.join(',')}:${encodeURIComponent(searchParams.toString())}`;

    // Check cache first unless nocache is specified
    if (!noCache) {
      const cachedResponse = await getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Sorting with optimized column mapping
    const sortMap: Record<string, string> = {
      id: 'y.id',
      modelName: 'y.model_name',
      year: 'y.year',
      lengthOverall: 'y.length_overall',
      beam: 'y.beam',
      draft: 'y.draft',
      displacement: 'y.displacement',
      cabins: 'y.cabins',
      berths: 'y.berths',
    };
    const sortKey = searchParams.get('sort') || 'id';
    const sortCol = sortMap[sortKey] || 'y.id';
    const sortOrder = searchParams.get('order')?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Build optimized WHERE conditions with indexed columns
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    // Manufacturer filter (indexed)
    const manufacturer = searchParams.get('manufacturer');
    if (manufacturer) {
      conditions.push(`m.name ILIKE $${idx++}`);
      params.push(`%${manufacturer}%`);
    }

    // Manufacturer ID filter (indexed)
    const manufacturerId = searchParams.get('manufacturerId');
    if (manufacturerId) {
      const mid = parseInt(manufacturerId, 10);
      if (!isNaN(mid)) {
        conditions.push(`y.manufacturer_id = $${idx++}`);
        params.push(mid);
      }
    }

    // Rig type filter (indexed)
    const rigType = searchParams.get('rigType');
    if (rigType) {
      conditions.push(`y.rig_type = $${idx++}`);
      params.push(rigType);
    }

    // Keel type filter (indexed)
    const keelType = searchParams.get('keelType');
    if (keelType) {
      conditions.push(`y.keel_type = $${idx++}`);
      params.push(keelType);
    }

    // Hull material filter (indexed)
    const hullMaterial = searchParams.get('hullMaterial');
    if (hullMaterial) {
      conditions.push(`y.hull_material = $${idx++}`);
      params.push(hullMaterial);
    }

    // Numeric filters with indexed columns
    const lengthMin = parseFloat(searchParams.get('lengthMin') || '');
    if (!isNaN(lengthMin)) {
      conditions.push(`y.length_overall >= $${idx++}`);
      params.push(lengthMin);
    }

    const lengthMax = parseFloat(searchParams.get('lengthMax') || '');
    if (!isNaN(lengthMax)) {
      conditions.push(`y.length_overall <= $${idx++}`);
      params.push(lengthMax);
    }

    const yearMin = parseInt(searchParams.get('yearMin') || '', 10);
    if (!isNaN(yearMin)) {
      conditions.push(`y.year >= $${idx++}`);
      params.push(yearMin);
    }

    const yearMax = parseInt(searchParams.get('yearMax') || '', 10);
    if (!isNaN(yearMax)) {
      conditions.push(`y.year <= $${idx++}`);
      params.push(yearMax);
    }

    const cabinsMin = parseInt(searchParams.get('cabinsMin') || '', 10);
    if (!isNaN(cabinsMin)) {
      conditions.push(`y.cabins >= $${idx++}`);
      params.push(cabinsMin);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query with optimized index usage
    const countResult = await pool.query(
      `SELECT COUNT(*)::int as count FROM yacht_models y LEFT JOIN manufacturers m ON y.manufacturer_id = m.id ${where}`,
      params
    );
    const total = countResult.rows[0]?.count || 0;

    // Determine fields to select based on field selection
    const baseFields = selectedFields.length > 0 ? selectedFields : [
      'y.id', 'y.model_name', 'y.slug', 'y.year', 'y.manufacturer_id',
      'y.length_overall', 'y.beam', 'y.draft', 'y.displacement', 'y.ballast',
      'y.sail_area_main', 'y.rig_type', 'y.keel_type', 'y.hull_material',
      'y.cabins', 'y.berths', 'y.heads', 'y.max_occupancy',
      'y.engine_hp', 'y.engine_type', 'y.fuel_capacity', 'y.water_capacity',
      'y.design_notes', 'y.description',
      'm.name as manufacturer_name', 'm.country as manufacturer_country'
    ];

    // Build SELECT clause dynamically based on field selection
    const selectClause = baseFields
      .map(field => {
        // Map field aliases to actual column names
        const aliasMap: Record<string, string> = {
          'id': 'y.id',
          'slug': 'y.slug',
          'modelName': 'y.model_name',
          'year': 'y.year',
          'manufacturerId': 'y.manufacturer_id',
          'lengthOverall': 'y.length_overall',
          'beam': 'y.beam',
          'draft': 'y.draft',
          'displacement': 'y.displacement',
          'ballast': 'y.ballast',
          'sailAreaMain': 'y.sail_area_main',
          'rigType': 'y.rig_type',
          'keelType': 'y.keel_type',
          'hullMaterial': 'y.hull_material',
          'cabins': 'y.cabins',
          'berths': 'y.berths',
          'heads': 'y.heads',
          'maxOccupancy': 'y.max_occupancy',
          'engineHp': 'y.engine_hp',
          'engineType': 'y.engine_type',
          'fuelCapacity': 'y.fuel_capacity',
          'waterCapacity': 'y.water_capacity',
          'designNotes': 'y.design_notes',
          'description': 'y.description',
          'manufacturerName': 'm.name',
          'manufacturerCountry': 'm.country'
        };
        
        const dbField = aliasMap[field] || field;
        return field.includes('manufacturer') ? field : dbField;
      })
      .join(', ');

    // Data query with optimized SELECT and ORDER BY
    const offset = (page - 1) * limit;
    const dataResult = await pool.query(
      `SELECT
        ${selectClause}
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       ${where}
       ORDER BY ${sortCol} ${sortOrder} NULLS LAST
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    // Transform response with proper typing based on selected fields
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
      if (selectedFields.length === 0 || selectedFields.includes('ballast') || selectedFields.includes('y.ballast')) {
        yacht.ballast = row.ballast != null ? parseFloat(row.ballast) : undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('sailAreaMain') || selectedFields.includes('y.sail_area_main')) {
        yacht.sailAreaMain = row.sail_area_main != null ? parseFloat(row.sail_area_main) : undefined;
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
      if (selectedFields.length === 0 || selectedFields.includes('heads') || selectedFields.includes('y.heads')) {
        yacht.heads = row.heads ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('maxOccupancy') || selectedFields.includes('y.max_occupancy')) {
        yacht.maxOccupancy = row.max_occupancy ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('engineHp') || selectedFields.includes('y.engine_hp')) {
        yacht.engineHp = row.engine_hp != null ? parseFloat(row.engine_hp) : undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('engineType') || selectedFields.includes('y.engine_type')) {
        yacht.engineType = row.engine_type ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('fuelCapacity') || selectedFields.includes('y.fuel_capacity')) {
        yacht.fuelCapacity = row.fuel_capacity != null ? parseFloat(row.fuel_capacity) : undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('waterCapacity') || selectedFields.includes('y.water_capacity')) {
        yacht.waterCapacity = row.water_capacity != null ? parseFloat(row.water_capacity) : undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('designNotes') || selectedFields.includes('y.design_notes')) {
        yacht.designNotes = row.design_notes ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('description') || selectedFields.includes('y.description')) {
        yacht.description = row.description ?? undefined;
      }
      if (selectedFields.length === 0 || selectedFields.includes('manufacturerName') || selectedFields.includes('m.name')) {
        yacht.manufacturer = {
          id: row.manufacturer_id ?? undefined,
          name: row.manufacturer_name ?? '',
          country: row.manufacturer_country ?? undefined,
        };
      } else if (selectedFields.length === 0 || selectedFields.includes('manufacturerId') || selectedFields.includes('y.manufacturer_id')) {
        yacht.manufacturer = {
          id: row.manufacturer_id,
          name: row.manufacturer_name ?? '',
          country: row.manufacturer_country ?? undefined,
        };
      }

      return yacht;
    });

    // Determine cache TTL based on query complexity
    const ttl = conditions.length > 2 ? CACHE_TTL_SHORT_SECONDS : CACHE_TTL_SECONDS;
    
    // Create response with caching headers
    const response = apiSuccess(yachts, {
      meta: { 
        page, 
        limit, 
        total, 
        totalPages: Math.ceil(total / limit),
      },
      rateLimit: rl,
    });

    // Add caching headers for GET requests
    response.headers.set('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=60`);
    response.headers.set('X-Cache-TTL', `${ttl}s`);
    
    // Cache the response for future requests
    await cacheResponse(cacheKey, response, ttl);

    return response;
  } catch (error: any) {
    console.error('API v1 yachts error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch yachts', 500, { details: error.message, rateLimit: rl });
  }
}

// Simple in-memory cache for API responses
const apiCache = new Map<string, { response: Response; expires: number }>();

async function getCachedResponse(cacheKey: string): Promise<Response | null> {
  const cached = apiCache.get(cacheKey);
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

async function cacheResponse(cacheKey: string, response: Response, ttl: number): Promise<void> {
  try {
    // Clone response to avoid stream issues
    const clonedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    apiCache.set(cacheKey, {
      response: clonedResponse,
      expires: Date.now() + (ttl * 1000)
    });

    // Simple cache cleanup - remove expired entries
    if (apiCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of apiCache.entries()) {
        if (value.expires < now) {
          apiCache.delete(key);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to cache response:', error);
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}