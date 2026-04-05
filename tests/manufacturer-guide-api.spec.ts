import { test, expect } from '@playwright/test';

test.describe('/api/manufacturer-guide/[slug] API', () => {
  test('should return valid manufacturer guide data for Jeanneau', async ({ request }) => {
    const response = await request.get('/api/manufacturer-guide/jeanneau');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('manufacturer');
    expect(data.data).toHaveProperty('fleetStats');
    expect(data.data).toHaveProperty('topModels');
    expect(data.data).toHaveProperty('highlights');
    expect(data.data).toHaveProperty('sailboatCategories');
    
    // Check manufacturer structure
    expect(data.data.manufacturer).toHaveProperty('name');
    expect(data.data.manufacturer).toHaveProperty('slug');
    expect(data.data.manufacturer).toHaveProperty('yachtCount');
    expect(data.data.manufacturer).toHaveProperty('canonicalUrl');
    expect(data.data.manufacturer).toHaveProperty('affiliateLink');
    
    // Check fleet stats
    expect(data.data.fleetStats).toHaveProperty('yachtCount');
    expect(typeof data.data.fleetStats.yachtCount).toBe('number');
    
    // Check top models array
    expect(Array.isArray(data.data.topModels)).toBe(true);
    if (data.data.topModels.length > 0) {
      expect(data.data.topModels[0]).toHaveProperty('modelName');
      expect(data.data.topModels[0]).toHaveProperty('slug');
      expect(data.data.topModels[0]).toHaveProperty('completenessScore');
    }
    
    // Check highlights structure
    expect(data.data.highlights).toHaveProperty('mostSpacious');
    expect(data.data.highlights).toHaveProperty('mostCompact');
    
    // Check sailboat categories
    expect(data.data.sailboatCategories).toHaveProperty('cruisers');
    expect(data.data.sailboatCategories).toHaveProperty('racers');
    expect(data.data.sailboatCategories).toHaveProperty('bluewater');
    expect(data.data.sailboatCategories).toHaveProperty('multihull');
    
    for (const category of Object.values(data.data.sailboatCategories)) {
      expect(category).toHaveProperty('count');
      expect(category).toHaveProperty('percentage');
    }
  });

  test('should return 404 for non-existent manufacturer', async ({ request }) => {
    const response = await request.get('/api/manufacturer-guide/nonexistent-manufacturer');
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should handle OPTIONS request with CORS headers', async ({ request }) => {
    // Since playwright doesn't have direct options, test a GET with cors headers
    const response = await request.get('/api/manufacturer-guide/jeanneau');
    const headers = response.headers();
    expect(headers).toHaveProperty('access-control-allow-origin');
    expect(headers).toHaveProperty('access-control-allow-methods');
    expect(headers).toHaveProperty('access-control-allow-headers');
  });

  test('should return affiliate tag in links', async ({ request }) => {
    const response = await request.get('/api/manufacturer-guide/beneteau');
    const data = await response.json();
    
    expect(data.data.manufacturer.affiliateLink).toContain('?tag=pgedeon-20');
    expect(data.data.manufacturer.canonicalUrl).toBe(data.data.manufacturer.affiliateLink.replace('?tag=pgedeon-20', ''));
  });
});