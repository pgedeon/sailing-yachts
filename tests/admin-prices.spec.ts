import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Admin Prices Page", () => {
  test("renders price management page", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/prices`);
    await expect(page.locator("h1")).toContainText("Price Management");
    // Should show stats cards
    await expect(page.locator("text=Total Records")).toBeVisible();
    await expect(page.locator("text=Active Prices")).toBeVisible();
    await expect(page.locator("text=Yachts Priced")).toBeVisible();
  });

  test("shows add price button and modal", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/prices`);
    const btn = page.locator("#add-price-btn");
    await expect(btn).toBeVisible();
    await btn.click();
    // Modal should appear
    await expect(page.locator("#add-price-modal")).toBeVisible();
    await expect(page.locator("#add-price-modal h2")).toContainText("Add Price Record");
    // Close modal
    await page.locator("#add-price-modal button[type='button']").click();
    await expect(page.locator("#add-price-modal")).toHaveClass(/hidden/);
  });

  test("shows CSV import link", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/prices`);
    const importLink = page.locator("a[href='/admin/prices/import']");
    await expect(importLink).toBeVisible();
    await expect(importLink).toContainText("CSV Import");
  });

  test("navigates to CSV import page", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/prices/import`);
    await expect(page.locator("h1")).toContainText("Import Prices from CSV");
    await expect(page.locator("#csv-file")).toBeVisible();
    await expect(page.locator("#csv-paste")).toBeVisible();
    await expect(page.locator("#import-btn")).toBeVisible();
  });
});

test.describe("Prices API - Price History", () => {
  test("GET /api/prices?history=true&yachtModelId= returns history", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/prices?history=true&yachtModelId=1`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("history");
    expect(Array.isArray(data.history)).toBe(true);
  });
});
