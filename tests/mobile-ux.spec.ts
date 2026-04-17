import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Mobile Responsive UX", () => {
  // Use mobile viewport for these tests
  test.use({ viewport: { width: 375, height: 667 } });

  test("header shows hamburger menu on mobile", async ({ page }) => {
    await page.goto(BASE);
    // Hamburger button should be visible on mobile
    const hamburger = page.locator("#mobile-menu-btn");
    await expect(hamburger).toBeVisible();
    // Desktop nav should be hidden
    const desktopNav = page.locator("nav.hidden.md\\:flex");
    await expect(desktopNav).toBeHidden();
  });

  test("hamburger menu opens and shows navigation links", async ({ page }) => {
    await page.goto(BASE);
    // Click hamburger
    await page.click("#mobile-menu-btn");
    // Mobile menu panel should be visible
    const panel = page.locator("#mobile-menu-panel");
    await expect(panel).toBeVisible();
    // Should show all nav links
    await expect(panel.locator('a[href="/yachts"]')).toBeVisible();
    await expect(panel.locator('a[href="/search"]')).toBeVisible();
    await expect(panel.locator('a[href="/compare"]')).toBeVisible();
    await expect(panel.locator('a[href="/admin"]')).toBeVisible();
  });

  test("hamburger menu closes on outside click", async ({ page }) => {
    await page.goto(BASE);
    // Open menu
    await page.click("#mobile-menu-btn");
    const panel = page.locator("#mobile-menu-panel");
    await expect(panel).toBeVisible();
    // Click outside (on the main content)
    await page.click("main");
    // Panel should close
    await expect(panel).toBeHidden();
  });

  test("yachts page filter sidebar is hidden by default on mobile", async ({ page }) => {
    await page.goto(`${BASE}/yachts`);
    // Wait for content to load
    await page.waitForSelector("text=Sail Yachts", { timeout: 10000 });
    // The aside (filter sidebar) should be hidden
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeHidden();
  });

  test("yachts page filter toggle shows sidebar on mobile", async ({ page }) => {
    await page.goto(`${BASE}/yachts`);
    await page.waitForSelector("text=Sail Yachts", { timeout: 10000 });
    // Find and click the filter toggle button
    const filterBtn = page.locator('button:has-text("Filters")');
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();
    // Sidebar should now be visible
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
    // Should show filter controls
    await expect(page.locator("text=Clear Filters")).toBeVisible();
  });

  test("homepage text is responsive on small screens", async ({ page }) => {
    await page.goto(BASE);
    // Title should exist and be readable
    const title = page.locator("h1");
    await expect(title).toBeVisible();
    await expect(title).toContainText("Sailing Yacht Info");
    // Both CTA buttons should be visible
    await expect(page.locator('a:has-text("Browse Yachts")')).toBeVisible();
    await expect(page.locator('a:has-text("Compare")')).toBeVisible();
  });

  test("search page search input stacks on mobile", async ({ page }) => {
    await page.goto(`${BASE}/search`);
    await page.waitForSelector("text=Search Yachts", { timeout: 10000 });
    // Search input should be visible
    const input = page.locator('input[placeholder*="manufacturer"]');
    await expect(input).toBeVisible();
    // Search button should be visible
    await expect(page.locator('button:has-text("Search")')).toBeVisible();
  });

  test("compare page shows scroll hint on mobile", async ({ page }) => {
    await page.goto(`${BASE}/compare?ids=1,2`);
    await page.waitForSelector("text=Compare Yachts", { timeout: 10000 });
    // Wait for comparison to load
    await page.waitForSelector("table", { timeout: 10000 });
    // Swipe hint should be visible
    const swipeHint = page.locator("text=Swipe to see more");
    await expect(swipeHint).toBeVisible();
    // Scroll hint gradient overlay should exist
    const scrollHint = page.locator("#compare-scroll-hint");
    await expect(scrollHint).toBeVisible();
  });
});

test.describe("Desktop Responsive UX", () => {
  // Use desktop viewport
  test.use({ viewport: { width: 1280, height: 720 } });

  test("header shows desktop nav on large screens", async ({ page }) => {
    await page.goto(BASE);
    // Desktop nav should be visible
    const nav = page.locator("nav.hidden.md\\:flex");
    await expect(nav).toBeVisible();
    // Hamburger should be hidden
    const hamburger = page.locator("#mobile-menu-btn");
    await expect(hamburger).toBeHidden();
  });

  test("yachts page filter sidebar is visible on desktop", async ({ page }) => {
    await page.goto(`${BASE}/yachts`);
    await page.waitForSelector("text=Sail Yachts", { timeout: 10000 });
    // Sidebar should be visible without clicking toggle
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
    // No filter toggle button on desktop
    const filterBtn = page.locator('button:has-text("Filters")');
    await expect(filterBtn).toBeHidden();
  });

  test("compare page hides scroll hint on desktop", async ({ page }) => {
    await page.goto(`${BASE}/compare?ids=1,2`);
    await page.waitForSelector("text=Compare Yachts", { timeout: 10000 });
    await page.waitForSelector("table", { timeout: 10000 });
    // Scroll hint gradient should be hidden on desktop
    const scrollHint = page.locator("#compare-scroll-hint");
    await expect(scrollHint).toBeHidden();
  });
});
