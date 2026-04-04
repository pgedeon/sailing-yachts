import { test, expect } from '@playwright/test';

test.describe('Performance Monitoring', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://sailing-yachts.vercel.app';

  test.describe('/api/vitals endpoint', () => {
    test('POST should accept valid metric batches', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/vitals`, {
        data: {
          metrics: [
            {
              name: 'LCP',
              value: 1520,
              rating: 'good',
              delta: 1520,
              navigationType: 'navigate',
              url: '/yachts',
              timestamp: Date.now(),
            },
            {
              name: 'CLS',
              value: 0.05,
              rating: 'good',
              delta: 0.05,
              navigationType: 'navigate',
              url: '/yachts',
              timestamp: Date.now(),
            },
            {
              name: 'TTFB',
              value: 320,
              rating: 'good',
              delta: 320,
              navigationType: 'navigate',
              url: '/',
              timestamp: Date.now(),
            },
          ],
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.stored).toBe(3);
    });

    test('POST should reject invalid payloads', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/vitals`, {
        data: { invalid: true },
      });

      expect(response.status()).toBe(400);
    });

    test('POST should reject empty metrics array', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/vitals`, {
        data: { metrics: [] },
      });

      expect(response.status()).toBe(400);
    });

    test('GET should return aggregated stats', async ({ request }) => {
      // First submit some data
      await request.post(`${BASE_URL}/api/vitals`, {
        data: {
          metrics: [
            {
              name: 'INP',
              value: 120,
              rating: 'good',
              delta: 120,
              navigationType: 'navigate',
              url: '/yachts',
              timestamp: Date.now(),
            },
          ],
        },
      });

      const response = await request.get(`${BASE_URL}/api/vitals`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('period');
      expect(data).toHaveProperty('totalMetrics');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('thresholds');
      expect(typeof data.totalMetrics).toBe('number');
    });

    test('GET should filter by URL', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/vitals?url=/yachts`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.url).toBe('/yachts');
    });
  });

  test.describe('Core Web Vitals page performance', () => {
    test('homepage should load within performance budget', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(`console-error: ${msg.text()}`);
        }
      });

      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      // Homepage should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);

      // No console errors
      expect(errors.length).toBe(0);
    });

    test('yachts page should load within performance budget', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/yachts`, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      // Yachts page should load within 6 seconds (data-heavy)
      expect(loadTime).toBeLessThan(6000);

      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    });

    test('compare page should load within performance budget', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/compare`, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });

    test('search page should load within performance budget', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('Web Vitals client script', () => {
    test('WebVitals component loads without errors', async ({ page }) => {
      const vitalsErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('WebVitals')) {
          vitalsErrors.push(msg.text());
        }
      });

      await page.goto(BASE_URL, { waitUntil: 'load' });

      // Wait for vitals to initialize
      await page.waitForTimeout(1000);

      // No WebVitals-related errors
      expect(vitalsErrors.length).toBe(0);
    });
  });
});
