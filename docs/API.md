# Sailing Yachts API Documentation

**Base URL (Production):** `https://info.sailboats.fr`  
**Base URL (Development):** `http://localhost:3000`

Interactive OpenAPI docs available at [`/api/docs`](https://info.sailboats.fr/api/docs).  
Machine-readable spec at [`/api/v1/openapi`](https://info.sailboats.fr/api/v1/openapi).

---

## Public API v1

Versioned REST API under `/api/v1/`. Returns JSON with CORS headers.

### Yachts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/yachts` | List yachts with pagination, filtering, and sorting |
| `GET` | `/api/v1/yachts/{slug}` | Get yacht details by slug |

#### Query Parameters — `GET /api/v1/yachts`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (min: 1) |
| `limit` | integer | 20 | Items per page (min: 1, max: 100) |
| `sort` | string | `id` | Sort field: `id`, `modelName`, `year`, `lengthOverall`, `beam`, `draft`, `displacement`, `cabins`, `berths` |
| `order` | string | `asc` | Sort order: `asc`, `desc` |
| `manufacturer` | string | — | Manufacturer name (partial match) |
| `manufacturerId` | integer | — | Manufacturer ID (exact match) |
| `rigType` | string | — | Rig type (exact match) |
| `keelType` | string | — | Keel type (exact match) |
| `hullMaterial` | string | — | Hull material (exact match) |
| `lengthMin` | number | — | Minimum LOA in meters |
| `lengthMax` | number | — | Maximum LOA in meters |
| `yearMin` | integer | — | Minimum year |
| `yearMax` | integer | — | Maximum year |
| `cabinsMin` | integer | — | Minimum number of cabins |

#### Response Shape

```json
{
  "data": [Yacht],
  "meta": { "page": 1, "limit": 20, "total": 243, "totalPages": 13 }
}
```

### Manufacturers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/manufacturers` | List all manufacturers |
| `GET` | `/api/v1/manufacturers/{id}` | Get manufacturer details with yacht models |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/search?q={query}` | Full-text search across yachts |

---

## Internal API (unversioned)

These endpoints power the web application UI. They may change without notice.

### Yachts & Listings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/yachts` | List yachts (includes spec values) |
| `GET` | `/api/yachts/{slug}` | Yacht detail with specs, images, reviews |
| `GET` | `/api/yachts/{slug}/similar` | Similar yachts recommendations |
| `GET` | `/api/yachts/{slug}/also-viewed` | "Also viewed" recommendations |
| `GET` | `/api/yachts/{slug}/variants` | Year/model variants |
| `GET` | `/api/yachts/{slug}/media` | Yacht media gallery |
| `GET` | `/api/yachts/{slug}/rating` | Aggregate rating |
| `POST` | `/api/yachts/{slug}/rate` | Submit a rating (1-5 stars) |
| `GET` | `/api/yachts/{slug}/review-aggregation` | Aggregated external reviews |
| `GET` | `/api/yachts/manufacturer/{id}` | Yachts by manufacturer |
| `GET` | `/api/spec-categories` | All spec categories |
| `GET` | `/api/length-distribution` | Length distribution histogram data |
| `GET` | `/api/size-class-stats` | Size class statistics |

### Manufacturers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/manufacturers` | List manufacturers |
| `GET` | `/api/manufacturers/{slug}` | Manufacturer detail |
| `GET` | `/api/manufacturer-guide/{slug}` | Manufacturer editorial guide |

### Search & Compare

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search` | Search yachts |
| `GET` | `/api/compare` | Compare up to 3 yachts |
| `POST` | `/api/compare/share` | Create shareable comparison URL |
| `GET` | `/api/compare/export` | Export comparison as PDF |
| `POST` | `/api/compare/report` | Generate detailed PDF report |

### Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/articles` | List published articles/guides |
| `GET` | `/api/articles/{slug}` | Get article by slug |
| `GET` | `/api/buying-guides` | List buying guides |
| `GET` | `/api/buying-guides/{id}/yachts` | Yachts featured in a buying guide |
| `GET` | `/api/related-guides` | Related guides for a yacht |
| `GET` | `/api/sailboat-articles` | Curated sailboat articles |
| `GET` | `/api/best-value` | Best value yachts |
| `GET` | `/api/faq-proposals` | Auto-generated FAQ proposals |
| `GET` | `/api/featured` | Currently featured yacht |
| `GET` | `/api/translations` | Content translations (i18n) |

### User Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/favorites` | Get user favorites |
| `POST` | `/api/user/favorites` | Add/remove favorite |
| `GET` | `/api/user/comparisons` | Get saved comparisons |
| `GET` | `/api/user/recommendations` | Personalized recommendations |
| `GET` | `/api/user/searches` | Saved searches |
| `GET/POST` | `/api/user/push-subscriptions` | Push notification subscriptions |
| `GET` | `/api/user/account` | User account info |
| `GET` | `/api/user/export` | Export user data (GDPR) |

### Engagement

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/reviews` | Submit a yacht review |
| `GET` | `/api/reviews` | List reviews |
| `POST` | `/api/email-yacht` | Email yacht details to a friend |
| `GET/POST` | `/api/newsletter` | Newsletter subscription |
| `GET` | `/api/newsletter/track/click` | Newsletter click tracking |
| `GET` | `/api/newsletter/track/open/{campaignId}` | Newsletter open tracking |
| `GET/POST` | `/api/quiz` | Sailing quiz results |
| `POST` | `/api/leads` | Submit a lead inquiry |
| `POST` | `/api/revenue-events` | Track revenue events |
| `POST` | `/api/analytics` | Track page view / event |
| `POST` | `/api/ab/assign` | Assign A/B test variant |
| `POST` | `/api/ab/event` | Track A/B test conversion |

### Alerts & Saved Searches

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/alerts/preferences` | Alert notification preferences |
| `GET` | `/api/alerts/history` | Alert notification history |
| `GET` | `/api/alerts/unsubscribe` | Unsubscribe from alerts |

### Pricing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/prices` | Price listings |
| `GET` | `/api/prices/estimate` | AI-based price estimation |
| `GET` | `/api/prices/normalize` | Normalize price data |
| `GET` | `/api/exchange-rates` | Currency exchange rates |

### Affiliate & Monetization

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/affiliate` | Affiliate link redirect/proxy |

### System & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health/schema` | Health check with DB schema info |
| `GET` | `/api/__version` | Build version info |
| `GET` | `/api/version` | API version |
| `GET` | `/api/stats` | Site statistics |
| `GET` | `/api/content-freshness` | Content freshness signals |
| `GET` | `/api/completeness` | Data completeness report |
| `GET` | `/api/vitals` | Core Web Vitals report |
| `GET/POST` | `/api/search-intents` | Search intent analytics |
| `GET/POST` | `/api/search-intents/record` | Record a search intent |
| `GET/POST` | `/api/corrections` | User-submitted data corrections |
| `GET` | `/api/deploy-check` | Deploy verification |
| `GET/POST` | `/api/commit` | Deploy commit info |

### Cron (Vercel Cron, not publicly accessible)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cron/alerts` | Process saved search alerts |

---

## Admin API

All admin endpoints require `Authorization: Bearer <ADMIN_API_KEY>` header.

### Core Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Admin authentication |
| `POST` | `/api/admin/logout` | Admin logout |
| `GET/POST` | `/api/admin/yachts` | List/create yachts |
| `GET/PUT/DELETE` | `/api/admin/yachts/{id}` | Read/update/delete yacht |
| `POST` | `/api/admin/yachts/{id}/delete` | Soft-delete yacht |
| `GET/POST` | `/api/admin/yachts/{id}/images` | Manage yacht images |
| `GET/POST` | `/api/admin/manufacturers` | List/create manufacturers |
| `GET/PUT` | `/api/admin/manufacturers/{id}` | Read/update manufacturer |
| `POST` | `/api/admin/manufacturers/{id}/delete` | Delete manufacturer |
| `GET/PUT` | `/api/admin/manufacturers/premium` | Premium tier management |
| `GET/POST/PUT/DELETE` | `/api/admin/spec-categories` | Manage spec categories |
| `GET/POST` | `/api/admin/spec-categories/{id}` | Update/delete spec category |
| `GET/POST` | `/api/admin/media` | Media library |
| `GET/DELETE` | `/api/admin/media/{id}` | Delete media item |

### Admin — Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/admin/guides` | List/create sailing guides |
| `GET/PUT/DELETE` | `/api/admin/guides/{id}` | Manage guide |
| `POST` | `/api/admin/guides/upload-image` | Upload guide image |
| `GET` | `/api/admin/guides/yacht-search` | Search yachts for guide linking |
| `GET/POST` | `/api/admin/descriptions` | Review auto-generated descriptions |
| `POST` | `/api/admin/generate-description` | Generate yacht description |
| `GET/POST` | `/api/admin/translations` | Translation queue management |

### Admin — Data Quality

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/completeness` | Data completeness scoring |
| `GET` | `/api/admin/image-coverage` | Image coverage report |
| `GET/POST` | `/api/admin/enrichment` | Data enrichment pipeline |
| `POST` | `/api/admin/enrichment/run` | Run enrichment job |
| `GET/POST` | `/api/admin/imports` | Bulk data imports |
| `GET/POST` | `/api/admin/corrections` | Review user corrections |
| `GET/PUT/DELETE` | `/api/admin/corrections/{id}` | Manage correction |
| `GET/POST` | `/api/admin/reviews` | Moderate reviews |
| `GET/PUT/DELETE` | `/api/admin/reviews/{id}` | Manage review |
| `POST` | `/api/admin/reviews/import` | Bulk import reviews |
| `GET/POST` | `/api/admin/review-sources` | Review source management |
| `GET/PUT/DELETE` | `/api/admin/review-sources/{id}` | Manage review source |

### Admin — Analytics & Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/analytics` | Aggregate analytics |
| `GET` | `/api/admin/ab-testing` | A/B test experiments |
| `GET` | `/api/admin/funnel` | Conversion funnel data |
| `GET` | `/api/admin/search-analytics` | Search analytics |
| `GET` | `/api/admin/competitive-positioning` | Competitive positioning matrix |
| `GET` | `/api/admin/security` | Security audit / validation coverage |
| `GET` | `/api/admin/validation` | API validation coverage scan |
| `GET` | `/api/admin/query-benchmark` | Database query benchmarks |

### Admin — Marketing & Revenue

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/admin/leads` | Lead management |
| `GET/POST` | `/api/admin/affiliate-tracking` | Affiliate tracking |
| `GET/POST` | `/api/admin/newsletter` | Newsletter subscribers |
| `GET/POST` | `/api/admin/newsletter/campaigns` | Email campaigns |
| `GET/PUT` | `/api/admin/newsletter/campaigns/{id}` | Manage campaign |
| `POST` | `/api/admin/newsletter/campaigns/{id}/send` | Send campaign |
| `GET/PUT/DELETE` | `/api/admin/newsletter/subscribers/{id}` | Manage subscriber |
| `GET` | `/api/admin/newsletter/analytics` | Campaign analytics |
| `GET/POST` | `/api/admin/featured` | Featured yacht management |
| `GET/POST/PUT/DELETE` | `/api/admin/manufacturer-spotlights` | Manufacturer spotlights |
| `GET/PUT/DELETE` | `/api/admin/manufacturer-spotlights/{id}` | Manage spotlight |

### Admin — System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/admin/audit-logs` | Audit log entries |
| `GET` | `/api/admin/flags` | Feature flags |
| `GET/POST` | `/api/admin/prices/aggregate` | Aggregate price data |

---

## Rate Limiting

Public API endpoints enforce rate limiting. Responses include headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Remaining requests in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |

When rate limited (HTTP 429), the response includes a `Retry-After` header.

---

## Error Format

All errors return a consistent JSON shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Yacht not found",
    "details": {}
  }
}
```

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `BAD_REQUEST` | Invalid query parameters or body |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate resource |
| 422 | `VALIDATION_ERROR` | Input validation failed |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Server error |

---

## Authentication

- **Public API**: No authentication required. CORS enabled.
- **User API**: Session-based via NextAuth.js (cookie).
- **Admin API**: Bearer token (`ADMIN_API_KEY` env variable).
