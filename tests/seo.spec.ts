import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("SEO Meta Tags", () => {
  test("home page has proper meta tags", async ({ page }) => {
    await page.goto(BASE_URL);

    // Title
    await expect(page).toHaveTitle(/Sailing Yachts Database/);

    // Meta description
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /sailing yacht/i);

    // Open Graph
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /Sailing Yachts/);

    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toHaveCount(1);

    // Canonical
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);

    // Twitter card
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveCount(1);

    // JSON-LD
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Check WebSite schema
    const firstLd = await jsonLd.first().textContent();
    const parsed = JSON.parse(firstLd!);
    expect(parsed["@type"]).toBeDefined();
  });

  test("yachts listing has proper meta tags", async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts`);

    await expect(page).toHaveTitle(/Browse/);

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /yacht/i);

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveCount(1);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
  });

  test("compare page has proper meta tags", async ({ page }) => {
    await page.goto(`${BASE_URL}/compare`);

    await expect(page).toHaveTitle(/Compare/);

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /compare/i);

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveCount(1);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
  });

  test("yacht detail page has dynamic meta tags", async ({ page }) => {
    // Navigate to yachts first to find a valid slug
    await page.goto(`${BASE_URL}/yachts`);

    // Try to click first yacht link
    const yachtLink = page.locator('a[href*="/yachts/"]').first();
    const isVisible = await yachtLink.isVisible().catch(() => false);

    if (isVisible) {
      await yachtLink.click();
      await page.waitForLoadState("networkidle");

      // Should have a unique title (not the default)
      const title = await page.title();
      expect(title).not.toBe("Sailing Yachts Database");
      expect(title.length).toBeGreaterThan(10);

      // Should have meta description
      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveCount(1);

      // Should have canonical URL
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);

      // Should have Open Graph tags
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveCount(1);

      // Should have JSON-LD Product schema
      const jsonLd = page.locator('script[type="application/ld+json"]');
      const allLd = await jsonLd.allTextContents();
      const hasProduct = allLd.some((text) => text.includes('"Product"'));
      expect(hasProduct).toBe(true);
    }
  });
});
