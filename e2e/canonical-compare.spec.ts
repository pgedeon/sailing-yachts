import { test, expect } from '@playwright/test';

test.describe('Canonical Comparison Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to comparison page
    await page.goto('/compare/beneteau-oceanis-30-1-vs-jeanneau-sun-odyssey-349');
  });

  test('should render canonical comparison page with correct metadata', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/Beneteau Oceanis 30\.1 vs Jeanneau Sun Odyssey 349/);
    
    // Check canonical tag
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /\/compare\/beneteau-oceanis-30-1-vs-jeanneau-sun-odyssey-349$/);
  });

  test('should display both yachts in comparison table', async ({ page }) => {
    // Check yacht names appear in table headers
    await expect(page.locator('th:has-text("Beneteau Oceanis 30.1")')).toBeVisible();
    await expect(page.locator('th:has-text("Jeanneau Sun Odyssey 349")')).toBeVisible();
  });

  test('should link to individual yacht detail pages', async ({ page }) => {
    // Check both yachts have detail page links
    const yachtALink = page.locator('a[href="/yachts/beneteau-oceanis-30-1"]');
    const yachtBLink = page.locator('a[href="/yachts/jeanneau-sun-odyssey-349"]');
    
    await expect(yachtALink).toBeVisible();
    await expect(yachtBLink).toBeVisible();
  });

  test('should render comparison table with all specification groups', async ({ page }) => {
    // Check section headers exist
    await expect(page.locator('th:has-text("Specification")')).toBeVisible();
    await expect(page.locator('td:has-text("Rigging & Sails")')).toBeVisible();
    await expect(page.locator('td:has-text("Construction")')).toBeVisible();
    await expect(page.locator('td:has-text("Accommodation")')).toBeVisible();
    await expect(page.locator('td:has-text("Technical")')).toBeVisible();
  });

  test('should show dimensions for both yachts', async ({ page }) => {
    // Check LOA values
    await expect(page.locator('td:has-text("Length Overall")')).toBeVisible();
    
    // Verify at least some numeric values are displayed (exact values depend on DB)
    const dimensionCells = page.locator('table tbody td').filter({ hasText: /\d+\.\d+ m/ });
    await expect(dimensionCells.first()).toBeVisible();
  });

  test('should display unique intro copy', async ({ page }) => {
    // Check intro section exists
    const intro = page.locator('section:has-text("Compare")');
    await expect(intro).toBeVisible();
    
    // Verify intro contains both yacht names
    const introText = await intro.textContent();
    expect(introText).toContain('Beneteau Oceanis 30.1');
    expect(introText).toContain('Jeanneau Sun Odyssey 349');
  });

  test('should have View buttons for both yachts', async ({ page }) => {
    // Check header view buttons
    const viewA = page.locator('a:has-text("View Beneteau Oceanis 30.1")');
    const viewB = page.locator('a:has-text("View Jeanneau Sun Odyssey 349")');
    
    await expect(viewA).toBeVisible();
    await expect(viewB).toBeVisible();
    
    // Verify they link to correct pages
    await expect(viewA).toHaveAttribute('href', '/yachts/beneteau-oceanis-30-1');
    await expect(viewB).toHaveAttribute('href', '/yachts/jeanneau-sun-odyssey-349');
  });

  test('should include structured data (JSON-LD)', async ({ page }) => {
    // Check for JSON-LD scripts
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();
    
    // Should have breadcrumb + 2 yacht JSON-LD entries
    expect(jsonLdScripts.length).toBeGreaterThanOrEqual(2);
    
    // Verify first script is breadcrumb
    const firstScript = await jsonLdScripts[0].textContent();
    expect(firstScript).toContain('@type": "BreadcrumbList"');
  });

  test('should handle non-existent yacht slugs gracefully', async ({ page }) => {
    // Navigate to invalid comparison
    await page.goto('/compare/invalid-yacht-1-vs-invalid-yacht-2');
    
    // Should show not found message
    await expect(page.locator('h1:has-text("Yacht Comparison Not Found")')).toBeVisible();
    await expect(page.locator('a[href="/compare"]')).toBeVisible();
  });

  test('should handle single yacht not found', async ({ page }) => {
    // Navigate with one valid and one invalid slug
    await page.goto('/compare/beneteau-oceanis-30-1-vs-nonexistent-yacht');
    
    // Should show not found message
    await expect(page.locator('h1:has-text("Yacht Comparison Not Found")')).toBeVisible();
  });

  test('should have back link to comparison tool', async ({ page }) => {
    // Check footer/back link
    const backLink = page.locator('a[href="/compare"]');
    await expect(backLink).toBeVisible();
  });

  test('should render price tier badges', async ({ page }) => {
    // Check price tier row
    await expect(page.locator('td:has-text("Est. Price Range")')).toBeVisible();
    
    // Both yachts should have price tier displayed
    const priceTierBadges = page.locator('[data-testid="price-tier-badge"]');
    await expect(priceTierBadges).toHaveCount(2);
  });

  test('should have responsive table layout', async ({ page }) => {
    // Check table is scrollable on mobile
    const tableContainer = page.locator('.overflow-x-auto');
    await expect(tableContainer).toBeVisible();
  });

  test('should display Learn More section with yacht detail links', async ({ page }) => {
    // Check Learn More section
    await expect(page.locator('h2:has-text("Learn More")')).toBeVisible();
    
    // Check both yachts have cards with detail links
    const detailLinks = page.locator('.grid.grid-cols-1 a[href^="/yachts/"]');
    await expect(detailLinks).toHaveCount(2);
  });
});
