import { test, expect } from "@playwright/test";

/**
 * Thin-page governance tests for canonical URLs and robots meta tags.
 *
 * These tests verify that:
 * 1. Pages with filters have appropriate canonical URLs
 * 2. Low-value filter combinations are noindexed
 * 3. Pagination is handled correctly
 * 4. Search and dynamic compare pages are noindexed
 */

test.describe("Yachts page thin-page governance", () => {
  test("should index base yachts page without filters", async ({ page }) => {
    await page.goto("/yachts");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    const canonicalLink = await page.locator('link[rel="canonical"]').getAttribute("href");

    expect(robotsMeta).toContain("index");
    expect(robotsMeta).toContain("follow");
    expect(canonicalLink).toContain("/yachts");
    // No query params in canonical
    expect(canonicalLink).not.toContain("?");
  });

  test("should index paginated yachts page without filters", async ({ page }) => {
    await page.goto("/yachts?page=2");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    const canonicalLink = await page.locator('link[rel="canonical"]').getAttribute("href");

    expect(robotsMeta).toContain("index");
    expect(robotsMeta).toContain("follow");
    expect(canonicalLink).toContain("/yachts?page=2");
  });

  test("should index yachts page with single filter", async ({ page }) => {
    await page.goto("/yachts?filters[rigType]=Sloop");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    const canonicalLink = await page.locator('link[rel="canonical"]').getAttribute("href");

    expect(robotsMeta).toContain("index");
    expect(robotsMeta).toContain("follow");
    expect(canonicalLink).toContain("filters[rigType]=Sloop");
  });

  test("should index yachts page with two filters", async ({ page }) => {
    await page.goto("/yachts?filters[rigType]=Sloop&filters[keelType]=Fin");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    const canonicalLink = await page.locator('link[rel="canonical"]').getAttribute("href");

    expect(robotsMeta).toContain("index");
    expect(robotsMeta).toContain("follow");
    expect(canonicalLink).toContain("filters[rigType]=Sloop");
    expect(canonicalLink).toContain("filters[keelType]=Fin");
  });

  test("should noindex yachts page with 3+ filters", async ({ page }) => {
    await page.goto("/yachts?filters[rigType]=Sloop&filters[keelType]=Fin&filters[hullMaterial]=Fiberglass");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    const canonicalLink = await page.locator('link[rel="canonical"]').getAttribute("href");

    expect(robotsMeta).toContain("noindex");
    expect(robotsMeta).toContain("nofollow");
    // Canonical points to base page
    expect(canonicalLink).not.toContain("?");
  });

  test("should noindex paginated yachts page with filters", async ({ page }) => {
    await page.goto("/yachts?filters[rigType]=Sloop&page=2");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    const canonicalLink = await page.locator('link[rel="canonical"]').getAttribute("href");

    expect(robotsMeta).toContain("noindex");
    expect(robotsMeta).toContain("nofollow");
    expect(canonicalLink).not.toContain("?");
  });

  test("should noindex yachts page with broad ranges only", async ({ page }) => {
    await page.goto("/yachts?filters[lengthMin]=10&filters[lengthMax]=50");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    const canonicalLink = await page.locator('link[rel="canonical"]').getAttribute("href");

    expect(robotsMeta).toContain("noindex");
    expect(robotsMeta).toContain("nofollow");
    expect(canonicalLink).not.toContain("?");
  });

  test("should index yachts page with manufacturer filter", async ({ page }) => {
    await page.goto("/yachts?filters[manufacturers]=1");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    const canonicalLink = await page.locator('link[rel="canonical"]').getAttribute("href");

    expect(robotsMeta).toContain("index");
    expect(robotsMeta).toContain("follow");
    expect(canonicalLink).toContain("filters[manufacturers]=1");
  });
});

test.describe("Compare page thin-page governance", () => {
  test("should noindex compare page with ?ids= parameter", async ({ page }) => {
    await page.goto("/compare?ids=1,2");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");

    expect(robotsMeta).toContain("noindex");
    expect(robotsMeta).toContain("nofollow");
  });

  test("should noindex compare page with multiple yacht IDs", async ({ page }) => {
    await page.goto("/compare?ids=1,2,3,4");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");

    expect(robotsMeta).toContain("noindex");
    expect(robotsMeta).toContain("nofollow");
  });

  test("should allow canonical compare pages to be indexed", async ({ page }) => {
    // Canonical compare pages (slug-based) should not have noindex
    // This test assumes canonical compare routes work (P6.4)
    // For now, just verify the page loads
    const response = await page.goto("/compare");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Search page thin-page governance", () => {
  test("should noindex search page", async ({ page }) => {
    await page.goto("/search");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");

    expect(robotsMeta).toContain("noindex");
    expect(robotsMeta).toContain("nofollow");
  });
});

test.describe("Manufacturers page thin-page governance", () => {
  test("should index base manufacturers page", async ({ page }) => {
    await page.goto("/manufacturers");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    const canonicalLink = await page.locator('link[rel="canonical"]').getAttribute("href");

    expect(robotsMeta).toContain("index");
    expect(robotsMeta).toContain("follow");
    expect(canonicalLink).toContain("/manufacturers");
  });
});

test.describe("Favorites page thin-page governance", () => {
  test("should noindex favorites page", async ({ page }) => {
    await page.goto("/favorites");

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");

    expect(robotsMeta).toContain("noindex");
    expect(robotsMeta).toContain("nofollow");
  });
});
