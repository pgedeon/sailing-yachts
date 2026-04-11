import { test, expect } from "@playwright/test";

test.describe("Related Guides API", () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

  test("should return guides for a known manufacturer", async ({ request }) => {
    const resp = await request.get(
      `${BASE_URL}/api/related-guides?manufacturer=Beneteau&limit=3`
    );
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.guides)).toBeTruthy();
  });

  test("should return guides with size context", async ({ request }) => {
    const resp = await request.get(
      `${BASE_URL}/api/related-guides?manufacturer=Beneteau&lengthOverall=11&rigType=Sloop`
    );
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.guides)).toBeTruthy();
  });

  test("should return empty array for unknown manufacturer", async ({ request }) => {
    const resp = await request.get(
      `${BASE_URL}/api/related-guides?manufacturer=ZZZNONEXISTENT&limit=4`
    );
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.guides).toEqual([]);
  });

  test("should respect limit parameter", async ({ request }) => {
    const resp = await request.get(
      `${BASE_URL}/api/related-guides?manufacturer=Beneteau&limit=2`
    );
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.guides.length).toBeLessThanOrEqual(2);
  });
});

test.describe("Related Guides on Yacht Detail", () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

  test("should render related guides section on yacht page", async ({ page }) => {
    // Navigate to a yacht page - use the yachts list first
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState("networkidle");

    // Click first yacht link
    const yachtLink = page.locator("a[href^='/yachts/']").first();
    if (await yachtLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await yachtLink.click();
      await page.waitForLoadState("networkidle");

      // Check for the related guides section
      const section = page.locator("[data-testid='related-guides-section']");
      await expect(section).toBeVisible({ timeout: 10000 });
    }
  });
});
