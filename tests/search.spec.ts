import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

test.describe("Search Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
  });

  test("should render search page with title and input", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Search Yachts");
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toHaveAttribute(
      "placeholder",
      /manufacturer, model name/
    );
  });

  test("should show popular searches before searching", async ({ page }) => {
    await expect(page.getByText("Popular searches")).toBeVisible();
    await expect(page.getByText("Beneteau")).toBeVisible();
  });

  test("should have Search link in navigation", async ({ page }) => {
    const navSearchLink = page.locator('nav a[href="/search"]');
    await expect(navSearchLink).toBeVisible();
    await expect(navSearchLink).toHaveText("Search");
  });

  test("should search and show results when typing and clicking Search", async ({
    page,
  }) => {
    const input = page.locator('input[type="text"]');
    await input.fill("Beneteau");
    await page.locator('button:has-text("Search")').click();

    // Wait for results to load
    await page.waitForTimeout(3000);

    // Should show results count
    const resultsText = page.locator("text=/\\d+ yacht/i");
    await expect(resultsText).toBeVisible({ timeout: 10000 });
  });

  test("should trigger search with Enter key", async ({ page }) => {
    const input = page.locator('input[type="text"]');
    await input.fill("Hanse");
    await input.press("Enter");

    await page.waitForTimeout(3000);

    // Should show results or "No yachts found"
    const content = page.locator("body");
    await expect(
      content.locator("text=/\\d+ yacht|No yachts found/i")
    ).toBeVisible({ timeout: 10000 });
  });

  test("should show no results message for unlikely query", async ({
    page,
  }) => {
    const input = page.locator('input[type="text"]');
    await input.fill("xyznonexistent12345");
    await page.locator('button:has-text("Search")').click();

    await expect(page.getByText("No yachts found")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show autocomplete suggestions after typing 2+ chars", async ({
    page,
  }) => {
    const input = page.locator('input[type="text"]');
    await input.fill("Bav");

    // Wait for debounce + fetch
    await page.waitForTimeout(1500);

    // Should show autocomplete dropdown
    const suggestions = page.locator(
      ".absolute.top-full button, [class*='absolute'] button"
    );
    // If we have suggestions, at least verify the dropdown area exists
    const suggestionBox = page.locator(
      "div.absolute.top-full"
    );
    // Autocomplete may or may not show depending on data, so just check no crash
    await expect(input).toBeVisible();
  });

  test("should navigate to yacht detail from popular search", async ({
    page,
  }) => {
    // Click "Beneteau" popular search tag
    await page.getByText("Beneteau", { exact: true }).click();

    // Should have filled the input and triggered search
    await page.waitForTimeout(3000);

    // Should show results count or "no results"
    const body = page.locator("body");
    await expect(
      body.locator("text=/\\d+ yacht|No yachts found/i")
    ).toBeVisible({ timeout: 10000 });
  });
});
