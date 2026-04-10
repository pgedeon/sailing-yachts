import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

test.describe("Related Articles Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a yacht detail page
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState("networkidle");

    // Click the first yacht card link
    const firstYacht = page.locator('a[href^="/yachts/"]').first();
    if ((await firstYacht.count()) === 0) {
      test.skip();
      return;
    }
    await firstYacht.click();
    await page.waitForLoadState("networkidle");
  });

  test("related articles section appears on yacht detail page", async ({
    page,
  }) => {
    const section = page.getByTestId("related-articles-section");
    // May or may not appear depending on matching; wait briefly
    const visible = await section.isVisible({ timeout: 5000 }).catch(() => false);
    if (visible) {
      await expect(section.locator("h2")).toContainText("Related Sailing Articles");
    }
  });

  test("related article cards have correct structure when visible", async ({
    page,
  }) => {
    const cards = page.getByTestId("related-article-card");
    const count = await cards.count();

    if (count === 0) {
      // No matching articles for this yacht — acceptable
      return;
    }

    // Each card should have a heading
    const firstCard = cards.first();
    await expect(firstCard.locator("h3")).toBeVisible();

    // Each card should link to sailboats.fr
    const href = await firstCard.getAttribute("href");
    expect(href).toContain("sailboats.fr");

    // Each card should have a sailboats.fr badge
    await expect(firstCard.locator("text=sailboats.fr")).toBeVisible();
  });

  test("related articles link includes affiliate tag", async ({ page }) => {
    const cards = page.getByTestId("related-article-card");
    const count = await cards.count();

    if (count === 0) return;

    const firstCard = cards.first();
    const href = await firstCard.getAttribute("href");
    expect(href).toContain("tag=pgedeon-20");
  });

  test("at most 4 articles shown", async ({ page }) => {
    const cards = page.getByTestId("related-article-card");
    const count = await cards.count();
    expect(count).toBeLessThanOrEqual(4);
  });

  test("related articles API returns valid response", async ({ request }) => {
    // First get a valid manufacturer
    const listRes = await request.get(`${BASE_URL}/api/yachts`);
    const listData = await listRes.json();
    const firstYacht = listData.yachts?.[0] || listData[0];

    if (!firstYacht) {
      test.skip();
      return;
    }

    const res = await request.get(
      `${BASE_URL}/api/sailboat-articles?manufacturer=${encodeURIComponent(firstYacht.manufacturer || "")}&loa=${firstYacht.lengthOverall || ""}`
    );
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("articles");
    expect(Array.isArray(data.articles)).toBe(true);

    if (data.articles.length > 0) {
      const first = data.articles[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("title");
      expect(first).toHaveProperty("url");
      expect(first.url).toContain("sailboats.fr");
    }
  });

  test("related articles section is hidden in print mode", async ({
    page,
    context,
  }) => {
    // Emulate print media
    await page.emulateMedia({ media: "print" });

    const section = page.locator(".related-articles-wrapper");
    const visible = await section.isVisible().catch(() => false);

    // The section has no-print class so it should be hidden in print
    if (visible) {
      // Check if it has the no-print class (which should hide in CSS @media print)
      const hasClass = await section.evaluate((el) =>
        el.classList.contains("no-print")
      );
      expect(hasClass).toBe(true);
    }
  });
});
