import { test, expect } from "@playwright/test";

test.describe("Content Freshness API", () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

  test("should return freshness report", async ({ request }) => {
    const resp = await request.get(`${BASE_URL}/api/content-freshness`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.articles).toBeDefined();
    expect(Array.isArray(data.articles)).toBeTruthy();
    expect(data.stats).toBeDefined();
    expect(data.stats.total).toBeDefined();
  });

  test("should return stats with freshness breakdown", async ({ request }) => {
    const resp = await request.get(`${BASE_URL}/api/content-freshness`);
    const data = await resp.json();
    expect(data.stats.fresh).toBeDefined();
    expect(data.stats.due).toBeDefined();
    expect(data.stats.stale).toBeDefined();
    expect(data.stats.never_reviewed).toBeDefined();
  });

  test("should respect days threshold", async ({ request }) => {
    const resp = await request.get(`${BASE_URL}/api/content-freshness?days=30&limit=5`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.threshold.days).toBe(30);
  });

  test("should filter by status", async ({ request }) => {
    const resp = await request.get(`${BASE_URL}/api/content-freshness?status=stale&limit=5`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.articles)).toBeTruthy();
  });
});

test.describe("Content Freshness on Guide Pages", () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

  test("guide detail page should load successfully", async ({ page }) => {
    await page.goto(`${BASE_URL}/guides/how-to-choose-your-first-sailboat`);
    await page.waitForLoadState("networkidle");
    // Page should not show application error
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });
});
