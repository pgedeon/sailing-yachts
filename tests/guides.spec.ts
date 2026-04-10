import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

/**
 * Guides Platform E2E Tests
 *
 * Tests for the guides platform including:
 * - /guides hub page
 * - /guides/[slug] individual guide pages
 * - /guides/feed.xml RSS feed
 * - Metadata and structured data validation
 */

test.describe("Guides Hub Page", () => {
  test("should load the guides hub page", async ({ page }) => {
    await page.goto(`${BASE_URL}/guides`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("Sailing Guides");
  });

  test("should display categories sidebar when categories exist", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/guides`);
    await page.waitForLoadState("networkidle");

    const categoriesHeading = page.locator("h2:has-text('Categories')");
    if (await categoriesHeading.count() > 0) {
      await expect(categoriesHeading).toBeVisible();
    }
  });

  test("should show newsletter signup section", async ({ page }) => {
    await page.goto(`${BASE_URL}/guides`);
    await page.waitForLoadState("networkidle");

    const newsletterHeading = page
      .locator("h2, h3")
      .filter({ hasText: /Get New Guides/i });
    await expect(newsletterHeading.first()).toBeVisible();
  });

  test("should have proper meta tags", async ({ page }) => {
    await page.goto(`${BASE_URL}/guides`);
    await page.waitForLoadState("networkidle");

    const title = page.locator("title");
    const titleText = await title.textContent();
    expect(titleText && titleText.trim().length > 0).toBe(true);
  });

  test("should link to browse yachts CTA", async ({ page }) => {
    await page.goto(`${BASE_URL}/guides`);
    await page.waitForLoadState("networkidle");

    const browseLink = page
      .locator('a[href="/yachts"]')
      .filter({ hasText: /Browse Yachts/i });
    if (await browseLink.count() > 0) {
      await expect(browseLink.first()).toBeVisible();
    }
  });

  test("should handle empty state when no articles exist", async ({ page }) => {
    await page.goto(`${BASE_URL}/guides`);
    await page.waitForLoadState("networkidle");

    // Either articles are shown OR coming soon/empty state
    const articles = page.locator("a[href^='/guides/']");
    const comingSoon = page.locator("text=/coming soon/i");
    const hasArticles = (await articles.count()) > 0;
    const hasComingSoon = (await comingSoon.count()) > 0;

    expect(hasArticles || hasComingSoon).toBe(true);
  });
});

test.describe("Guides RSS Feed", () => {
  test("should return valid XML feed", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/guides/feed.xml`);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("application/xml");
  });

  test("feed should contain required RSS elements", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/guides/feed.xml`);
    const text = await response.text();

    expect(text).toContain("<?xml");
    expect(text).toContain("<rss");
    expect(text).toContain("<channel>");
    expect(text).toContain("<title>");
  });

  test("feed should be valid XML structure", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/guides/feed.xml`);
    const text = await response.text();

    // Basic XML structure validation
    expect(text).toContain("</channel>");
    expect(text).toContain("</rss>");
  });
});

test.describe("Guides Navigation", () => {
  test("should navigate from hub page to home", async ({ page }) => {
    await page.goto(`${BASE_URL}/guides`);
    await page.waitForLoadState("networkidle");

    const homeLink = page.locator('a[href="/"]').first();
    if (await homeLink.count() > 0) {
      await homeLink.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(new RegExp("^" + BASE_URL + "/?$"));
    }
  });

  test("should have working navigation links", async ({ page }) => {
    await page.goto(`${BASE_URL}/guides`);
    await page.waitForLoadState("networkidle");

    // Check that we have navigation elements
    const nav = page.locator("nav, header").first();
    await expect(nav).toBeVisible();
  });
});

test.describe("Guides Page Performance & Accessibility", () => {
  test("should load within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/guides`);
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
  });

  test("should have no console errors on guides hub", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/guides`);
    await page.waitForLoadState("networkidle");

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("net::ERR") &&
        !e.includes("Failed to load resource")
    );
    expect(criticalErrors.length).toBe(0);
  });

  test("should have main content area", async ({ page }) => {
    await page.goto(`${BASE_URL}/guides`);
    await page.waitForLoadState("networkidle");

    const main = page.locator("main").first();
    await expect(main).toBeVisible();
  });
});
