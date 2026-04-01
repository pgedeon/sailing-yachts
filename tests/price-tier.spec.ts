import { test, expect } from "@playwright/test";

test.describe("Price Tier Indicator", () => {
  test("price tier badge appears on yacht listing cards", async ({ page }) => {
    await page.goto("/yachts");
    await page.waitForSelector("text=View Details", { timeout: 15000 });

    // Price tier badges should be visible on cards
    const badges = page.locator("span.rounded-full");
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThan(0);

    // At least some badges should have price tier text
    const tierTexts = ["Budget", "Mid-Range", "Premium", "Luxury"];
    let foundTier = false;
    for (const tier of tierTexts) {
      const matching = await badges.filter({ hasText: tier }).count();
      if (matching > 0) foundTier = true;
    }
    expect(foundTier).toBe(true);
  });

  test("price tier section appears on yacht detail page", async ({ page }) => {
    // Go to yachts listing first to find a yacht
    await page.goto("/yachts");
    await page.waitForSelector("text=View Details", { timeout: 15000 });

    // Click the first "View Details" link
    const firstLink = page.locator("text=View Details").first();
    await firstLink.click();
    await page.waitForLoadState("networkidle");

    // Should see the "Estimated Price Range" heading
    await expect(page.locator("text=Estimated Price Range")).toBeVisible({ timeout: 10000 });

    // Should see a disclaimer about estimates
    await expect(page.locator("text=Estimate based on yacht specifications")).toBeVisible();
  });

  test("price tier row appears in comparison table", async ({ page }) => {
    // Go to compare page with some yacht IDs
    await page.goto("/compare?ids=1,2");
    await page.waitForSelector("table", { timeout: 15000 });

    // Should see the "Est. Price Range" row label
    await expect(page.locator("td:has-text('Est. Price Range')")).toBeVisible({ timeout: 10000 });

    // Should see price tier badges in the comparison table
    const badges = page.locator("table span.rounded-full");
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(2);
  });

  test("price tier badge has colored background", async ({ page }) => {
    await page.goto("/yachts");
    await page.waitForSelector("text=View Details", { timeout: 15000 });

    // Find a badge and check it has a colored background class
    const badges = page.locator("span.rounded-full");
    const firstBadge = badges.first();

    const classAttr = await firstBadge.getAttribute("class") || "";
    const hasColor = ["bg-green-", "bg-blue-", "bg-purple-", "bg-amber-", "bg-gray-"].some(
      (c) => classAttr.includes(c)
    );
    expect(hasColor).toBe(true);
  });
});
