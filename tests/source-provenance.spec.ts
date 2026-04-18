import { test, expect } from '@playwright/test';

const BASE_URL = 'https://info.sailboats.fr';

test.describe('Source Provenance UI', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('should display source provenance section on yacht detail page', async ({ page }) => {
    // Navigate to yachts listing first to find a valid yacht
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState('networkidle');

    // Click the first yacht link
    const yachtLink = page.locator('a[href^="/yachts/"]').first();
    if (!(await yachtLink.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await yachtLink.click();
    await page.waitForLoadState('networkidle');

    // Source provenance section should exist
    const provenanceSection = page.locator('[data-testid="source-provenance"]');
    await expect(provenanceSection).toBeVisible({ timeout: 10000 });

    // Toggle button should be visible
    const toggle = page.locator('[data-testid="source-provenance-toggle"]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('Data Source & Quality');
  });

  test('should show completeness badge in provenance section', async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState('networkidle');

    const yachtLink = page.locator('a[href^="/yachts/"]').first();
    if (!(await yachtLink.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await yachtLink.click();
    await page.waitForLoadState('networkidle');

    // Expand the section
    const toggle = page.locator('[data-testid="source-provenance-toggle"]');
    await toggle.click();

    // Completeness badge(s) should be visible
    const badges = page.locator('[data-testid="completeness-badge"]');
    await expect(badges.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display source info correctly after expanding', async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState('networkidle');

    const yachtLink = page.locator('a[href^="/yachts/"]').first();
    if (!(await yachtLink.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await yachtLink.click();
    await page.waitForLoadState('networkidle');

    // Expand the section
    const toggle = page.locator('[data-testid="source-provenance-toggle"]');
    await toggle.click();

    // Should show "Data source:" label
    const provenanceContent = page.locator('[data-testid="source-provenance"]');
    await expect(provenanceContent).toContainText('Data source:', { timeout: 5000 });

    // Should show "Source confidence:" label
    await expect(provenanceContent).toContainText('Source confidence:');

    // Should show "Last verified:" label
    await expect(provenanceContent).toContainText('Last verified:');
  });
});
