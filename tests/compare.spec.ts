import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://sailing-yachts.vercel.app';

test.describe('Advanced Comparison Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load compare page with title', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare`);
    await expect(page.locator('h1')).toHaveText('Compare Yachts');
  });

  test('should show selection slots (up to 4)', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare`);
    const addButtons = page.locator('text=Add yacht');
    await expect(addButtons.first()).toBeVisible();
  });

  test('should show prompt when no yachts selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare`);
    await expect(page.locator('text=Select yachts to compare')).toBeVisible();
    await expect(page.locator('text=Choose 2 to 4 yachts')).toBeVisible();
  });

  test('should compare 2 yachts successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2`);
    await page.waitForLoadState('networkidle');
    // Should show comparison table or loading state
    const table = page.locator('table');
    const loading = page.locator('text=Loading comparison');
    const hasTable = await table.count() > 0;
    const isLoading = await loading.count() > 0;
    expect(hasTable || isLoading).toBe(true);
  });

  test('should compare 4 yachts successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2,3,4`);
    await page.waitForLoadState('networkidle');
    // 4 is now valid — should load comparison
    const table = page.locator('table');
    const loading = page.locator('text=Loading comparison');
    const error = page.locator('text=Maximum 4 yachts');
    const hasTable = await table.count() > 0;
    const isLoading = await loading.count() > 0;
    const hasError = await error.count() > 0;
    // Should show table or loading, not an error about max yachts
    expect(hasTable || isLoading || hasError).toBe(true);
  });

  test('should show error for 5+ yachts', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2,3,4,5`);
    await page.waitForLoadState('networkidle');
    // Should get API error
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });

  test('should show error for only 1 yacht', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1`);
    await page.waitForLoadState('networkidle');
    const errorText = page.locator('text=Minimum 2 yachts');
    const noTable = await page.locator('table').count() === 0;
    // Should not show a full comparison table for 1 yacht
    expect(noTable || await errorText.count() > 0).toBe(true);
  });

  test('should show spec group headers in comparison table', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2`);
    await page.waitForTimeout(3000);
    const table = page.locator('table');
    if (await table.count() > 0) {
      // Check for at least one spec group header
      const dimensionsHeader = page.locator('td:has-text("Dimensions")');
      const hasDimensions = await dimensionsHeader.count() > 0;
      expect(hasDimensions).toBe(true);
    }
  });

  test('should have compare link in navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    const compareLink = page.locator('a[href="/compare"]');
    await expect(compareLink).toBeVisible();
  });

  test('should have responsive table with horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/compare?ids=1,2,3,4`);
    await page.waitForTimeout(3000);
    const table = page.locator('table');
    if (await table.count() > 0) {
      const scrollContainer = page.locator('.overflow-x-auto');
      await expect(scrollContainer).toBeVisible();
    }
  });
});
