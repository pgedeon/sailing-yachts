/**
 * OpenAPI 3.0.3 specification for the Sailing Yachts public API v1.
 *
 * This is the single source of truth for the API docs page (/api/docs)
 * and the /api/v1/openapi.json endpoint.
 */

export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: { name: string; url: string };
    license?: { name: string; url: string };
  };
  servers: { url: string; description: string }[];
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

const YachtSchema = {
  type: 'object',
  required: ['id', 'modelName', 'manufacturer'],
  properties: {
    id: { type: 'integer', description: 'Unique identifier' },
    slug: { type: 'string', description: 'URL-friendly identifier', example: 'beneteau-oceanis-30-1' },
    modelName: { type: 'string', description: 'Yacht model name', example: 'Oceanis 30.1' },
    manufacturer: {
      type: 'object',
      required: ['id', 'name'],
      properties: {
        id: { type: 'integer', description: 'Manufacturer ID' },
        name: { type: 'string', description: 'Manufacturer name', example: 'Bénéteau' },
        country: { type: 'string', description: 'Country of origin', example: 'France' },
        website: { type: 'string', format: 'uri', description: 'Manufacturer website' },
        description: { type: 'string', description: 'Manufacturer description' },
      },
    },
    year: { type: 'integer', description: 'Year of production', example: 2020 },
    lengthOverall: { type: 'number', description: 'Length overall in meters', example: 9.32 },
    beam: { type: 'number', description: 'Beam width in meters', example: 3.29 },
    draft: { type: 'number', description: 'Draft depth in meters', example: 1.85 },
    displacement: { type: 'number', description: 'Displacement in kg', example: 3800 },
    ballast: { type: 'number', description: 'Ballast weight in kg' },
    sailAreaMain: { type: 'number', description: 'Main sail area in m²' },
    rigType: { type: 'string', description: 'Rig type', example: 'Fractional Sloop' },
    keelType: { type: 'string', description: 'Keel type', example: 'Fin keel' },
    hullMaterial: { type: 'string', description: 'Hull material', example: 'GRP' },
    cabins: { type: 'integer', description: 'Number of cabins', example: 2 },
    berths: { type: 'integer', description: 'Number of berths', example: 4 },
    heads: { type: 'integer', description: 'Number of heads (toilets)' },
    maxOccupancy: { type: 'integer', description: 'Maximum occupancy' },
    engineHp: { type: 'number', description: 'Engine horsepower' },
    engineType: { type: 'string', description: 'Engine type' },
    fuelCapacity: { type: 'number', description: 'Fuel capacity in liters' },
    waterCapacity: { type: 'number', description: 'Water capacity in liters' },
    designNotes: { type: 'string', description: 'Design notes from the manufacturer' },
    description: { type: 'string', description: 'Detailed description of the yacht' },
    images: {
      type: 'array',
      description: 'Yacht images (detail endpoint only)',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          caption: { type: 'string' },
          alt: { type: 'string' },
          isPrimary: { type: 'boolean' },
        },
      },
    },
    reviews: {
      type: 'array',
      description: 'Yacht reviews (detail endpoint only)',
      items: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          rating: { type: 'number', minimum: 0, maximum: 5 },
          summary: { type: 'string' },
          author: { type: 'string' },
          date: { type: 'string', format: 'date' },
        },
      },
    },
  },
};

const ManufacturerSchema = {
  type: 'object',
  required: ['id', 'name', 'yachtCount'],
  properties: {
    id: { type: 'integer', description: 'Unique identifier' },
    name: { type: 'string', description: 'Manufacturer name', example: 'Bénéteau' },
    country: { type: 'string', description: 'Country of origin', example: 'France' },
    foundedYear: { type: 'integer', description: 'Year founded', example: 1884 },
    website: { type: 'string', format: 'uri', description: 'Manufacturer website' },
    description: { type: 'string', description: 'About the manufacturer' },
    logoUrl: { type: 'string', format: 'uri', description: 'Logo URL (detail endpoint only)' },
    yachtCount: { type: 'integer', description: 'Total number of yacht models', example: 15 },
    yachts: {
      type: 'array',
      description: 'Yachts by this manufacturer (detail endpoint only)',
      items: { $ref: '#/components/schemas/Yacht' },
    },
  },
};

const ErrorSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: { type: 'string', description: 'Machine-readable error code', enum: ['INVALID_PARAM', 'NOT_FOUND', 'RATE_LIMIT_EXCEEDED', 'INTERNAL_ERROR'] },
        message: { type: 'string', description: 'Human-readable error message' },
        details: { type: 'string', description: 'Additional context' },
      },
    },
  },
};

const RateLimitHeaders = {
  'X-RateLimit-Limit': { schema: { type: 'integer' }, description: 'Maximum requests per window' },
  'X-RateLimit-Remaining': { schema: { type: 'integer' }, description: 'Remaining requests in current window' },
  'X-RateLimit-Reset': { schema: { type: 'integer' }, description: 'Unix timestamp when the window resets' },
};

const CorsHeaders = {
  'Access-Control-Allow-Origin': { schema: { type: 'string' }, description: 'Allowed origin(s)' },
  'Access-Control-Allow-Methods': { schema: { type: 'string' }, description: 'Allowed HTTP methods' },
};

const CommonHeaders = { ...CorsHeaders, ...RateLimitHeaders };

export const openApiSpec: OpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Sailing Yacht Info API',
    version: '1.0.0',
    description:
      'Public REST API for accessing sailing yacht data including models, manufacturers, specs, images, and reviews. All endpoints return JSON with CORS headers.',
    contact: { name: 'Sailing Yacht Info', url: 'https://info.sailboats.fr' },
    license: { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  },
  servers: [
    { url: 'https://info.sailboats.fr/api/v1', description: 'Production' },
    { url: 'http://localhost:3000/api/v1', description: 'Development' },
  ],
  paths: {
    '/yachts': {
      get: {
        summary: 'List yachts',
        description: 'Retrieve a paginated, filterable, sortable list of sailing yachts.',
        operationId: 'listYachts',
        tags: ['Yachts'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }, description: 'Items per page' },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['id', 'modelName', 'year', 'lengthOverall', 'beam', 'draft', 'displacement', 'cabins', 'berths'], default: 'id' }, description: 'Sort field' },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }, description: 'Sort order' },
          { name: 'manufacturer', in: 'query', schema: { type: 'string' }, description: 'Manufacturer name (partial match)' },
          { name: 'manufacturerId', in: 'query', schema: { type: 'integer' }, description: 'Manufacturer ID (exact match)' },
          { name: 'rigType', in: 'query', schema: { type: 'string' }, description: 'Rig type (exact match)' },
          { name: 'keelType', in: 'query', schema: { type: 'string' }, description: 'Keel type (exact match)' },
          { name: 'hullMaterial', in: 'query', schema: { type: 'string' }, description: 'Hull material (exact match)' },
          { name: 'lengthMin', in: 'query', schema: { type: 'number' }, description: 'Minimum LOA in meters' },
          { name: 'lengthMax', in: 'query', schema: { type: 'number' }, description: 'Maximum LOA in meters' },
          { name: 'yearMin', in: 'query', schema: { type: 'integer' }, description: 'Minimum year' },
          { name: 'yearMax', in: 'query', schema: { type: 'integer' }, description: 'Maximum year' },
          { name: 'cabinsMin', in: 'query', schema: { type: 'integer' }, description: 'Minimum number of cabins' },
        ],
        responses: {
          '200': {
            description: 'Paginated list of yachts',
            headers: CommonHeaders,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data', 'meta'],
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Yacht' } },
                    meta: {
                      type: 'object',
                      required: ['page', 'limit', 'total', 'totalPages'],
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            headers: { ...CommonHeaders, 'Retry-After': { schema: { type: 'integer' }, description: 'Seconds until reset' } },
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '500': { description: 'Internal error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/yachts/{slug}': {
      get: {
        summary: 'Get yacht details',
        description: 'Retrieve a single yacht by its slug, including manufacturer info, images, and reviews.',
        operationId: 'getYacht',
        tags: ['Yachts'],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, description: 'Yacht slug', example: 'beneteau-oceanis-30-1' },
        ],
        responses: {
          '200': {
            description: 'Yacht details with images and reviews',
            headers: CommonHeaders,
            content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { $ref: '#/components/schemas/Yacht' } } } } },
          },
          '404': { description: 'Yacht not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/manufacturers': {
      get: {
        summary: 'List manufacturers',
        description: 'Retrieve a list of all yacht manufacturers with yacht counts.',
        operationId: 'listManufacturers',
        tags: ['Manufacturers'],
        parameters: [
          { name: 'country', in: 'query', schema: { type: 'string' }, description: 'Filter by country (exact match)' },
          { name: 'name', in: 'query', schema: { type: 'string' }, description: 'Filter by name (partial match)' },
        ],
        responses: {
          '200': {
            description: 'List of manufacturers',
            headers: CommonHeaders,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data'],
                  properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Manufacturer' } } },
                },
              },
            },
          },
          '429': { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/manufacturers/{id}': {
      get: {
        summary: 'Get manufacturer details',
        description: 'Retrieve a single manufacturer with all its yacht models.',
        operationId: 'getManufacturer',
        tags: ['Manufacturers'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Manufacturer ID', example: 82 },
        ],
        responses: {
          '200': {
            description: 'Manufacturer with yachts',
            headers: CommonHeaders,
            content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { $ref: '#/components/schemas/Manufacturer' } } } } },
          },
          '400': { description: 'Invalid manufacturer ID', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Manufacturer not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/search': {
      get: {
        summary: 'Search yachts',
        description: 'Full-text search across yacht model names, manufacturers, rig types, keel types, hull materials, and descriptions.',
        operationId: 'searchYachts',
        tags: ['Search'],
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 }, description: 'Search query', example: 'oceanis' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, minimum: 1, maximum: 50 }, description: 'Maximum results' },
        ],
        responses: {
          '200': {
            description: 'Search results',
            headers: CommonHeaders,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data', 'meta'],
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Yacht' } },
                    meta: {
                      type: 'object',
                      required: ['total', 'limit'],
                      properties: { total: { type: 'integer' }, limit: { type: 'integer' } },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid query parameter', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
  components: {
    schemas: {
      Yacht: YachtSchema,
      Manufacturer: ManufacturerSchema,
      Error: ErrorSchema,
    },
  },
};
