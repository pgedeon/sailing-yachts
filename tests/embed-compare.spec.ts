import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://sailing-yachts.vercel.app";

test.describe("Embeddable Comparison Widget", () => {
  test("should show usage hint without ids parameter", async ({ page }) => {
    await page.goto(`${BASE_URL}/embed/compare`);
    await expect(page.locator("text=No yachts selected")).toBeVisible();
    await expect(page.locator("text=/embed/compare?ids=1,2")).toBeVisible();
  });

  test("should show error for only 1 yacht ID", async ({ page }) => {
    await page.goto(`${BASE_URL}/embed/compare?ids=1`);
    await expect(page.locator("text=Invalid selection")).toBeVisible();
    await expect(page.locator("text=2–4 yacht IDs")).toBeVisible();
  });

  test("should show error for more than 4 yacht IDs", async ({ page }) => {
    await page.goto(`${BASE_URL}/embed/compare?ids=1,2,3,4,5`);
    await expect(page.locator("text=Invalid selection")).toBeVisible();
  });

  test("should render comparison of 2 yachts", async ({ page }) => {
    await page.goto(`${BASE_URL}/embed/compare?ids=1,2`);
    await page.waitForLoadState("networkidle");

    // Should show branding header
    await expect(page.locator("text=Yacht Comparison")).toBeVisible();
    await expect(page.locator("text=Powered by Sailing Yachts Database")).toBeVisible();
    await expect(page.locator("text=Full comparison →")).toBeVisible();

    // Should show spec group headers
    await expect(page.locator("text=DIMENSIONS").first()).toBeVisible();

    // Should have "Est. Price" row
    await expect(page.locator("text=Est. Price")).toBeVisible();

    // Should not have the main site header/nav (embed layout is minimal)
    await expect(page.locator("header")).toHaveCount(0);
    await expect(page.locator("nav")).toHaveCount(0);
  });

  test("should link yacht names to detail pages", async ({ page }) => {
    await page.goto(`${BASE_URL}/embed/compare?ids=1,2`);
    await page.waitForLoadState("networkidle");

    // Yacht name links should point to /yachts/ paths
    const yachtLinks = page.locator('a[href*="/yachts/"]');
    const count = await yachtLinks.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("full comparison link should have correct URL", async ({ page }) => {
    await page.goto(`${BASE_URL}/embed/compare?ids=1,2`);
    await page.waitForLoadState("networkidle");

    const link = page.locator('a:has-text("Full comparison")');
    const href = await link.getAttribute("href");
    expect(href).toContain("/compare?ids=1,2");
    expect(href).toContain("target");
  });

  test("should render comparison of 3 yachts", async ({ page }) => {
    await page.goto(`${BASE_URL}/embed/compare?ids=1,2,3`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Yacht Comparison")).toBeVisible();
    // Should show 3 yacht name cards
    const yachtLinks = page.locator('a[href*="/yachts/"]');
    const count = await yachtLinks.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("should show Est. Price badges", async ({ page }) => {
    await page.goto(`${BASE_URL}/embed/compare?ids=1,2`);
    await page.waitForLoadState("networkidle");

    // Price tier badges should be visible (Budget, Mid-Range, Premium, Luxury, or Unknown)
    const priceSection = page.locator("text=Est. Price");
    await expect(priceSection).toBeVisible();
  });

  test("should show spec labels (LOA, Beam, Draft)", async ({ page }) => {
    await page.goto(`${BASE_URL}/embed/compare?ids=1,2`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=LOA").first()).toBeVisible();
    await expect(page.locator("text=Beam").first()).toBeVisible();
    await expect(page.locator("text=Draft").first()).toBeVisible();
  });

  test("should have no main site footer", async ({ page }) => {
    await page.goto(`${BASE_URL}/embed/compare?ids=1,2`);
    await page.waitForLoadState("networkidle");

    // The main site has "All rights reserved" — embed should not
    await expect(page.locator("text=All rights reserved")).toHaveCount(0);
    // But should have the embed footer
    await expect(page.locator("text=Powered by Sailing Yachts Database")).toBeVisible();
  });
});
