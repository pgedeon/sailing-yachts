import { test, expect } from "@playwright/test";

test.describe("Affiliate Recommendations", () => {
  test("should load yacht detail page without errors", async ({ page }) => {
    // Navigate to a yacht detail page
    const response = await page.goto("/yachts/beneteau-oceanis-38-1");

    // Check page loads successfully
    expect(response?.status()).toBe(200);

    // Check for basic yacht content
    await expect(page.locator("h1").nth(1)).toContainText("Beneteau");

    // Check no console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Wait a bit for client-side rendering
    await page.waitForTimeout(2000);

    // Should have no console errors
    expect(errors).toHaveLength(0);
  });

  test("affiliate recommendations should be present and valid", async ({ page }) => {
    await page.goto("/yachts/beneteau-oceanis-38-1");

    // Wait for client-side rendering
    await page.waitForTimeout(1000);

    // The affiliate section may or may not be present depending on recommendations
    const section = page.locator("section.affiliate-recommendations");

    const isVisible = await section.count() > 0;

    // If section exists, verify it's properly structured
    if (isVisible) {
      await expect(section).toBeVisible();

      // Check for heading
      await expect(section.locator("h2")).toContainText("Recommended Gear & Equipment");

      // Check for affiliate disclosure somewhere on the page
      await expect(page.locator("body")).toContainText("As an Amazon Associate");
    }
  });

  test("affiliate links should be tracked via proxy when present", async ({ page }) => {
    await page.goto("/yachts/beneteau-oceanis-38-1");

    // Wait for client-side rendering
    await page.waitForTimeout(1000);

    // All outbound affiliate links must flow through the tracked proxy
    const affiliateLinks = page.locator('a[href*="api.petergedeon.com/a/"]');

    const count = await affiliateLinks.count();

    // If affiliate links exist, verify their structure
    if (count > 0) {
      const firstLink = affiliateLinks.first();

      // Check the tracked proxy slug format
      const href = await firstLink.getAttribute("href");
      expect(href).toMatch(/api\.petergedeon\.com\/a\/SY-[a-z0-9-]+/);

      // No raw Amazon links may remain in the section
      const rawAmazon = await page
        .locator('section.affiliate-recommendations a[href*="amazon."]')
        .count();
      expect(rawAmazon).toBe(0);

      // Check security attributes
      const rel = await firstLink.getAttribute("rel");
      expect(rel).toContain("noopener");
      expect(rel).toContain("noreferrer");

      const target = await firstLink.getAttribute("target");
      expect(target).toBe("_blank");
    }
  });

  test("page should render without layout errors", async ({ page }) => {
    await page.goto("/yachts");

    // Get first yacht link
    const yachtLinks = page.locator("a[href^='/yachts/']");
    const count = await yachtLinks.count();

    if (count > 0) {
      await yachtLinks.first().click();

      // Wait for navigation
      await page.waitForLoadState("networkidle");

      // Check for "Application error" which indicates a client-side crash
      const appError = page.locator("text=Application error");
      await expect(appError).not.toBeVisible();

      // Check main content area exists
      const main = page.locator("main");
      await expect(main).toBeVisible();
    }
  });

  test("price tier and affiliate features should not break page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });

    await page.goto("/yachts/beneteau-oceanis-38-1");

    // Wait for full rendering
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Check no JavaScript errors
    expect(errors).toHaveLength(0);

    // Check the page title is set correctly
    const title = await page.title();
    expect(title).toContain("Beneteau");
  });
});
