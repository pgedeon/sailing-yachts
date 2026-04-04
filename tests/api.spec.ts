import { test, expect } from '@playwright/test';

test.describe('Public API v1 Endpoints', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://sailing-yachts.vercel.app';

  test.describe('/api/v1/yachts', () => {
    test('should return valid yacht list with pagination', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/yachts?limit=3`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(3);
      expect(data).toHaveProperty('meta');
    });

    test('should support sorting and filtering', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/yachts?sort=year&order=desc&limit=5`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
      const yachts = data.data;
      
      // Check that yachts are sorted by year descending
      for (let i = 0; i < yachts.length - 1; i++) {
        if (yachts[i].year && yachts[i + 1].year) {
          expect(yachts[i].year).toBeGreaterThanOrEqual(yachts[i + 1].year);
        }
      }
    });

    test('should support manufacturer filtering', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/yachts?manufacturer=bavaria&limit=5`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      const yachts = data.data;
      
      // All yachts should match "bavaria" in manufacturer name
      yachts.forEach((yacht: any) => {
        if (yacht.manufacturer.name) {
          expect(yacht.manufacturer.name.toLowerCase()).toContain('bavaria');
        }
      });
    });

    test('should include CORS headers', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/yachts?limit=1`);
      expect(response.headers()).toMatchObject({
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, OPTIONS',
      });
    });
  });

  test.describe('/api/v1/yachts/[slug]', () => {
    test('should return single yacht by slug', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/yachts/beneteau-oceanis-30-1`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('slug', 'beneteau-oceanis-30-1');
      expect(data.data).toHaveProperty('manufacturer');
    });

    test('should return 404 for non-existent slug', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/yachts/non-existent-slug`);
      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  test.describe('/api/v1/manufacturers', () => {
    test('should return valid manufacturer list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/manufacturers?limit=5`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(5);
      expect(data.data[0]).toHaveProperty('id');
      expect(data.data[0]).toHaveProperty('name');
      expect(data.data[0]).toHaveProperty('yachtCount');
    });

    test('should support country filtering', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/manufacturers?country=France`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      data.data.forEach((mfr: any) => {
        if (mfr.country) {
          expect(mfr.country).toBe('France');
        }
      });
    });
  });

  test.describe('/api/v1/manufacturers/[id]', () => {
    test('should return single manufacturer with yachts', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/manufacturers/82`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('yachts');
      expect(Array.isArray(data.data.yachts)).toBe(true);
    });

    test('should return 404 for non-existent ID', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/manufacturers/999999`);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('/api/v1/search', () => {
    test('should return search results', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/search?q=oceanis&limit=5`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.meta).toHaveProperty('total');
    });

    test('should require valid query parameter', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/search?q=a`);
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('INVALID_PARAM');
    });
  });

  test.describe('Rate Limiting', () => {
    test('should include rate limit headers in responses', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/yachts?limit=1`);
      expect(response.headers()).toHaveProperty('x-ratelimit-limit');
      expect(response.headers()).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers()).toHaveProperty('x-ratelimit-reset');
    });
  });
});