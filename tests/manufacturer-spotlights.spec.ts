import { test, expect } from '@playwright/test';

test.describe('Manufacturer Spotlight Pages', () => {
  test('should render Beneteau spotlight page with key sections', async ({ page }) => {
    await page.goto('/manufacturers/beneteau/spotlight');

    // Page loads successfully
    await expect(page.locator('h1')).toContainText('Beneteau');

    // Brand History section
    await expect(page.locator('h2', { hasText: 'Brand History' })).toBeVisible();

    // Brand Positioning section
    await expect(page.locator('h2', { hasText: 'Brand Positioning' })).toBeVisible();

    // Milestones section
    await expect(page.locator('h2', { hasText: 'Milestones' })).toBeVisible();

    // Notable Models section
    await expect(page.locator('h2', { hasText: 'Notable Models' })).toBeVisible();

    // Internal links exist
    const links = page.locator('a[href*="/yachts/"]');
    await expect(links.first()).toBeVisible();

    // Back to manufacturer link
    await expect(page.locator('a[href="/manufacturers/beneteau"]')).toBeVisible();

    // Browse yachts link
    await expect(page.locator('a[href*="filters[manufacturers]"]')).toBeVisible();
  });

  test('should include JSON-LD structured data', async ({ page }) => {
    await page.goto('/manufacturers/beneteau/spotlight');

    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Check Organization schema
    let hasOrg = false;
    for (let i = 0; i < count; i++) {
      const content = await jsonLdScripts.nth(i).textContent();
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed['@type'] === 'Organization') {
          hasOrg = true;
          expect(parsed.name).toBe('Beneteau');
        }
        if (parsed['@type'] === 'BreadcrumbList') {
          expect(parsed.itemListElement.length).toBeGreaterThanOrEqual(3);
        }
      }
    }
    expect(hasOrg).toBe(true);
  });

  test('should have correct SEO metadata', async ({ page }) => {
    await page.goto('/manufacturers/beneteau/spotlight');

    const title = await page.title();
    expect(title).toContain('Beneteau');
    expect(title).toContain('Sailing Yacht Info');

    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDesc).toBeTruthy();
    expect(metaDesc!.length).toBeGreaterThan(50);

    // Canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/manufacturers/beneteau/spotlight');
  });

  test('should render Jeanneau spotlight page', async ({ page }) => {
    await page.goto('/manufacturers/jeanneau/spotlight');
    await expect(page.locator('h1')).toContainText('Jeanneau');
    await expect(page.locator('h2', { hasText: 'Brand History' })).toBeVisible();
  });

  test('should render Bavaria spotlight page', async ({ page }) => {
    await page.goto('/manufacturers/bavaria-yachts/spotlight');
    await expect(page.locator('h1')).toContainText('Bavaria');
    await expect(page.locator('h2', { hasText: 'Brand History' })).toBeVisible();
  });

  test('should return 404 for non-existent spotlight', async ({ page }) => {
    const response = await page.goto('/manufacturers/nonexistent-manufacturer/spotlight');
    expect(response!.status()).toBe(404);
  });

  test('should show spotlight link on manufacturer detail page', async ({ page }) => {
    await page.goto('/manufacturers/beneteau');
    const spotlightLink = page.locator('a[href="/manufacturers/beneteau/spotlight"]');
    await expect(spotlightLink).toBeVisible();
  });
});
