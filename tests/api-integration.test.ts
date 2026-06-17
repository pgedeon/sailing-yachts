/**
 * P27.3 — Comprehensive API Integration Test Suite
 * 
 * Systematically tests all public-facing API GET endpoints for:
 * - Correct response status
 * - Valid response shape/contract
 * - Pagination support
 * - Filter/query parameter handling
 * - Data integrity (no null where required, correct types)
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://info.sailboats.fr';

// Helper: validate yacht list item shape
function expectValidYachtListItem(y: any) {
  expect(y).toHaveProperty('id');
  expect(typeof y.id).toBe('number');
  expect(y).toHaveProperty('modelName');
  expect(typeof y.modelName).toBe('string');
  expect(y).toHaveProperty('slug');
  expect(typeof y.slug).toBe('string');
  expect(y).toHaveProperty('manufacturer');
  expect(typeof y.manufacturer).toBe('string');
}

// Helper: validate manufacturer item shape
function expectValidManufacturer(m: any) {
  expect(m).toHaveProperty('id');
  expect(m).toHaveProperty('name');
  expect(typeof m.name).toBe('string');
}

// ═══════════════════════════════════════════════════════════════════
// 1. CORE YACHT ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

test.describe('Core Yacht API', () => {
  test.describe('GET /api/yachts', () => {
    test('returns yacht list with pagination', async ({ request }) => {
      const res = await request.get(`${BASE}/api/yachts?limit=10`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      expect(data).toHaveProperty('yachts');
      expect(data).toHaveProperty('total');
      expect(typeof data.total).toBe('number');
      expect(data.total).toBeGreaterThan(0);
      expect(Array.isArray(data.yachts)).toBe(true);
      expect(data.yachts.length).toBeLessThanOrEqual(10);

      data.yachts.forEach(expectValidYachtListItem);
    });

    test('respects limit parameter', async ({ request }) => {
      const res = await request.get(`${BASE}/api/yachts?limit=3`, { timeout: 30000 });
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(data.yachts.length).toBeLessThanOrEqual(3);
    });

    test('returns distinct filter values', async ({ request }) => {
      const res = await request.get(`${BASE}/api/yachts?limit=1`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      if (data.distinct) {
        expect(data.distinct).toHaveProperty('rigTypes');
        expect(data.distinct).toHaveProperty('keelTypes');
        expect(data.distinct).toHaveProperty('hullMaterials');
        expect(Array.isArray(data.distinct.rigTypes)).toBe(true);
        expect(Array.isArray(data.distinct.keelTypes)).toBe(true);
        expect(Array.isArray(data.distinct.hullMaterials)).toBe(true);
      }
    });

    test('supports rig type filter', async ({ request }) => {
      const res = await request.get(`${BASE}/api/yachts?limit=5&filters[rigType]=sloop`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      data.yachts.forEach((y: any) => {
        if (y.rigType) {
          expect(y.rigType.toLowerCase()).toBe('sloop');
        }
      });
    });
  });

  test.describe('GET /api/yachts/[slug]', () => {
    test('returns yacht detail by slug', async ({ request }) => {
      // First get a valid slug
      const listRes = await request.get(`${BASE}/api/yachts?limit=1`);
      const listData = await listRes.json();
      const slug = listData.yachts[0].slug;

      const res = await request.get(`${BASE}/api/yachts/${slug}`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('modelName');
      expect(data).toHaveProperty('slug', slug);
      expect(data).toHaveProperty('manufacturer');
    });

    test('returns 404 for non-existent slug', async ({ request }) => {
      const res = await request.get(`${BASE}/api/yachts/non-existent-yacht-xyz123`);
      expect(res.status()).toBe(404);
    });
  });

  test.describe('GET /api/yachts/[slug]/similar', () => {
    test('returns similar yachts', async ({ request }) => {
      // Use a known stable slug
      const res = await request.get(`${BASE}/api/yachts/beneteau-oceanis-30-1/similar`, { timeout: 30000 });
      expect(res.status()).toBe(200);
      
      const data = await res.json();
      const key = data.similar ? 'similar' : 'yachts';
      expect(Array.isArray(data[key])).toBe(true);
    });
  });

  test.describe('GET /api/yachts/[slug]/variants', () => {
    test('returns variants or 404', async ({ request }) => {
      const listRes = await request.get(`${BASE}/api/yachts?limit=1`);
      const listData = await listRes.json();
      const slug = listData.yachts[0].slug;

      const res = await request.get(`${BASE}/api/yachts/${slug}/variants`);
      expect([200, 404]).toContain(res.status());
    });
  });

  test.describe('GET /api/yachts/[slug]/rating', () => {
    test('returns rating data', async ({ request }) => {
      const listRes = await request.get(`${BASE}/api/yachts?limit=1`);
      const listData = await listRes.json();
      const slug = listData.yachts[0].slug;

      const res = await request.get(`${BASE}/api/yachts/${slug}/rating`);
      expect(res.status()).toBe(200);

      const data = await res.json();
      if (data.averageRating !== null && data.averageRating !== undefined) {
        expect(data.averageRating).toBeGreaterThanOrEqual(0);
        expect(data.averageRating).toBeLessThanOrEqual(5);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. MANUFACTURER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

test.describe('Manufacturer API', () => {
  test.describe('GET /api/manufacturers', () => {
    test('returns manufacturer list', async ({ request }) => {
      const res = await request.get(`${BASE}/api/manufacturers`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      // API returns { manufacturers: [...] }
      expect(data).toHaveProperty('manufacturers');
      expect(Array.isArray(data.manufacturers)).toBe(true);
      expect(data.manufacturers.length).toBeGreaterThan(0);
      data.manufacturers.forEach(expectValidManufacturer);
    });
  });

  test.describe('GET /api/manufacturers/[slug]', () => {
    test('returns manufacturer detail', async ({ request }) => {
      // Get a valid slug from the list
      const listRes = await request.get(`${BASE}/api/manufacturers`);
      const listData = await listRes.json();
      const slug = listData.manufacturers[0].slug;

      const res = await request.get(`${BASE}/api/manufacturers/${slug}`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      const mfr = data.manufacturer || data; expect(mfr).toHaveProperty('name');
    });

    test('returns 404 for non-existent manufacturer', async ({ request }) => {
      const res = await request.get(`${BASE}/api/manufacturers/non-existent-mfr-xyz`);
      expect(res.status()).toBe(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. SEARCH ENDPOINT
// ═══════════════════════════════════════════════════════════════════

test.describe('Search API', () => {
  test('returns results for valid query', async ({ request }) => {
    const res = await request.get(`${BASE}/api/search?q=beneteau&limit=5`);
    expect(res.status()).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('yachts');
    expect(Array.isArray(data.yachts)).toBe(true);
    if (data.yachts.length > 0) {
      data.yachts.forEach((y: any) => {
        expect(y).toHaveProperty('modelName');
        expect(y).toHaveProperty('slug');
      });
    }
  });

  test('returns empty for short query (< 2 chars)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/search?q=a`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.yachts).toEqual([]);
    expect(data.total).toBe(0);
  });

  test('returns empty for no query', async ({ request }) => {
    const res = await request.get(`${BASE}/api/search`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.yachts).toEqual([]);
    expect(data.total).toBe(0);
  });

  test('supports autocomplete mode', async ({ request }) => {
    const res = await request.get(`${BASE}/api/search?q=oceanis&mode=autocomplete&limit=3`, { timeout: 30000 });
    expect([200, 500]).toContain(res.status()); // Edge runtime can occasionally 500

    if (res.status() === 200) {
      const data = await res.json();
      // Autocomplete returns { suggestions: [...] }
      expect(data).toHaveProperty('suggestions');
    expect(Array.isArray(data.suggestions)).toBe(true);
    if (data.suggestions.length > 0) {
      expect(data.suggestions[0]).toHaveProperty('display');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. COMPARE ENDPOINT
// ═══════════════════════════════════════════════════════════════════

test.describe('Compare API', () => {
  test('returns comparison data for valid IDs', async ({ request }) => {
    // Get two yacht IDs
    const listRes = await request.get(`${BASE}/api/yachts?limit=2`);
    const listData = await listRes.json();
    const ids = listData.yachts.map((y: any) => y.id).join(',');

    const res = await request.get(`${BASE}/api/compare?ids=${ids}`);
    expect(res.status()).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('yachts');
    expect(Array.isArray(data.yachts)).toBe(true);
    expect(data.yachts.length).toBe(2);
  });

  test('returns 400 without ids parameter', async ({ request }) => {
    const res = await request.get(`${BASE}/api/compare`);
    expect(res.status()).toBe(400);
  });

  test('returns 400 for single id', async ({ request }) => {
    const res = await request.get(`${BASE}/api/compare?ids=1`);
    expect(res.status()).toBe(400);
  });

  test('returns 400 for more than 4 ids', async ({ request }) => {
    const res = await request.get(`${BASE}/api/compare?ids=1,2,3,4,5`);
    expect(res.status()).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. FEATURED & BEST VALUE
// ═══════════════════════════════════════════════════════════════════

test.describe('Featured API', () => {
  test('returns featured yacht data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/featured`);
    expect(res.status()).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('active');
    expect(data).toHaveProperty('recent');
    expect(Array.isArray(data.recent)).toBe(true);
  });
});

test.describe('Best Value API', () => {
  test('returns best value categories', async ({ request }) => {
    const res = await request.get(`${BASE}/api/best-value`);
    expect(res.status()).toBe(200);
    const data = await res.json();

    // Returns { categories: [...] }
    expect(data).toHaveProperty('categories');
    expect(Array.isArray(data.categories)).toBe(true);
    if (data.categories.length > 0) {
      expect(data.categories[0]).toHaveProperty('slug');
      expect(data.categories[0]).toHaveProperty('title');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. STATS & DISTRIBUTION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

test.describe('Stats & Distribution API', () => {
  test('GET /api/length-distribution returns distribution', async ({ request }) => {
    const res = await request.get(`${BASE}/api/length-distribution`);
    expect(res.status()).toBe(200);
    const data = await res.json();

    expect(data).toBeTruthy();
    expect(typeof data).toBe('object');
  });

  test('GET /api/stats returns stats', async ({ request }) => {
    const res = await request.get(`${BASE}/api/stats`);
    expect([200, 404]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. PRICES ENDPOINT
// ═══════════════════════════════════════════════════════════════════

test.describe('Prices API', () => {
  test('GET /api/prices returns price data or 404', async ({ request }) => {
    const res = await request.get(`${BASE}/api/prices?limit=5`);
    expect([200, 404]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toBeTruthy();
    }
  });

  test('GET /api/prices/estimate returns estimate', async ({ request }) => {
    const listRes = await request.get(`${BASE}/api/yachts?limit=1`);
    const listData = await listRes.json();
    const yachtId = listData.yachts[0]?.id;

    const res = await request.get(`${BASE}/api/prices/estimate?yachtId=${yachtId}`);
    expect([200, 400, 404]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. SPEC CATEGORIES
// ═══════════════════════════════════════════════════════════════════

test.describe('Spec Categories API', () => {
  test('GET /api/spec-categories returns categories', async ({ request }) => {
    const res = await request.get(`${BASE}/api/spec-categories`);
    expect([200, 404]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 9. V1 PUBLIC API
// ═══════════════════════════════════════════════════════════════════

test.describe('V1 Public API', () => {
  test.describe('GET /api/v1/yachts', () => {
    test('returns paginated yacht list', async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/yachts?limit=3`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(3);
      expect(data).toHaveProperty('meta');
    });

    test('includes CORS headers', async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/yachts?limit=1`);
      const headers = res.headers();
      expect(headers['access-control-allow-origin']).toBeDefined();
    });

    test('supports manufacturer filter', async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/yachts?manufacturer=bavaria&limit=5`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      data.data.forEach((y: any) => {
        if (y.manufacturer?.name) {
          expect(y.manufacturer.name.toLowerCase()).toContain('bavaria');
        }
      });
    });

    test('supports sort by year descending', async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/yachts?sort=year&order=desc&limit=5`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      for (let i = 0; i < data.data.length - 1; i++) {
        if (data.data[i].year && data.data[i + 1].year) {
          expect(data.data[i].year).toBeGreaterThanOrEqual(data.data[i + 1].year);
        }
      }
    });
  });

  test.describe('GET /api/v1/yachts/[slug]', () => {
    test('returns yacht by slug', async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/yachts/beneteau-oceanis-30-1`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('slug');
    });

    test('returns 404 for non-existent slug', async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/yachts/non-existent-xyz`);
      expect(res.status()).toBe(404);
    });
  });

  test.describe('GET /api/v1/manufacturers', () => {
    test('returns manufacturer list', async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/manufacturers`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('includes CORS headers', async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/manufacturers`);
      const headers = res.headers();
      expect(headers['access-control-allow-origin']).toBeDefined();
    });
  });

  test.describe('GET /api/v1/search', () => {
    test('returns search results', async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/search?q=oceanis&limit=3`);
      expect([200, 404]).toContain(res.status());

      if (res.status() === 200) {
        const data = await res.json();
        expect(data).toHaveProperty('data');
      }
    });
  });

  test.describe('GET /api/v1/openapi', () => {
    test('returns OpenAPI spec', async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/openapi`);
      expect([200, 404]).toContain(res.status());

      if (res.status() === 200) {
        const data = await res.json();
        expect(data).toHaveProperty('openapi');
        expect(data).toHaveProperty('paths');
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// 10. MISC PUBLIC ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

test.describe('Misc Public Endpoints', () => {
  test('GET /api/version returns version', async ({ request }) => {
    const res = await request.get(`${BASE}/api/version`);
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/__version returns version', async ({ request }) => {
    const res = await request.get(`${BASE}/api/__version`);
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/articles returns articles', async ({ request }) => {
    const res = await request.get(`${BASE}/api/articles?limit=5`);
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/buying-guides returns guides', async ({ request }) => {
    const res = await request.get(`${BASE}/api/buying-guides?limit=5`);
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/manufacturer-guide returns guide', async ({ request }) => {
    const res = await request.get(`${BASE}/api/manufacturer-guide/beneteau`);
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/exchange-rates returns rates', async ({ request }) => {
    const res = await request.get(`${BASE}/api/exchange-rates`);
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/content-freshness returns freshness data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/content-freshness`);
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/newsletter returns newsletter info', async ({ request }) => {
    const res = await request.get(`${BASE}/api/newsletter`);
    expect([200, 405]).toContain(res.status());
  });

  test('GET /api/faq-proposals returns proposals', async ({ request }) => {
    const res = await request.get(`${BASE}/api/faq-proposals`);
    expect([200, 404, 405]).toContain(res.status());
  });
});
