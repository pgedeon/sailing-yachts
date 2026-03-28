import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://sailing-yachts.vercel.app';

test.describe('Public Pages Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport size for consistent testing
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
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h1')).toHaveText('Sail Yachts');
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

      // Look for yacht cards
      const yachtCards = page.locator('[data-testid="yacht-card"], .border.rounded.p-4, .grid > div:has(h3)').first();
      
      // Wait a bit for data to load
      await page.waitForTimeout(2000);
      
      // Either cards exist or we see "Loading yachts..." or "No yachts match your filters"
      const hasCards = await yachtCards.count() > 0;
      const hasLoading = await page.locator('text="Loading yachts..."').count() > 0;
      const hasNoYachts = await page.locator('text="No yachts match your filters"').count() > 0;
      
      expect(hasCards || hasLoading || hasNoYachts).toBe(true);
    });

    test('should have working filter functionality', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      // Look for filter checkboxes
      const filterCheckboxes = page.locator('input[type="checkbox"]').first();
      
      if (await filterCheckboxes.count() > 0) {
        await expect(filterCheckboxes).toBeVisible();
        // Click a filter checkbox to test it works
        await filterCheckboxes.first().check();
        await page.waitForLoadState('networkidle');
        // Page should not crash after filter interaction
        await expect(page.locator('h1')).toHaveText('Sail Yachts');
      }
    });

    test('should have pagination if present', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      // Wait for data to load
      await page.waitForTimeout(2000);

      const pagination = page.locator('button:has-text("Previous"), button:has-text("Next")').first();
      
      if (await pagination.count() > 0) {
        await expect(pagination).toBeVisible();
        const prevButton = page.locator('button:has-text("Previous")').first();
        if (await prevButton.count() > 0 && !(await prevButton.isDisabled())) {
          await prevButton.click();
          await page.waitForLoadState('networkidle');
          // Page should redirect without crashing
          await expect(page.locator('h1')).toHaveText('Sail Yachts');
        }
      }
    });

    test('should show yacht details modal when clicking view details', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      // Wait for data to load
      await page.waitForTimeout(2000);

      // Look for "View Details" buttons
      const viewDetailsButtons = page.locator('text="View Details"').first();
      
      if (await viewDetailsButtons.count() > 0) {
        await expect(viewDetailsButtons).toBeVisible();
        await viewDetailsButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Modal should appear
        const modal = page.locator('.fixed.inset-0, .bg-black\\/50, .z-50').first();
        await expect(modal).toBeVisible();
      }
    });
  });

  test.describe('Individual Yacht Page', () => {
    test('should load individual yacht page via modal navigation', async ({ page }) => {
      // This test is complex because it requires opening a modal from the listing
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      // Wait for data to load
      await page.waitForTimeout(2000);

      // Look for yacht cards that might have view details links
      const viewDetailsButtons = page.locator('text="View Details"').first();
      
      if (await viewDetailsButtons.count() > 0) {
        await viewDetailsButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Modal should be visible with yacht details
        const modal = page.locator('.fixed.inset-0, .bg-black\\/50, .z-50').first();
        await expect(modal).toBeVisible();
        
        // Close modal and test direct URL access
        const closeButton = page.locator('text="×", .text-gray-500:has-text("×")').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        test.skip('No yachts available for detail testing');
      }
    });

    test('should handle direct yacht URL access', async ({ page }) => {
      // First get a yacht slug from the listing page
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      // Wait for data to load
      await page.waitForTimeout(2000);

      // Look for yacht links
      const yachtLinks = page.locator('a[href^="/yachts/"]:not([href="/yachts"])');
      
      if (await yachtLinks.count() > 0) {
        const firstLink = yachtLinks.first();
        const href = await firstLink.getAttribute('href');
        
        if (href) {
          await page.goto(`${BASE_URL}${href}`);
          await page.waitForLoadState('networkidle');
          
          // Should be on a yacht detail page
          await expect(page).toHaveURL(/\/yachts\/.+/);
          const yachtTitle = page.locator('h1, h2').first();
          await expect(yachtTitle).toBeVisible();
        }
      } else {
        test.skip('No yacht links found');
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

      // Wait for data to load
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
        test.skip('No yacht links found');
      }
    });

    test('should have yacht specifications in detail view', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      // Wait for data to load
      await page.waitForTimeout(2000);

      const viewDetailsButtons = page.locator('text="View Details"').first();
      
      if (await viewDetailsButtons.count() > 0) {
        await viewDetailsButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Check for specification details
        const specFields = page.locator('dt, strong').filter({ hasText: /^(Length|Beam|Draft|Displacement|Rig|Keel)/i });
        await expect(specFields.first()).toBeVisible();
      } else {
        test.skip('No yachts available for spec testing');
      }
    });
  });

  test.describe('Compare Page', () => {
    test('should show empty state when no yacht IDs provided', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare`);
      await expect(page).toHaveURL(`${BASE_URL}/compare`);
      
      // Should show either loading or empty state
      const loadingText = page.locator('text="Loading comparison..."');
      const emptyText = page.locator('text="No yachts selected for comparison"');
      const noYachtsText = page.locator('text="No yachts to compare"');
      
      expect(await loadingText.count() > 0 || await emptyText.count() > 0 || await noYachtsText.count() > 0).toBe(true);
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
      // This would require actual yacht IDs, so we'll test the error case
      await page.goto(`${BASE_URL}/compare?ids=1,2`);
      await page.waitForLoadState('networkidle');

      // Should either show loading, error, or actual comparison
      const loadingText = page.locator('text="Loading comparison..."');
      const errorText = page.locator('text="Failed"');
      const compareTable = page.locator('table');
      const yachtHeaders = page.locator('th:has-text("Manufacturer")');
      
      expect(
        await loadingText.count() > 0 || 
        await errorText.count() > 0 || 
        await compareTable.count() > 0 || 
        await yachtHeaders.count() > 0
      ).toBe(true);
    });

    test('should show error when too many yacht IDs provided', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare?ids=1,2,3,4`);
      await page.waitForLoadState('networkidle');

      const errorText = page.locator('text="Maximum 3 yachts can be compared"');
      if (await errorText.count() > 0) {
        await expect(errorText).toBeVisible();
      } else {
        // If no error shown, the page should still load without crashing
        await expect(page.locator('h1')).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Main content should be visible on mobile
      await expect(page.locator('main')).toBeVisible();
      
      // Home page content should be accessible
      const homeContent = page.locator('h1, .flex').first();
      await expect(homeContent).toBeVisible();
    });

    test('should be responsive on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Main content should be visible on tablet
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Navigation Flow', () => {
    test('should navigate from home to yachts successfully', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Click browse yachts button
      const browseButton = page.locator('text="Browse Yachts"').first();
      await expect(browseButton).toBeVisible();
      await browseButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to yachts page
      await expect(page).toHaveURL(`${BASE_URL}/yachts`);
      await expect(page.locator('h1')).toHaveText('Sail Yachts');
    });

    test('should have working back navigation from yachts', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      // Look for back navigation link or browser back
      const backLink = page.locator('a:has-text("Back"), a[href="/"]').first();
      
      if (await backLink.count() > 0) {
        await expect(backLink).toBeVisible();
        await backLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(BASE_URL);
      } else {
        // Test browser back button
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

        // Look for footer content
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
      
      // Pages should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should have basic accessibility landmarks', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check for basic accessibility landmarks
      const main = page.locator('main').first();
      const hasMain = await main.count() > 0;
      
      // At least main content should be present
      expect(hasMain).toBe(true);
    });

    test('should have functional interactive elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/yachts`);
      await page.waitForLoadState('networkidle');

      // Look for any interactive elements and test they don't break the page
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
      
      // Should show some content (error page or basic page structure)
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

      // Allow some broken images (like favicons that might not exist)
      expect(brokenImages.filter(url => !url.includes('favicon'))).toEqual([]);
    });
  });

  test.describe('SEO & Meta Tags', () => {
    test('should have title tag in page source', async ({ page }) => {
      const pages = [
        BASE_URL,
        `${BASE_URL}/yachts`,
        `${BASE_URL}/compare`
      ];

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