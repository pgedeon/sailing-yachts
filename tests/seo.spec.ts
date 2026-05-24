import { test, expect } from "@playwright/test";

test.describe("SEO — Homepage", () => {
  test("has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Sailing Yacht Info/);
  });

  test("has meta description", async ({ page }) => {
    await page.goto("/");
    const desc = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(desc).toContain("sailing yacht specifications");
  });

  test("has Open Graph tags", async ({ page }) => {
    await page.goto("/");
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toContain("Sailing Yacht Info");

    const ogType = await page
      .locator('meta[property="og:type"]')
      .getAttribute("content");
    expect(ogType).toBe("website");
  });

  test("has Twitter card tags", async ({ page }) => {
    await page.goto("/");
    const card = await page
      .locator('meta[name="twitter:card"]')
      .getAttribute("content");
    expect(card).toBeTruthy();
  });

  test("has JSON-LD structured data", async ({ page }) => {
    await page.goto("/");
    const script = page.locator('script[type="application/ld+json"]');
    const count = await script.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const content = await script.first().textContent();
    const json = JSON.parse(content!);
    expect(json["@type"]).toBe("WebSite");
    expect(json.name).toContain("Sailing Yacht Info");
    expect(json.potentialAction).toBeDefined();
  });
});

test.describe("SEO — Yacht Detail Page", () => {
  test("has dynamic title with yacht name", async ({ page }) => {
    // Navigate to any yacht detail page (first from the list)
    await page.goto("/yachts");
    const firstLink = page.locator('a[href^="/yachts/"]').first();
    if ((await firstLink.count()) === 0) return; // skip if no yachts
    const href = await firstLink.getAttribute("href");
    await page.goto(href!);

    const title = await page.title();
    expect(title).toMatch(/.*\| Sailing Yacht Info/);
  });

  test("has Product JSON-LD", async ({ page }) => {
    await page.goto("/yachts");
    const firstLink = page.locator('a[href^="/yachts/"]').first();
    if ((await firstLink.count()) === 0) return;
    await firstLink.click();
    await page.waitForLoadState("networkidle");

    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // At least one should be Product
    let foundProduct = false;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      const json = JSON.parse(content!);
      if (json["@type"] === "Product") {
        foundProduct = true;
        expect(json.name).toBeTruthy();
        expect(json.brand).toBeDefined();
      }
    }
    expect(foundProduct).toBe(true);
  });

  test("has BreadcrumbList JSON-LD", async ({ page }) => {
    await page.goto("/yachts");
    const firstLink = page.locator('a[href^="/yachts/"]').first();
    if ((await firstLink.count()) === 0) return;
    await firstLink.click();
    await page.waitForLoadState("networkidle");

    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();

    let foundBreadcrumb = false;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      const json = JSON.parse(content!);
      if (json["@type"] === "BreadcrumbList") {
        foundBreadcrumb = true;
        expect(json.itemListElement.length).toBeGreaterThanOrEqual(2);
      }
    }
    expect(foundBreadcrumb).toBe(true);
  });
});

test.describe("SEO — Browse Yachts", () => {
  test("has correct metadata", async ({ page }) => {
    await page.goto("/yachts");
    const title = await page.title();
    expect(title).toContain("Browse");
    expect(title).toContain("Sailing Yacht Info");

    const desc = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(desc).toContain("sailing yacht");
  });
});

test.describe("SEO — Sitemap & Robots", () => {
  test("/sitemap.xml returns valid XML", async ({ page }) => {
    const resp = await page.goto("/sitemap.xml");
    expect(resp!.status()).toBe(200);
    const ct = resp!.headers()["content-type"];
    expect(ct).toContain("xml");

    const content = await page.content();
    expect(content).toContain("<urlset");
    expect(content).toContain("<loc>");
  });

  test("/robots.txt is valid", async ({ page }) => {
    const resp = await page.goto("/robots.txt");
    expect(resp!.status()).toBe(200);
    const body = await resp!.text();
    expect(body).toContain("User-agent:");
    expect(body).toContain("Allow:");
    expect(body).toContain("Sitemap:");
  });
});

test.describe("SEO — Open Graph Images", () => {
  test("homepage has og:image", async ({ page }) => {
    await page.goto("/");
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("/api/og");

    const twitterImage = await page
      .locator('meta[name="twitter:image"]')
      .getAttribute("content");
    expect(twitterImage).toContain("/api/og");
  });

  test("yachts listing has og:image", async ({ page }) => {
    await page.goto("/yachts");
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("/api/og");

    const card = await page
      .locator('meta[name="twitter:card"]')
      .getAttribute("content");
    expect(card).toBe("summary_large_image");
  });

  test("compare page has og:image", async ({ page }) => {
    await page.goto("/compare");
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("/api/og");
    expect(ogImage).toContain("compare");
  });

  test("search page has og:image", async ({ page }) => {
    await page.goto("/search");
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("/api/og");
  });

  test("guides page has og:image", async ({ page }) => {
    await page.goto("/guides");
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("/api/og");
  });

  test("glossary page has og:image", async ({ page }) => {
    await page.goto("/glossary");
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("/api/og");
  });

  test("manufacturers listing has og:image", async ({ page }) => {
    await page.goto("/manufacturers");
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toBeTruthy();
  });
});
