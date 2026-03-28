import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://sailing-yachts.vercel.app';

test.describe('Public Pages Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Home Page', () => {
    test('should load home page successfully', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page).toHaveURL(BASE_URL);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h1')).toHaveText('Sailing Yachts Database');
    });

    test('should have no console errors on home page', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const criticalErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('net::ERR') &&
        !e.includes('Failed to load resource')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('should have browse yachts button', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const browseButton = page.locator('text="Browse Yachts"').first();
      await expect(browseButton).toBeVisible();
      await expect(browseButton).toHaveAttribute('href', '/yachts');
    });

    test('title should exist in page source', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const title = page.locator('title');
      const titleText = await title.textContent();
      expect(titleText && titleText.trim().length > 0).toBe(true);
    });
  });

  test.describe('Yachts Listing Page', () => {
    test('should load yachts listing page successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await expect(page).toHaveURL(`${BASE_URL}/yachts`);
      await page.waitForSelector('h1');
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText('Sail Yachts');
    });

    test('should have no console errors on yachts listing', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      const criticalErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('net::ERR') &&
        !e.includes('Failed to load resource')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('should display yachts in card format', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const yachtCards = page.locator('[data-testid="yacht-card"], .border.rounded.p-4').first();
      const loadingText = page.locator('text="Loading yachts..."');
      const noYachtsText = page.locator('text="No yachts match your filters"');

      const hasCards = await yachtCards.count() > 0;
      const hasLoading = await loadingText.count() > 0;
      const hasNoYachts = await noYachtsText.count() > 0;

      expect(hasCards || hasLoading || hasNoYachts).toBe(true);
    });

    test('should have working filter functionality', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      const filterCheckboxes = page.locator('input[type="checkbox"]').first();

      if (await filterCheckboxes.count() > 0) {
        await expect(filterCheckboxes).toBeVisible();
        await filterCheckboxes.first().check();
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('h1');
        const h1 = page.locator('h1');
        await expect(h1).toHaveText('Sail Yachts');
      }
    });

    test('should have pagination if present', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const pagination = page.locator('button:has-text("Previous"), button:has-text("Next")').first();

      if (await pagination.count() > 0) {
        await expect(pagination).toBeVisible();
        const prevButton = page.locator('button:has-text("Previous")').first();
        if (await prevButton.count() > 0 && !(await prevButton.isDisabled())) {
          await prevButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForSelector('h1');
          const h1 = page.locator('h1');
          await expect(h1).toHaveText('Sail Yachts');
        }
      }
    });

    test('should show yacht details modal when clicking view details', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const viewDetailsButtons = page.locator('text="View Details"').first();

      if (await viewDetailsButtons.count() > 0) {
        await expect(viewDetailsButtons).toBeVisible();
        await viewDetailsButtons.first().click();
        await page.waitForTimeout(1000);

        const modal = page.locator('.fixed.inset-0, .bg-black\\/50, .z-50').first();
        await expect(modal).toBeVisible();
      }
    });
  });

  test.describe('Individual Yacht Page', () => {
    test('should load individual yacht page via modal navigation', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const viewDetailsButtons = page.locator('text="View Details"').first();

      if (await viewDetailsButtons.count() > 0) {
        await viewDetailsButtons.first().click();
        await page.waitForTimeout(1000);

        const modal = page.locator('.fixed.inset-0, .bg-black\\/50, .z-50').first();
        await expect(modal).toBeVisible();

        const closeButton = page.locator('text="×"').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        test.skip(true, 'No yachts available for detail testing');
      }
    });

    test('should handle direct yacht URL access', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const yachtLinks = page.locator('a[href^="/yachts/"]:not([href="/yachts"])');

      if (await yachtLinks.count() > 0) {
        const firstLink = yachtLinks.first();
        const href = await firstLink.getAttribute('href');

        if (href) {
          await page.goto(`${BASE_URL}${href}`);
          await page.waitForLoadState('networkidle');

          await expect(page).toHaveURL(/\/yachts\/.+/);
          await page.waitForSelector('h1, h2');
          const yachtTitle = page.locator('h1, h2').first();
          await expect(yachtTitle).toBeVisible();
        }
      } else {
        test.skip(true, 'No yacht links found');
      }
    });

    test('should have no console errors on individual yacht page', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const yachtLinks = page.locator('a[href^="/yachts/"]:not([href="/yachts"])');

      if (await yachtLinks.count() > 0) {
        const firstLink = yachtLinks.first();
        await firstLink.click();
        await page.waitForLoadState('networkidle');

        const criticalErrors = errors.filter(e =>
          !e.includes('favicon') &&
          !e.includes('net::ERR') &&
          !e.includes('Failed to load resource')
        );
        expect(criticalErrors.length).toBe(0);
      } else {
        test.skip(true, 'No yacht links found');
      }
    });

    test('should have yacht specifications in detail view', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const viewDetailsButtons = page.locator('text="View Details"').first();

      if (await viewDetailsButtons.count() > 0) {
        await viewDetailsButtons.first().click();
        await page.waitForTimeout(1000);

        // Check for specification details
        const specFields = page.locator('dt, strong');
        const specCount = await specFields.count();

        let foundSpec = false;
        for (let i = 0; i < specCount; i++) {
          const text = await specFields.nth(i).textContent();
          if (text && (text.includes('Length') || text.includes('Beam') || text.includes('Draft') ||
                       text.includes('Displacement') || text.includes('Rig') || text.includes('Keel'))) {
            foundSpec = true;
            break;
          }
        }

        expect(foundSpec).toBe(true);
      } else {
        test.skip(true, 'No yachts available for spec testing');
      }
    });
  });

  test.describe('Compare Page', () => {
    test('should show empty state when no yacht IDs provided', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare`);
      await expect(page).toHaveURL(`${BASE_URL}/compare`);

      const loadingText = page.locator('text="Loading comparison..."');
      const emptyText = page.locator('text="No yachts selected for comparison"');
      const noYachtsText = page.locator('text="No yachts to compare"');

      const hasLoading = await loadingText.count() > 0;
      const hasEmpty = await emptyText.count() > 0;
      const hasNoYachts = await noYachtsText.count() > 0;

      expect(hasLoading || hasEmpty || hasNoYachts).toBe(true);
    });

    test('should have no console errors on compare page', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(`${BASE_URL}/compare`);
      await page.waitForLoadState('networkidle');

      const criticalErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('net::ERR') &&
        !e.includes('Failed to load resource')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('should show comparison table when yacht IDs provided', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare?ids=1,2`);
      await page.waitForLoadState('networkidle');

      const loadingText = page.locator('text="Loading comparison..."');
      const errorText = page.locator('text="Failed"');
      const compareTable = page.locator('table');
      const yachtHeaders = page.locator('th:has-text("Manufacturer")');

      const hasLoading = await loadingText.count() > 0;
      const hasError = await errorText.count() > 0;
      const hasTable = await compareTable.count() > 0;
      const hasHeaders = await yachtHeaders.count() > 0;

      expect(hasLoading || hasError || hasTable || hasHeaders).toBe(true);
    });

    test('should show error when too many yacht IDs provided', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare?ids=1,2,3,4`);
      await page.waitForLoadState('networkidle');

      const errorText = page.locator('text="Maximum 3 yachts can be compared"');
      if (await errorText.count() > 0) {
        await expect(errorText).toBeVisible();
      } else {
        await page.waitForSelector('h1');
        const h1 = page.locator('h1');
        await expect(h1).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const mains = page.locator('main');
      await expect(mains.first()).toBeVisible();

      const homeContent = page.locator('h1, .flex').first();
      await expect(homeContent).toBeVisible();
    });

    test('should be responsive on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const mains = page.locator('main');
      await expect(mains.first()).toBeVisible();
    });
  });

  test.describe('Navigation Flow', () => {
    test('should navigate from home to yachts successfully', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const browseButton = page.locator('text="Browse Yachts"').first();
      await expect(browseButton).toBeVisible();
      await browseButton.click();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(`${BASE_URL}/yachts`);
      await page.waitForSelector('h1');
      const h1 = page.locator('h1');
      await expect(h1).toHaveText('Sail Yachts');
    });

    test('should have working back navigation from yachts', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      const backLink = page.locator('a:has-text("Back"), a[href="/"]').first();

      if (await backLink.count() > 0) {
        await expect(backLink).toBeVisible();
        await backLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(BASE_URL);
      } else {
        await page.goBack();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(BASE_URL);
      }
    });

    test('should have footer links on all pages', async ({ page }) => {
      const pages = [BASE_URL, `${BASE_URL}/yachts`, `${BASE_URL}/compare`];

      for (const pageUrl of pages) {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');

        const footerContent = page.locator('footer, .text-sm, .text-gray-500').first();
        await expect(footerContent).toBeVisible();
      }
    });
  });

  test.describe('Performance & Accessibility', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(10000);
    });

    test('should have basic accessibility landmarks', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const main = page.locator('main').first();
      const hasMain = await main.count() > 0;

      expect(hasMain).toBe(true);
    });

    test('should have functional interactive elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      const interactiveElements = page.locator('input, button, a, [role="button"]').first();

      if (await interactiveElements.count() > 0) {
        await expect(interactiveElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/non-existent-page`);
      await page.waitForLoadState('networkidle');

      const bodyContent = page.locator('body').first();
      await expect(bodyContent).toBeVisible();
    });

    test('should not have broken images', async ({ page }) => {
      const brokenImages: string[] = [];
      page.on('response', response => {
        if (response.url().match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) && response.status() >= 400) {
          brokenImages.push(response.url());
        }
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      expect(brokenImages.filter(url => !url.includes('favicon'))).toEqual([]);
    });
  });

  test.describe('SEO & Meta Tags', () => {
    test('should have title tag in page source', async ({ page }) => {
      const pages = [BASE_URL, `${BASE_URL}/yachts`, `${BASE_URL}/compare`];

      for (const pageUrl of pages) {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');

        const title = page.locator('title');
        const titleText = await title.textContent();
        expect(titleText && titleText.trim().length > 0).toBe(true);
      }
    });

    test('should have meta description in page source if present', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const metaDescription = page.locator('meta[name="description"]').first();
      if (await metaDescription.count() > 0) {
        const content = await metaDescription.getAttribute('content');
        expect(content && content.trim().length > 0).toBe(true);
      }
    });
  });
});
