# Sailing Yachts API Documentation

The public API provides access to sailing yacht data for external applications. All responses follow JSON API conventions with consistent envelope structure and CORS headers.

## Base URL
```
https://sailing-yachts.vercel.app/api/v1
```

## Rate Limiting
- **Free tier**: 100 requests per minute per IP address
- **Headers included**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- **Rate limit exceeded**: Returns HTTP 429 with Retry-After header
- **Reset time**: Provided in Unix timestamp

## Response Format

### Success Response
```json
{
  "data": [/* array of objects */],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 201,
    "totalPages": 11
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Yacht with slug 'test-123' not found",
    "details": "Additional error details when available"
  }
}
```

## Endpoints

### GET /yachts
List all yachts with pagination, filtering, and sorting.

**Query Parameters:**
- `page` (int, default=1) - Page number
- `limit` (int, default=20, max=100) - Items per page
- `sort` (string, default="id") - Sort field: `id`, `modelName`, `year`, `lengthOverall`, `beam`, `draft`, `displacement`, `cabins`, `berths`
- `order` (string, default="asc") - Sort order: `asc` or `desc`
- `manufacturer` (string) - Filter by manufacturer name (partial match)
- `manufacturerId` (int) - Filter by manufacturer ID (exact match)
- `rigType` (string) - Filter by rig type
- `keelType` (string) - Filter by keel type
- `hullMaterial` (string) - Filter by hull material
- `lengthMin` (number) - Minimum length overall (meters)
- `lengthMax` (number) - Maximum length overall (meters)
- `yearMin` (int) - Minimum year built
- `yearMax` (int) - Maximum year built
- `cabinsMin` (int) - Minimum number of cabins

**Example:**
```bash
curl "https://sailing-yachts.vercel.app/api/v1/yachts?sort=lengthOverall&order=desc&limit=10"
```

### GET /yachts/[slug]
Get single yacht by slug with manufacturer details, images, and reviews.

**Parameters:**
- `slug` (string) - Yacht slug (e.g., "beneteau-oceanis-30-1")

**Example:**
```bash
curl "https://sailing-yachts.vercel.app/api/v1/yachts/beneteau-oceanis-30-1"
```

### GET /manufacturers
List all manufacturers with yacht count.

**Query Parameters:**
- `country` (string) - Filter by country (exact match)
- `name` (string) - Filter by name (partial match)

**Example:**
```bash
curl "https://sailing-yachts.vercel.app/api/v1/manufacturers?country=France"
```

### GET /manufacturers/[id]
Get single manufacturer with all its yachts.

**Parameters:**
- `id` (int) - Manufacturer ID

**Example:**
```bash
curl "https://sailing-yachts.vercel.app/api/v1/manufacturers/82"
```

### GET /search
Search yachts by name, manufacturer, or other fields.

**Query Parameters:**
- `q` (string, required) - Search query (min 2 characters)
- `limit` (int, default=20, max=50) - Maximum results

**Example:**
```bash
curl "https://sailing-yachts.vercel.app/api/v1/search?q=oceanis&limit=5"
```

## Data Schema

### Yacht Object
```typescript
interface Yacht {
  id: number;
  slug: string;
  modelName: string;
  manufacturer: {
    id: number;
    name: string;
    country?: string;
  };
  year?: number;
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
  images?: Image[];
  reviews?: Review[];
}
```

### Manufacturer Object
```typescript
interface Manufacturer {
  id: number;
  name: string;
  country?: string;
  foundedYear?: number;
  website?: string;
  description?: string;
  yachtCount: number;
  yachts?: YachtBrief[];
}
```

## CORS Policy
All endpoints support cross-origin requests with appropriate headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, X-API-Key`

## Common Error Codes
- `INVALID_PARAM` - Invalid request parameter
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `INTERNAL_ERROR` - Server error

## Examples

### Find all Bavaria Yachts over 30 feet
```bash
curl "https://sailing-yachts.vercel.app/api/v1/yachts?manufacturer=bavaria&lengthMin=10"
```

### Search for catamarans
```bash
curl "https://sailing-yachts.vercel.app/api/v1/search?q=catamaran"
```

### Get manufacturer with all yachts
```bash
curl "https://sailing-yachts.vercel.app/api/v1/manufacturers/57"
```