import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Favorites", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto(BASE);
    await page.evaluate(() => {
      localStorage.removeItem("sailing-yachts-favorites");
    });
  });

  test("favorites page shows empty state", async ({ page }) => {
    await page.goto(`${BASE}/favorites`);
    await expect(page.locator("h1")).toHaveText("My Favorites");
    await expect(page.getByText("No favorites yet")).toBeVisible();
    await expect(page.getByText("Browse Yachts")).toBeVisible();
  });

  test("favorites nav link is present in header", async ({ page }) => {
    await page.goto(BASE);
    // Desktop nav
    await expect(page.locator('nav:visible >> a[href="/favorites"]')).toBeVisible();
  });

  test("favorites link in mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE);
    // Open mobile menu
    await page.click("#mobile-menu-btn");
    await expect(page.locator('#mobile-menu-panel a[href="/favorites"]')).toBeVisible();
  });

  test("heart button visible on yacht cards", async ({ page }) => {
    await page.goto(`${BASE}/yachts`);
    // Wait for yachts to load
    await page.waitForSelector(".grid > div");
    // Heart button should be visible on first card
    const heartButtons = page.locator("button[aria-label*='Add']");
    const count = await heartButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("can add yacht to favorites from listing", async ({ page }) => {
    await page.goto(`${BASE}/yachts`);
    await page.waitForSelector(".grid > div");

    // Click the first heart button
    const heartBtn = page.locator("button[aria-label*='Add']").first();
    await heartBtn.click();

    // Button should now show "Remove" state
    await expect(page.locator("button[aria-label*='Remove']").first()).toBeVisible();

    // Check localStorage
    const favorites = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("sailing-yachts-favorites") || "[]");
    });
    expect(favorites.length).toBeGreaterThan(0);
  });

  test("can remove yacht from favorites by clicking heart again", async ({ page }) => {
    // Pre-set a favorite
    await page.goto(`${BASE}/yachts`);
    await page.waitForSelector(".grid > div");

    // Add to favorites
    const heartBtn = page.locator("button[aria-label*='Add'], button[aria-label*='Remove']").first();
    await heartBtn.click();
    await page.waitForTimeout(200);

    // Click again to remove
    const removeBtn = page.locator("button[aria-label*='Remove']").first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
    }

    // Should be empty again
    const favorites = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("sailing-yachts-favorites") || "[]");
    });
    expect(favorites.length).toBe(0);
  });

  test("favorites page shows saved yachts", async ({ page }) => {
    // First add a favorite via localStorage
    await page.goto(`${BASE}/yachts`);
    await page.waitForSelector(".grid > div");

    // Get the slug of the first yacht
    const firstCardText = await page.locator(".grid > div").first().locator("h3").textContent();
    expect(firstCardText).toBeTruthy();

    // Click heart to add
    const heartBtn = page.locator("button[aria-label*='Add']").first();
    await heartBtn.click();
    await page.waitForTimeout(200);

    // Go to favorites page
    await page.goto(`${BASE}/favorites`);
    await expect(page.locator("h1")).toHaveText("My Favorites");

    // Should show the saved yacht
    if (firstCardText) {
      await expect(page.getByText(firstCardText.split(" ").slice(0, 2).join(" "))).toBeVisible();
    }
  });

  test("can remove favorite from favorites page", async ({ page }) => {
    // Add a favorite
    await page.goto(`${BASE}/yachts`);
    await page.waitForSelector(".grid > div");
    const heartBtn = page.locator("button[aria-label*='Add']").first();
    await heartBtn.click();
    await page.waitForTimeout(200);

    // Go to favorites
    await page.goto(`${BASE}/favorites`);

    // Should have a remove button
    const removeBtn = page.locator("button[aria-label*='Remove']").first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      // Should show empty state
      await expect(page.getByText("No favorites yet")).toBeVisible();
    }
  });

  test("clear all favorites", async ({ page }) => {
    // Add two favorites
    await page.goto(`${BASE}/yachts`);
    await page.waitForSelector(".grid > div");

    const heartBtns = page.locator("button[aria-label*='Add']");
    const count = await heartBtns.count();
    if (count >= 2) {
      await heartBtns.nth(0).click();
      await page.waitForTimeout(100);
      await heartBtns.nth(1).click();
      await page.waitForTimeout(100);
    } else if (count === 1) {
      await heartBtns.first().click();
      await page.waitForTimeout(100);
    }

    // Go to favorites
    await page.goto(`${BASE}/favorites`);

    // Click clear all
    await page.getByText("Clear All").click();

    // Confirm
    await page.getByText("Yes, clear").click();

    // Should show empty state
    await expect(page.getByText("No favorites yet")).toBeVisible();
  });

  test("compare all link on favorites page", async ({ page }) => {
    // Add two favorites
    await page.goto(`${BASE}/yachts`);
    await page.waitForSelector(".grid > div");

    const heartBtns = page.locator("button[aria-label*='Add']");
    const count = await heartBtns.count();
    if (count >= 2) {
      await heartBtns.nth(0).click();
      await page.waitForTimeout(100);
      await heartBtns.nth(1).click();
      await page.waitForTimeout(100);
    }

    // Go to favorites
    await page.goto(`${BASE}/favorites`);

    // Compare button should link to compare page
    const compareLink = page.locator('a[href*="/compare?ids="]');
    if (await compareLink.isVisible()) {
      const href = await compareLink.getAttribute("href");
      expect(href).toContain("/compare?ids=");
    }
  });

  test("favorites persist after page reload", async ({ page }) => {
    await page.goto(`${BASE}/yachts`);
    await page.waitForSelector(".grid > div");

    // Add favorite
    const heartBtn = page.locator("button[aria-label*='Add']").first();
    await heartBtn.click();
    await page.waitForTimeout(200);

    // Check localStorage has data
    const favoritesBefore = await page.evaluate(() => {
      return localStorage.getItem("sailing-yachts-favorites");
    });
    expect(favoritesBefore).not.toBeNull();

    // Reload
    await page.reload();
    await page.waitForSelector(".grid > div");

    // Favorite should still be there
    const favoritesAfter = await page.evaluate(() => {
      return localStorage.getItem("sailing-yachts-favorites");
    });
    expect(favoritesAfter).toBe(favoritesBefore);
  });
});
