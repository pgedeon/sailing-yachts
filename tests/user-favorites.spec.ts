import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

test.describe("User Favorites API", () => {
  test("favorites API returns 401 when not authenticated", async ({ request }) => {
    const res = await request.get(`${BASE}/api/user/favorites`);
    expect(res.status()).toBe(401);
  });

  test("favorites POST returns 401 when not authenticated", async ({ request }) => {
    const res = await request.post(`${BASE}/api/user/favorites`, {
      data: { yachtModelId: 1 },
    });
    expect(res.status()).toBe(401);
  });

  test("favorites DELETE returns 401 when not authenticated", async ({ request }) => {
    const res = await request.delete(`${BASE}/api/user/favorites?yachtModelId=1`);
    expect(res.status()).toBe(401);
  });

  test("comparisons API returns 401 when not authenticated", async ({ request }) => {
    const res = await request.get(`${BASE}/api/user/comparisons`);
    expect(res.status()).toBe(401);
  });

  test("comparisons POST returns 401 when not authenticated", async ({ request }) => {
    const res = await request.post(`${BASE}/api/user/comparisons`, {
      data: { name: "Test", yachtIds: [1, 2] },
    });
    expect(res.status()).toBe(401);
  });

  test("comparisons DELETE returns 401 when not authenticated", async ({ request }) => {
    const res = await request.delete(`${BASE}/api/user/comparisons?id=1`);
    expect(res.status()).toBe(401);
  });
});

test.describe("Favorites UI (Guest)", () => {
  test("favorites page loads and shows empty state for guests", async ({ page }) => {
    await page.goto(`${BASE}/favorites`);
    // Should show the empty favorites state or favorites list
    await expect(page.locator("h1")).toContainText("Favorites");
  });

  test("favorites localStorage works for guests", async ({ page }) => {
    await page.goto(`${BASE}/favorites`);
    
    // Check localStorage is empty initially
    const stored = await page.evaluate(() => {
      return localStorage.getItem("sailing-yachts-favorites");
    });
    expect(stored).toBeNull();
  });
});

test.describe("Public Pages Still Accessible", () => {
  test("all public pages load correctly", async ({ request }) => {
    const pages = ["/", "/yachts", "/search", "/compare", "/favorites"];
    for (const path of pages) {
      const res = await request.get(`${BASE}${path}`);
      expect(res.ok(), `${path} should be accessible`).toBeTruthy();
    }
  });
});
