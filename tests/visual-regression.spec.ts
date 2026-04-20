import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://info.sailboats.fr';

/**
 * Visual Regression Tests — P11.5
 *
 * Screenshot-based coverage for critical pages.
 * These tests capture screenshots and compare them against baselines
 * to detect unintended visual changes.
 *
 * To update baselines after intentional changes:
 *   npx playwright test visual-regression --update-snapshots
 */

test.describe('Visual Regression — Critical Pages', () => {
  // Fixed viewport for deterministic screenshots
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    // Wait for fonts to load so text rendering is consistent
    await page.addInitScript(() => {
      (document as any).fonts.ready;
    });
  });

  test.describe('Home Page', () => {
    test('home page visual snapshot', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      // Wait for dynamic content to settle
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('home-page.png', {
        fullPage: true,
        mask: [
          // Mask dynamic content that changes between runs
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });
  });

  test.describe('Yachts Listing Page', () => {
    test('yachts listing visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('yachts-listing.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });
  });

  test.describe('Search Page', () => {
    test('search page visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('search-page.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });
  });

  test.describe('Compare Page', () => {
    test('compare empty state visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('compare-empty.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });

    test('compare with yachts visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare?ids=1,2`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('compare-with-yachts.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
          // Mask price data that may fluctuate
          page.locator('[data-testid="price"], .text-green-600, .text-red-600'),
        ],
      });
    });
  });

  test.describe('Yacht Detail Page', () => {
    test('yacht detail page visual snapshot', async ({ page }) => {
      // First navigate to listing to find a valid yacht link
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const yachtLink = page.locator('a[href^="/yachts/"]:not([href="/yachts"])').first();
      const linkCount = await yachtLink.count();

      if (linkCount === 0) {
        test.skip(true, 'No yacht links available for detail page test');
        return;
      }

      const href = await yachtLink.getAttribute('href');
      await page.goto(`${BASE_URL}${href}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('yacht-detail.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
          page.locator('[data-testid="price"], .text-green-600, .text-red-600'),
        ],
      });
    });
  });

  test.describe('Guides Page', () => {
    test('guides listing visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/guides`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('guides-listing.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });
  });

  test.describe('Glossary Page', () => {
    test('glossary listing visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/glossary`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('glossary-listing.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });
  });

  test.describe('Manufacturers Page', () => {
    test('manufacturers listing visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/manufacturers`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('manufacturers-listing.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });
  });

  test.describe('Best Value Page', () => {
    test('best value listing visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/best-value`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('best-value-listing.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });
  });

  test.describe('API Docs Page', () => {
    test('api docs visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/api/docs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('api-docs.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });
  });

  test.describe('Sign In Page', () => {
    test('sign in page visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('signin.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });
  });

  test.describe('Mobile Viewport', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('home page mobile visual snapshot', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('home-mobile.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });

    test('yachts listing mobile visual snapshot', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('yachts-mobile.png', {
        fullPage: true,
        mask: [
          page.locator('footer time, footer [datetime]'),
        ],
      });
    });
  });
});
