import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Review Sources API', () => {
  test('GET /api/admin/review-sources returns sources list', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/review-sources`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('sources');
    expect(Array.isArray(data.sources)).toBeTruthy();
  });

  test('POST /api/admin/review-sources creates a source', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/review-sources`, {
      data: {
        name: `Test Source ${Date.now()}`,
        sourceType: 'magazine',
        websiteUrl: 'https://example.com',
        credibilityScore: 75,
      },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('source');
    expect(data.source).toHaveProperty('id');
    expect(data.source).toHaveProperty('name');
    expect(data.source).toHaveProperty('slug');
    expect(data.source.sourceType).toBe('magazine');
    expect(data.source.credibilityScore).toBe(75);
  });

  test('POST /api/admin/review-sources rejects missing name', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/review-sources`, {
      data: { sourceType: 'blog' },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /api/admin/review-sources/[id] returns single source', async ({ request }) => {
    // Create first
    const createRes = await request.post(`${BASE_URL}/api/admin/review-sources`, {
      data: {
        name: `Single Test Source ${Date.now()}`,
        sourceType: 'expert',
      },
    });
    expect(createRes.status()).toBe(201);
    const { source } = await createRes.json();

    // Fetch by ID
    const res = await request.get(`${BASE_URL}/api/admin/review-sources/${source.id}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.source.id).toBe(source.id);
    expect(data.source.name).toBe(source.name);
  });

  test('PATCH /api/admin/review-sources/[id] updates a source', async ({ request }) => {
    // Create first
    const createRes = await request.post(`${BASE_URL}/api/admin/review-sources`, {
      data: {
        name: `Update Test Source ${Date.now()}`,
        sourceType: 'magazine',
      },
    });
    const { source } = await createRes.json();

    // Update
    const res = await request.patch(`${BASE_URL}/api/admin/review-sources/${source.id}`, {
      data: { credibility_score: 90 },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.source.credibilityScore).toBe(90);
  });

  test('DELETE /api/admin/review-sources/[id] deletes a source', async ({ request }) => {
    // Create first
    const createRes = await request.post(`${BASE_URL}/api/admin/review-sources`, {
      data: {
        name: `Delete Test Source ${Date.now()}`,
        sourceType: 'forum',
      },
    });
    const { source } = await createRes.json();

    // Delete
    const res = await request.delete(`${BASE_URL}/api/admin/review-sources/${source.id}`);
    expect(res.ok()).toBeTruthy();

    // Verify deleted
    const getRes = await request.get(`${BASE_URL}/api/admin/review-sources/${source.id}`);
    expect(getRes.status()).toBe(404);
  });
});

test.describe('Review Aggregation API', () => {
  test('GET /api/yachts/[slug]/review-aggregation returns aggregation', async ({ request }) => {
    // This may return empty aggregation for most yachts - that's OK
    const res = await request.get(`${BASE_URL}/api/yachts/beneteau-oceanis-40-1/review-aggregation`);
    // Could be 404 if yacht doesn't exist, or 200
    if (res.ok()) {
      const data = await res.json();
      expect(data).toHaveProperty('overallAverage');
      expect(data).toHaveProperty('totalReviewCount');
      expect(data).toHaveProperty('sourceCount');
      expect(data).toHaveProperty('bySource');
      expect(data).toHaveProperty('unassignedCount');
      expect(Array.isArray(data.bySource)).toBeTruthy();
    }
  });
});

test.describe('Review Import API', () => {
  test('POST /api/admin/reviews/import with empty array returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/reviews/import`, {
      data: { reviews: [] },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/admin/reviews/import rejects invalid reviews gracefully', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/reviews/import`, {
      data: [
        { yachtModelId: 999999, rating: 5 }, // Non-existent yacht
        { rating: 'invalid' }, // Missing yachtModelId
      ],
    });
    // Should return results with errors count
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('imported');
    expect(data).toHaveProperty('errors');
    expect(data.errors).toBeGreaterThan(0);
  });
});

test.describe('Review Sources Admin Pages', () => {
  test('Admin review sources list page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/review-sources`);
    // Should show page content (may redirect to login if not authenticated)
    const content = await page.content();
    expect(content).toContain('Review Sources');
  });
});
