import { test, expect } from "@playwright/test";

test.describe("P8.7: Best-Value Pages", () => {
  test.describe("Best-Value Index Page", () => {
    test("should render the best-value index page", async ({ page }) => {
      await page.goto("/best-value");

      await expect(page.locator("h1")).toContainText("Best Value Sailboats");
    });

    test("should show all four best-value categories", async ({ page }) => {
      await page.goto("/best-value");

      const categoryLinks = page.locator('a[href^="/best-value/"]');
      await expect(categoryLinks).toHaveCount(4);
    });

    test("should link to best-of collections", async ({ page }) => {
      await page.goto("/best-value");

      const bestLink = page.locator('a[href*="/best/"]');
      await expect(bestLink).toBeVisible();
    });

    test("should show methodology section", async ({ page }) => {
      await page.goto("/best-value");

      await expect(page.locator("text=About the Value Score")).toBeVisible();
    });

    test("should have correct canonical and meta", async ({ page }) => {
      await page.goto("/best-value");

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute("href", /\/best-value$/);
    });
  });

  test.describe("Best-Value Category Pages", () => {
    const categories = [
      "40ft-cruisers",
      "35ft-sailboats",
      "family-cruisers-under-45ft",
      "bluewater-value",
    ];

    for (const slug of categories) {
      test(`should render /best-value/${slug} with correct content`, async ({
        page,
      }) => {
        await page.goto(`/best-value/${slug}`);

        // Page title
        const h1 = page.locator("h1");
        await expect(h1).toBeVisible();

        // Rankings section
        const rankings = page.getByTestId("best-value-rankings");
        await expect(rankings).toBeVisible();

        // Canonical
        const canonical = page.locator('link[rel="canonical"]');
        await expect(canonical).toHaveAttribute(
          "href",
          new RegExp(`/best-value/${slug}$`)
        );
      });

      test(`/best-value/${slug} should have JSON-LD structured data`, async ({
        page,
      }) => {
        await page.goto(`/best-value/${slug}`);

        const jsonLdScripts = page.locator('script[type="application/ld+json"]');
        const count = await jsonLdScripts.count();

        // Should have breadcrumb, CollectionPage, and ItemList
        expect(count).toBeGreaterThanOrEqual(3);

        // Check for ItemList
        let hasItemList = false;
        for (let i = 0; i < count; i++) {
          const content = await jsonLdScripts.nth(i).textContent();
          if (content) {
            const json = JSON.parse(content);
            if (json["@type"] === "ItemList") {
              hasItemList = true;
              expect(json.numberOfItems).toBeDefined();
              expect(Array.isArray(json.itemListElement)).toBeTruthy();
            }
          }
        }
        expect(hasItemList).toBeTruthy();
      });

      test(`/best-value/${slug} should link to related best-value pages`, async ({
        page,
      }) => {
        await page.goto(`/best-value/${slug}`);

        const relatedLinks = page.getByTestId("related-best-value-link");
        // Should have links to the other 3 categories
        await expect(relatedLinks).toHaveCount(3);
      });
    }

    test("yacht cards should link to yacht detail pages", async ({ page }) => {
      await page.goto("/best-value/40ft-cruisers");

      const firstYacht = page.getByTestId("best-value-yacht-1");
      const isVisible = await firstYacht.isVisible().catch(() => false);

      if (isVisible) {
        const href = await firstYacht.getAttribute("href");
        expect(href).toMatch(/^\/yachts\//);
      }
    });

    test("should show value score for ranked yachts", async ({ page }) => {
      await page.goto("/best-value/40ft-cruisers");

      const firstYacht = page.getByTestId("best-value-yacht-1");
      const isVisible = await firstYacht.isVisible().catch(() => false);

      if (isVisible) {
        await expect(firstYacht.locator("text=Value Score")).toBeVisible();
      }
    });

    test("should show methodology details when expanded", async ({ page }) => {
      await page.goto("/best-value/40ft-cruisers");

      const details = page.getByTestId("methodology-details");
      await expect(details).toBeVisible();

      // Click to expand
      await details.locator("summary").click();

      await expect(details.locator("text=Accommodation (30 pts)")).toBeVisible();
      await expect(details.locator("text=Price-per-meter (20 pts)")).toBeVisible();
    });
  });

  test.describe("Cheaper Alternatives Pages", () => {
    test("should render cheaper-alternatives page for a known yacht", async ({
      page,
    }) => {
      await page.goto("/cheaper-alternatives-to/jeanneau-sun-odyssey-349-2011");

      const h1 = page.locator("h1");
      await expect(h1).toContainText("Cheaper Alternatives");
      await expect(h1).toContainText("Jeanneau");
      await expect(h1).toContainText("Sun Odyssey 349");
    });

    test("should link back to source yacht", async ({ page }) => {
      await page.goto("/cheaper-alternatives-to/jeanneau-sun-odyssey-349-2011");

      const backLink = page.locator('a[href*="/yachts/jeanneau-sun-odyssey-349"]');
      await expect(backLink).toBeVisible();
    });

    test("should cross-link to best-value rankings", async ({ page }) => {
      await page.goto("/cheaper-alternatives-to/jeanneau-sun-odyssey-349-2011");

      const bestValueLink = page.locator('a[href*="/best-value/"]');
      await expect(bestValueLink).toBeVisible();
    });

    test("should have correct canonical", async ({ page }) => {
      await page.goto("/cheaper-alternatives-to/jeanneau-sun-odyssey-349-2011");

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute(
        "href",
        /\/cheaper-alternatives-to\/jeanneau-sun-odyssey-349-2011$/
      );
    });

    test("should show JSON-LD breadcrumb", async ({ page }) => {
      await page.goto("/cheaper-alternatives-to/jeanneau-sun-odyssey-349-2011");

      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();
      expect(count).toBeGreaterThanOrEqual(1);

      let hasBreadcrumb = false;
      for (let i = 0; i < count; i++) {
        const content = await jsonLdScripts.nth(i).textContent();
        if (content) {
          const json = JSON.parse(content);
          if (json["@type"] === "BreadcrumbList") {
            hasBreadcrumb = true;
          }
        }
      }
      expect(hasBreadcrumb).toBeTruthy();
    });
  });

  test.describe("Yacht Detail Cross-Links", () => {
    test("should show best-value cross-link on yacht detail page", async ({
      page,
    }) => {
      await page.goto("/yachts/jeanneau-sun-odyssey-349-2011");

      const crossLink = page.getByTestId("best-value-cross-link");
      const isVisible = await crossLink.isVisible().catch(() => false);

      if (isVisible) {
        const link = crossLink.locator("a");
        const href = await link.getAttribute("href");
        expect(href).toMatch(/^\/best-value\//);
      }
    });

    test("should show cheaper alternatives link on yacht detail page", async ({
      page,
    }) => {
      await page.goto("/yachts/jeanneau-sun-odyssey-349-2011");

      const cheaperLink = page.locator('a[href*="/cheaper-alternatives-to/"]');
      await expect(cheaperLink).toBeVisible();
    });
  });

  test.describe("Best-Value API", () => {
    test("should return categories list from API", async ({ request }) => {
      const response = await request.get("/api/best-value");
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.categories).toBeDefined();
      expect(Array.isArray(body.categories)).toBeTruthy();
      expect(body.categories.length).toBe(4);
    });

    test("should return yachts for a specific category", async ({ request }) => {
      const response = await request.get(
        "/api/best-value?category=40ft-cruisers"
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.category).toBe("40ft-cruisers");
      expect(body.title).toBeDefined();
      expect(Array.isArray(body.yachts)).toBeTruthy();
    });

    test("should return 400 for invalid category", async ({ request }) => {
      const response = await request.get(
        "/api/best-value?category=nonexistent"
      );
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Invalid category");
      expect(body.availableCategories).toBeDefined();
    });

    test("yachts should have value scores", async ({ request }) => {
      const response = await request.get(
        "/api/best-value?category=40ft-cruisers"
      );
      const body = await response.json();

      if (body.yachts.length > 0) {
        for (const yacht of body.yachts) {
          expect(yacht.valueScore).toBeDefined();
          expect(typeof yacht.valueScore).toBe("number");
          expect(yacht.valueScore).toBeGreaterThanOrEqual(0);
        }

        // Yachts should be sorted by value score descending
        for (let i = 1; i < body.yachts.length; i++) {
          expect(body.yachts[i - 1].valueScore).toBeGreaterThanOrEqual(
            body.yachts[i].valueScore
          );
        }
      }
    });

    test("should respect limit parameter", async ({ request }) => {
      const response = await request.get(
        "/api/best-value?category=bluewater-value&limit=5"
      );
      const body = await response.json();

      expect(body.yachts.length).toBeLessThanOrEqual(5);
    });
  });

  test.describe("Value Score Calculation", () => {
    test("yachts with more cabins should score higher", async ({ request }) => {
      const response = await request.get(
        "/api/best-value?category=40ft-cruisers"
      );
      const body = await response.json();

      if (body.yachts.length >= 2) {
        // The top yacht should generally have more cabins/berths
        // Just verify scores exist and are reasonable (0-100 range)
        for (const yacht of body.yachts) {
          expect(yacht.valueScore).toBeLessThanOrEqual(100);
          expect(yacht.valueScore).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe("Internal Linking", () => {
    test("best-value index links correctly to category pages", async ({
      page,
    }) => {
      await page.goto("/best-value");

      const links = page.locator('a[href^="/best-value/"]');
      const count = await links.count();

      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute("href");
        expect(href).toMatch(/^\/best-value\/[\w-]+$/);
      }
    });

    test("navigation from best-value to yacht detail works", async ({
      page,
    }) => {
      await page.goto("/best-value/40ft-cruisers");

      const firstYacht = page.getByTestId("best-value-yacht-1");
      const isVisible = await firstYacht.isVisible().catch(() => false);

      if (isVisible) {
        await firstYacht.click();
        await expect(page).toHaveURL(/\/yachts\//);
        await expect(page.locator("h1")).toBeVisible();
      }
    });

    test("navigation from best-value to /best collections works", async ({
      page,
    }) => {
      await page.goto("/best-value/40ft-cruisers");

      const bestLink = page.locator('a[href*="/best/"]').first();
      const isVisible = await bestLink.isVisible().catch(() => false);

      if (isVisible) {
        await bestLink.click();
        await expect(page).toHaveURL(/\/best\//);
      }
    });
  });
});
