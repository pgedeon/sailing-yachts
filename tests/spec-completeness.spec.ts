import { test, expect } from '@playwright/test';
import { calculateCompletenessScore, getCompletenessLevel, shouldNoindex, calculateAverageScore, getMissingFields } from './completeness';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://info.sailboats.fr';

// Note: The unit tests for completeness scoring are tested indirectly via API/UI tests
// since Playwright doesn't support direct TS module imports.
// We test the scoring through the /api/completeness endpoint and UI rendering.

test.describe('Spec Completeness Scoring (P10.5)', () => {
  test.describe('API - Completeness Endpoint', () => {
    test('GET /api/completeness returns completeness data', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/completeness?limit=5`);
      expect(res.status()).toBe(200);
      const data = await res.json();

      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('averageScore');
      expect(data).toHaveProperty('distribution');
      expect(data).toHaveProperty('yachts');
      expect(Array.isArray(data.yachts)).toBe(true);
      expect(data.total).toBeGreaterThan(0);
      expect(data.averageScore).toBeGreaterThanOrEqual(0);
      expect(data.averageScore).toBeLessThanOrEqual(100);
    });

    test('each yacht has a completeness score between 0 and 100', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/completeness?limit=20`);
      const data = await res.json();

      for (const yacht of data.yachts) {
        expect(yacht.completenessScore).toBeGreaterThanOrEqual(0);
        expect(yacht.completenessScore).toBeLessThanOrEqual(100);
        expect(yacht).toHaveProperty('id');
        expect(yacht).toHaveProperty('modelName');
        expect(yacht).toHaveProperty('noindex');
        expect(typeof yacht.noindex).toBe('boolean');
      }
    });

    test('score distribution sums to total', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/completeness?limit=50`);
      const data = await res.json();

      const distSum = data.distribution.comprehensive + data.distribution.good +
        data.distribution.partial + data.distribution.basic + data.distribution.minimal;
      expect(distSum).toBe(data.total);
    });

    test('supports minScore and maxScore filtering', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/completeness?minScore=50&maxScore=100&limit=10`);
      const data = await res.json();

      for (const yacht of data.yachts) {
        expect(yacht.completenessScore).toBeGreaterThanOrEqual(50);
        expect(yacht.completenessScore).toBeLessThanOrEqual(100);
      }
    });

    test('supports limit parameter', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/completeness?limit=3`);
      const data = await res.json();

      expect(data.yachts.length).toBeLessThanOrEqual(3);
    });
  });

  test.describe('Completeness Badge on Yacht Detail', () => {
    test('completeness badge appears on yacht detail page', async ({ page }) => {
      // First get a yacht slug from the API
      const apiRes = await page.request.get(`${BASE_URL}/api/completeness?limit=1`);
      const apiData = await apiRes.json();

      if (apiData.yachts.length > 0 && apiData.yachts[0].slug) {
        await page.goto(`${BASE_URL}/yachts/${apiData.yachts[0].slug}`);
        const badge = page.getByTestId('completeness-badge');
        await expect(badge.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('SEO - Noindex for Low Completeness', () => {
    test('yachts below threshold get noindex meta tag', async ({ request }) => {
      // Find low-completeness yachts
      const res = await request.get(`${BASE_URL}/api/completeness?maxScore=29&limit=5`);
      const data = await res.json();

      for (const yacht of data.yachts) {
        if (yacht.noindex && yacht.slug) {
          // Check that the page has noindex meta
          const pageRes = await request.get(`${BASE_URL}/yachts/${yacht.slug}`);
          const html = await pageRes.text();
          // The noindex should be in the rendered HTML meta tag
          // Note: this may not work for client-rendered pages, but the server-rendered metadata should include it
          expect(html).toContain('noindex');
          break; // Just verify one
        }
      }
    });
  });

  test.describe('Completeness Badge on Yacht Listing', () => {
    test('completeness badges appear on yacht listing cards', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);

      // Wait for yacht cards to load
      const badges = page.getByTestId('completeness-badge');
      const count = await badges.count();
      // Should have at least some badges visible
      expect(count).toBeGreaterThan(0);
    });
  });
});
