import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://info.sailboats.fr';

test.describe('API Documentation', () => {
  test.describe('Docs Page', () => {
    test('should load the API docs page', async ({ page }) => {
      await page.goto(`${BASE_URL}/api/docs`);
      await page.waitForLoadState('networkidle');

      // Check key content is present
      await expect(page.locator('h1')).toContainText('Sailing Yacht Info API');
      await expect(page.locator('text=Rate Limiting')).toBeVisible();
      await expect(page.locator('text=100 requests/min')).toBeVisible();
      await expect(page.locator('text=Response Format')).toBeVisible();
      await expect(page.locator('text=Authentication')).toBeVisible();
    });

    test('should display all endpoint sections', async ({ page }) => {
      await page.goto(`${BASE_URL}/api/docs`);

      // Should have tag groups for Yachts, Manufacturers, Search
      await expect(page.locator('text=Endpoints (5)')).toBeVisible();

      // Should list all endpoints
      await expect(page.locator('code:text("/yachts")')).toBeVisible();
      await expect(page.locator('code:text("/yachts/{slug}")')).toBeVisible();
      await expect(page.locator('code:text("/manufacturers")')).toBeVisible();
      await expect(page.locator('code:text("/manufacturers/{id}")')).toBeVisible();
      await expect(page.locator('code:text("/search")')).toBeVisible();
    });

    test('should expand an endpoint and show parameters', async ({ page }) => {
      await page.goto(`${BASE_URL}/api/docs`);

      // Click on the /yachts endpoint
      const yachtBtn = page.locator('button:has(code:text("/yachts"))').first();
      await yachtBtn.click();

      // Should show parameters section
      await expect(page.locator('text=Parameters')).toBeVisible();
      await expect(page.locator('td:text("page")')).toBeVisible();
      await expect(page.locator('td:text("limit")')).toBeVisible();
      await expect(page.locator('td:text("sort")')).toBeVisible();

      // Should show Try It widget
      await expect(page.locator('text=Try it')).toBeVisible();
      await expect(page.locator('button:text("Send")')).toBeVisible();

      // Should show cURL example
      await expect(page.locator('text=cURL Example')).toBeVisible();
    });

    test('should switch to Schemas tab and show schemas', async ({ page }) => {
      await page.goto(`${BASE_URL}/api/docs`);

      // Click on Schemas tab
      await page.locator('button:text("Schemas (3)")').click();

      // Should show all schemas
      await expect(page.locator('h3:text("Yacht")')).toBeVisible();
      await expect(page.locator('h3:text("Manufacturer")')).toBeVisible();
      await expect(page.locator('h3:text("Error")')).toBeVisible();
    });

    test('should show error codes section', async ({ page }) => {
      await page.goto(`${BASE_URL}/api/docs`);

      await expect(page.locator('text=Error Codes')).toBeVisible();
      await expect(page.locator('text=INVALID_PARAM')).toBeVisible();
      await expect(page.locator('text=NOT_FOUND')).toBeVisible();
      await expect(page.locator('text=RATE_LIMIT_EXCEEDED')).toBeVisible();
      await expect(page.locator('text=INTERNAL_ERROR')).toBeVisible();
    });

    test('should link to OpenAPI JSON', async ({ page }) => {
      await page.goto(`${BASE_URL}/api/docs`);
      const link = page.locator('a[href="/api/v1/openapi.json"]');
      await expect(link).toBeVisible();
      expect(await link.getAttribute('href')).toBe('/api/v1/openapi.json');
    });

    test('docs page visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/api/docs`);
      await page.waitForLoadState('networkidle');
      // Mask dynamic content
      await expect(page).toHaveScreenshot('api-docs.png', {
        maxDiffPixelRatio: 0.02,
        fullPage: false,
      });
    });
  });

  test.describe('OpenAPI JSON Endpoint', () => {
    test('should return valid OpenAPI 3.0.3 spec', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/openapi.json`);
      expect(response.status()).toBe(200);

      const spec = await response.json();

      // Validate top-level structure
      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe('Sailing Yacht Info API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.servers).toBeDefined();
      expect(spec.paths).toBeDefined();
      expect(spec.components).toBeDefined();
      expect(spec.components.schemas).toBeDefined();
    });

    test('should contain all v1 endpoints', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/openapi.json`);
      const spec = await response.json();

      expect(spec.paths['/yachts']).toBeDefined();
      expect(spec.paths['/yachts'].get).toBeDefined();
      expect(spec.paths['/yachts/{slug}']).toBeDefined();
      expect(spec.paths['/yachts/{slug}'].get).toBeDefined();
      expect(spec.paths['/manufacturers']).toBeDefined();
      expect(spec.paths['/manufacturers'].get).toBeDefined();
      expect(spec.paths['/manufacturers/{id}']).toBeDefined();
      expect(spec.paths['/manufacturers/{id}'].get).toBeDefined();
      expect(spec.paths['/search']).toBeDefined();
      expect(spec.paths['/search'].get).toBeDefined();
    });

    test('should include Yacht, Manufacturer, and Error schemas', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/openapi.json`);
      const spec = await response.json();

      const schemas = spec.components.schemas;
      expect(schemas.Yacht).toBeDefined();
      expect(schemas.Manufacturer).toBeDefined();
      expect(schemas.Error).toBeDefined();

      // Yacht schema should have key properties
      const yachtProps = schemas.Yacht.properties;
      expect(yachtProps.id).toBeDefined();
      expect(yachtProps.modelName).toBeDefined();
      expect(yachtProps.manufacturer).toBeDefined();
      expect(yachtProps.lengthOverall).toBeDefined();
      expect(yachtProps.beam).toBeDefined();
      expect(yachtProps.draft).toBeDefined();

      // Required fields
      expect(schemas.Yacht.required).toContain('id');
      expect(schemas.Yacht.required).toContain('modelName');
      expect(schemas.Yacht.required).toContain('manufacturer');
    });

    test('should have consistent server URLs', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/openapi.json`);
      const spec = await response.json();

      expect(spec.servers.length).toBeGreaterThanOrEqual(1);
      expect(spec.servers[0].url).toContain('sailboats.fr');
    });

    test('should have CORS headers', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/openapi.json`);
      expect(response.headers()['access-control-allow-origin']).toBe('*');
    });
  });

  test.describe('Route Availability', () => {
    const publicRoutes = [
      '/api/v1/yachts',
      '/api/v1/yachts?limit=1',
      '/api/v1/manufacturers',
      '/api/v1/search?q=oceanis',
      '/api/v1/openapi.json',
      '/api/docs',
    ];

    for (const route of publicRoutes) {
      test(`GET ${route} should return 200`, async ({ request }) => {
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status()).toBe(200);
      });
    }
  });
});
