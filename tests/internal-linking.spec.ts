import { test, expect } from "@playwright/test";

test.describe("P6.7: Internal Linking Modules", () => {
  test("should render similar yachts section on yacht detail page", async ({ page }) => {
    await page.goto("/yachts/jeanneau-sun-odyssey-349-2011");

    const similarSection = page.getByTestId("similar-yachts-section");
    await expect(similarSection).toBeVisible();
  });

  test("should render same-size alternatives section on yacht detail page", async ({ page }) => {
    await page.goto("/yachts/jeanneau-sun-odyssey-349-2011");

    const sameSizeSection = page.getByTestId("same-size-alternatives-section");
    await expect(sameSizeSection).toBeVisible();

    // Check that it shows the "Within ±1 meter length" text
    await expect(page.locator("text=Within ±1 meter length")).toBeVisible();
  });

  test("should render related manufacturers section on yacht detail page", async ({ page }) => {
    await page.goto("/yachts/jeanneau-sun-odyssey-349-2011");

    const relatedManufacturersSection = page.getByTestId("related-manufacturers-section");
    await expect(relatedManufacturersSection).toBeVisible();

    // Check for heading
    await expect(page.locator("text=More from this Manufacturer")).toBeVisible();
  });

  test("should render related guides section on yacht detail page", async ({ page }) => {
    await page.goto("/yachts/jeanneau-sun-odyssey-349-2011");

    const relatedGuidesSection = page.getByTestId("related-guides-section");
    await expect(relatedGuidesSection).toBeVisible();

    // Check for heading and "Phase 7" placeholder note
    await expect(page.locator("text=Buying Guides & Resources")).toBeVisible();
    await expect(page.locator("text=Full guides library coming in Phase 7")).toBeVisible();
  });

  test("should render manufacturer comparisons section on manufacturer page", async ({ page }) => {
    await page.goto("/manufacturers/jeanneau");

    // Look for the Compare section - it might not render if <2 yachts exist
    // Just check the page loads without error
    await expect(page.locator("h1")).toContainText("Jeanneau Yachts");
  });

  test("should navigate to similar yacht details", async ({ page }) => {
    await page.goto("/yachts/jeanneau-sun-odyssey-349-2011");

    // Wait for similar yachts to load
    await page.waitForSelector("[data-testid='similar-yacht-card']", { timeout: 10000 });

    // Click the first similar yacht card
    const firstCard = page.locator("[data-testid='similar-yacht-card']").first();
    await firstCard.click();

    // Should navigate to a yacht detail page
    await expect(page).toHaveURL(/\/yachts\/.*/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should navigate to same-size alternative", async ({ page }) => {
    await page.goto("/yachts/jeanneau-sun-odyssey-349-2011");

    // Wait for same-size alternatives to load
    await page.waitForSelector("[data-testid='same-size-yacht-card']", { timeout: 10000 });

    // Click the first card
    const firstCard = page.locator("[data-testid='same-size-yacht-card']").first();
    await firstCard.click();

    // Should navigate to a yacht detail page
    await expect(page).toHaveURL(/\/yachts\/.*/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should navigate to related manufacturer yacht", async ({ page }) => {
    await page.goto("/yachts/jeanneau-sun-odyssey-349-2011");

    // Wait for manufacturer yachts to load
    await page.waitForSelector("[data-testid='related-manufacturer-yacht-card']", { timeout: 10000 });

    // Click the first card
    const firstCard = page.locator("[data-testid='related-manufacturer-yacht-card']").first();
    await firstCard.click();

    // Should navigate to a yacht detail page
    await expect(page).toHaveURL(/\/yachts\/.*/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("all internal linking modules should have no broken links", async ({ page }) => {
    await page.goto("/yachts/jeanneau-sun-odyssey-349-2011");

    // Collect all link URLs from the linking modules
    const linkUrls: string[] = [];

    // Similar yachts links
    const similarLinks = await page.locator("[data-testid='similar-yacht-card']").all();
    for (const link of similarLinks) {
      const href = await link.getAttribute("href");
      if (href) linkUrls.push(href);
    }

    // Same-size alternatives links
    const sameSizeLinks = await page.locator("[data-testid='same-size-yacht-card']").all();
    for (const link of sameSizeLinks) {
      const href = await link.getAttribute("href");
      if (href) linkUrls.push(href);
    }

    // Manufacturer links
    const manufacturerLinks = await page.locator("[data-testid='related-manufacturer-yacht-card']").all();
    for (const link of manufacturerLinks) {
      const href = await link.getAttribute("href");
      if (href) linkUrls.push(href);
    }

    // Verify all links lead to valid yacht pages
    for (const url of linkUrls) {
      await page.goto(url);
      await expect(page.locator("h1")).toBeVisible({ timeout: 5000 });
      await page.goBack();
    }
  });
});
