import { test, expect } from "@playwright/test";

test.describe("Landing Pages", () => {
  const landingPages = [
    "40-foot-cruising-sailboats",
    "bluewater-sailboats-under-45-feet",
    "liveaboard-sailboats-with-3-cabins",
    "performance-cruisers-under-35-feet",
    "family-cruisers-3-cabins",
  ];

  test("should render landing page with correct heading", async ({ page }) => {
    await page.goto("/best/40-foot-cruising-sailboats");
    await expect(page).toHaveTitle(/Best 40-Foot Cruising Sailboats/);
    await expect(page.locator("h1")).toContainText("Best 40-Foot Cruising Sailboats");
  });

  test("should show collection page JSON-LD", async ({ page }) => {
    await page.goto("/best/40-foot-cruising-sailboats");
    const jsonLd = await page.locator('script[type="application/ld+json"]').nth(1).textContent();
    const parsed = JSON.parse(jsonLd || "{}");
    expect(parsed["@type"]).toBe("CollectionPage");
    expect(parsed.name).toBe("Best 40-Foot Cruising Sailboats");
  });

  test("should show breadcrumb JSON-LD", async ({ page }) => {
    await page.goto("/best/40-foot-cruising-sailboats");
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    const parsed = JSON.parse(jsonLd || "{}");
    expect(parsed["@type"]).toBe("BreadcrumbList");
    expect(parsed.itemListElement).toBeDefined();
    expect(parsed.itemListElement.length).toBeGreaterThanOrEqual(3);
  });

  test("should show yacht cards on landing page", async ({ page }) => {
    await page.goto("/best/40-foot-cruising-sailboats");
    const yachtCards = page.locator("a[href^='/yachts/']");
    await expect(yachtCards.first()).toBeVisible();
    // Should have at least some yachts matching the criteria
    const count = await yachtCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should show key specs on yacht cards", async ({ page }) => {
    await page.goto("/best/40-foot-cruising-sailboats");
    const firstCard = page.locator("a[href^='/yachts/']").first();
    await expect(firstCard.locator("text=/LOA:/")).toBeVisible();
    await expect(firstCard).toContainText(/m$/); // Length in meters
  });

  test("should show related categories section", async ({ page }) => {
    await page.goto("/best/40-foot-cruising-sailboats");
    const relatedSection = page.locator("h2:has-text('Explore Related Categories')");
    await expect(relatedSection).toBeVisible();

    const relatedCards = page.locator("a[href^='/best/']");
    await expect(relatedCards).toHaveCount(2); // 2 related pages
  });

  test("should navigate from landing page to yacht detail", async ({ page }) => {
    await page.goto("/best/40-foot-cruising-sailboats");
    const firstYachtLink = page.locator("a[href^='/yachts/']").first();
    const href = await firstYachtLink.getAttribute("href");
    expect(href).toMatch(/^\/yachts\/[^/]+$/);

    await firstYachtLink.click();
    await expect(page).toHaveURL(/\/yachts\/[^/]+$/);
  });

  test("should handle invalid landing page slug", async ({ page }) => {
    await page.goto("/best/invalid-slug");
    await expect(page.locator("h1")).toContainText("Landing Page Not Found");
    await expect(page.locator("text=Return to Home")).toBeVisible();
  });

  test("should have canonical tag", async ({ page }) => {
    await page.goto("/best/40-foot-cruising-sailboats");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /\/best\/40-foot-cruising-sailboats$/);
  });

  test("should have correct meta description", async ({ page }) => {
    await page.goto("/best/40-foot-cruising-sailboats");
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute(
      "content",
      /Explore the best 40-foot cruising sailboats/
    );
  });

  test("should show intro text", async ({ page }) => {
    await page.goto("/best/40-foot-cruising-sailboats");
    await expect(page.locator("text=/sweet spot for cruising/")).toBeVisible();
  });
});
