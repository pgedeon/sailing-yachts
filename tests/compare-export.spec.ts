import { test, expect } from "@playwright/test";

test.describe("Compare Export API", () => {
  test("CSV export returns valid CSV with yacht comparison data", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/compare/export?ids=26,27&format=csv"
    );
    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("text/csv");

    const disposition = response.headers()["content-disposition"];
    expect(disposition).toContain("attachment");
    expect(disposition).toContain(".csv");

    const text = await response.text();
    const lines = text.split("\n");

    // Should have header row
    expect(lines[0]).toContain("Specification");

    // Should have key spec rows
    const fullText = text.toLowerCase();
    expect(fullText).toContain("length overall");
    expect(fullText).toContain("beam");
    expect(fullText).toContain("draft");

    // Should have footer with source attribution
    expect(fullText).toContain("sailboats.fr");
  });

  test("CSV export with 3 yachts works", async ({ request }) => {
    const response = await request.get(
      "/api/compare/export?ids=26,27,28&format=csv"
    );
    expect(response.status()).toBe(200);

    const text = await response.text();
    const headerLine = text.split("\n")[0];

    // Header should have 4 columns (Specification + 3 yachts)
    const columns = headerLine.split(",").length;
    expect(columns).toBe(4);
  });

  test("JSON export returns structured comparison data", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/compare/export?ids=26,27&format=json"
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.yachts).toBeDefined();
    expect(data.yachts.length).toBeGreaterThanOrEqual(2);
    expect(data.generatedAt).toBeDefined();
    expect(data.source).toBe("sailboats.fr");

    const yacht = data.yachts[0];
    expect(yacht.id).toBeDefined();
    expect(yacht.manufacturer).toBeDefined();
    expect(yacht.model).toBeDefined();
    expect(yacht.specs).toBeDefined();
    expect(yacht.specs.lengthOverall).toBeDefined();
  });

  test("CSV export rejects single yacht", async ({ request }) => {
    const response = await request.get(
      "/api/compare/export?ids=26&format=csv"
    );
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Minimum 2");
  });

  test("CSV export rejects more than 4 yachts", async ({ request }) => {
    const response = await request.get(
      "/api/compare/export?ids=1,2,3,4,5&format=csv"
    );
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Maximum 4");
  });

  test("CSV export rejects missing ids", async ({ request }) => {
    const response = await request.get("/api/compare/export?format=csv");
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("ids");
  });

  test("CSV export handles invalid ids gracefully", async ({ request }) => {
    const response = await request.get(
      "/api/compare/export?ids=abc,def&format=csv"
    );
    expect(response.status()).toBe(400);
  });
});

test.describe("Compare Export UI", () => {
  test("Export button appears when 2+ yachts selected", async ({ page }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const exportButton = page.locator("button:has-text('Export')");
    await expect(exportButton).toBeVisible({ timeout: 10000 });
  });

  test("Export dropdown opens with CSV and PDF options", async ({ page }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const exportButton = page.locator("button:has-text('Export')");
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();

    await expect(page.locator("text=Download CSV")).toBeVisible();
    await expect(page.locator("text=Save as PDF")).toBeVisible();
  });

  test("CSV download triggers file download", async ({ page }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const exportButton = page.locator("button:has-text('Export')");
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();

    const downloadPromise = page.waitForEvent("download", { timeout: 15000 });
    await page.locator("text=Download CSV").click();

    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toContain(".csv");
    expect(filename).toContain("comparison");
  });

  test("Export button hidden when no yachts selected", async ({ page }) => {
    await page.goto("/compare");
    await page.waitForLoadState("networkidle");

    const exportButton = page.locator("button:has-text('Export')");
    await expect(exportButton).not.toBeVisible();
  });
});
