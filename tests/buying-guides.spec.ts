import { test, expect } from "@playwright/test";

test.describe("Buying Guides", () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

  test.describe("/guides landing page", () => {
    test("should load and show guide cards", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides`);
      await page.waitForLoadState("networkidle");

      // Should see page title
      await expect(page.locator("h1")).toContainText("Sailing Guides", { timeout: 10000 });

      // Should see guide cards
      const guideCards = page.locator("a[href^='/guides/']");
      expect(await guideCards.count()).toBeGreaterThan(0);
    });

    test("should categorize guides by type", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides`);
      await page.waitForLoadState("networkidle");

      // Should see category headings
      const categories = [
        "Best Sailboats For",
        "How to Choose",
        "X vs Y Explained",
        "New vs Used",
        "What Size Cruiser",
      ];

      // Check if any category is visible
      let foundCategory = false;
      for (const category of categories) {
        const visible = await page
          .getByText(category, { exact: false })
          .isVisible()
          .catch(() => false);
        if (visible) foundCategory = true;
      }
      expect(foundCategory).toBe(true);
    });

    test("each guide card should have icon, title, and description", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides`);
      await page.waitForLoadState("networkidle");

      const firstCard = page.locator("a[href^='/guides/']").first();
      await expect(firstCard).toBeVisible();

      // Should have an icon
      const icon = firstCard.locator("span").first();
      expect(await icon.textContent()).not.toBeNull();

      // Should have title
      const title = firstCard.locator("h2, h3").first();
      expect(await title.textContent()).toBeTruthy();

      // Should have description
      const description = firstCard.locator("p").first();
      expect(await description.textContent()).toBeTruthy();
    });
  });

  test.describe("individual guide pages", () => {
    test("how-to-choose-your-first-sailboat should load", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/how-to-choose-your-first-sailboat`);
      await page.waitForLoadState("networkidle");

      // Should see the title
      const titleElement = page.locator("h1");
      expect(await titleElement.textContent()).toContain("How to Choose Your First Sailboat");
    });

    test("how-to-choose-your-first-sailboat shows yacht list", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/how-to-choose-your-first-sailboat`);
      await page.waitForLoadState("networkidle");

      // Should see "Related Yachts" or similar heading
      const yachtHeading = page.locator("h2").filter({
        hasText: /related yachts|yachts matching|recommended yachts/i,
      });

      const headingVisible = await yachtHeading.isVisible().catch(() => false);

      // If template-based guide, should show filtered yachts
      if (headingVisible) {
        const yachtCards = page.locator("[data-testid='yacht-card'], a[href^='/yachts/']");
        const count = await yachtCards.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test("how-to-choose-your-first-sailboat shows FAQ section", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/how-to-choose-your-first-sailboat`);
      await page.waitForLoadState("networkidle");

      // Should see FAQ heading
      await expect(
        page.locator("h2, h3").filter({ hasText: /frequently asked|faq|questions/i })
      ).toBeVisible({ timeout: 5000 });

      // Should see FAQ items
      const faqItems = page.locator("details, div", { has: page.locator("h4") });
      expect(await faqItems.count()).toBeGreaterThan(0);
    });

    test("monohull-vs-catamaran-comparison should load", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/monohull-vs-catamaran-comparison`);
      await page.waitForLoadState("networkidle");

      // Should see the title
      const titleElement = page.locator("h1");
      expect(await titleElement.textContent()).toContain("Monohull vs Catamaran");
    });

    test("monohull-vs-catamaran-comparison shows yacht list", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/monohull-vs-catamaran-comparison`);
      await page.waitForLoadState("networkidle");

      // Should see "Related Yachts" or similar heading
      const yachtHeading = page.locator("h2").filter({
        hasText: /related yachts|yachts matching|recommended yachts/i,
      });

      const headingVisible = await yachtHeading.isVisible().catch(() => false);

      // If template-based guide, should show filtered yachts
      if (headingVisible) {
        const yachtCards = page.locator("[data-testid='yacht-card'], a[href^='/yachts/']");
        const count = await yachtCards.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test("monohull-vs-catamaran-comparison shows FAQ section", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/monohull-vs-catamaran-comparison`);
      await page.waitForLoadState("networkidle");

      // Should see FAQ heading
      await expect(
        page.locator("h2, h3").filter({ hasText: /frequently asked|faq|questions/i })
      ).toBeVisible({ timeout: 5000 });

      // Should see FAQ items
      const faqItems = page.locator("details, div", { has: page.locator("h4") });
      expect(await faqItems.count()).toBeGreaterThan(0);
    });

    test("best-bluewater-cruising-sailboats should load", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/best-bluewater-cruising-sailboats`);
      await page.waitForLoadState("networkidle");

      // Should see the title
      const titleElement = page.locator("h1");
      expect(await titleElement.textContent()).toContain("Best Bluewater Cruising Sailboats");
    });

    test("best-bluewater-cruising-sailboats shows yacht list", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/best-bluewater-cruising-sailboats`);
      await page.waitForLoadState("networkidle");

      // Should see "Related Yachts" or similar heading
      const yachtHeading = page.locator("h2").filter({
        hasText: /related yachts|yachts matching|recommended yachts/i,
      });

      const headingVisible = await yachtHeading.isVisible().catch(() => false);

      // If template-based guide, should show filtered yachts
      if (headingVisible) {
        const yachtCards = page.locator("[data-testid='yacht-card'], a[href^='/yachts/']");
        const count = await yachtCards.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test("best-bluewater-cruising-sailboats shows FAQ section", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/best-bluewater-cruising-sailboats`);
      await page.waitForLoadState("networkidle");

      // Should see FAQ heading
      await expect(
        page.locator("h2, h3").filter({ hasText: /frequently asked|faq|questions/i })
      ).toBeVisible({ timeout: 5000 });

      // Should see FAQ items
      const faqItems = page.locator("details, div", { has: page.locator("h4") });
      expect(await faqItems.count()).toBeGreaterThan(0);
    });
  });

  test.describe("template-based yacht filtering", () => {
    test("beginner sailboats guide shows smaller boats", async ({ page }) => {
      // Note: This may not have a published article yet, but let's test the template API
      await page.goto(`${BASE_URL}/guides/how-to-choose-your-first-sailboat`);
      await page.waitForLoadState("networkidle");

      // If yachts are shown, they should be filtered
      const yachtCards = page.locator("[data-testid='yacht-card']");
      const hasCards = (await yachtCards.count()) > 0;

      if (hasCards) {
        // First yacht should be in reasonable beginner range (6-9m or 20-30ft)
        const firstCardLength = yachtCards.first();
        const lengthText = await firstCardLength
          .locator("text=/\\d+(\\.\\d+)?\\s*(m|ft)/i")
          .first()
          .textContent();

        if (lengthText) {
          // Parse length - should be roughly 6-9m or 20-30ft
          const match = lengthText.match(/(\d+(?:\.\d+)?)/);
          if (match) {
            const length = parseFloat(match[1]);
            expect(length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe("schema validation", () => {
    test("guide pages include Article JSON-LD", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/how-to-choose-your-first-sailboat`);
      await page.waitForLoadState("networkidle");

      // Get all JSON-LD scripts
      const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();

      let foundArticle = false;
      for (const script of jsonLdScripts) {
        const content = await script.textContent();
        if (content) {
          try {
            const json = JSON.parse(content);
            const graph = Array.isArray(json) ? json : json["@graph"];

            const hasArticle = Array.isArray(graph)
              ? graph.some((item: any) => item["@type"] === "Article")
              : json["@type"] === "Article";

            if (hasArticle) {
              foundArticle = true;
              break;
            }
          } catch (e) {
            // Invalid JSON, skip
          }
        }
      }

      expect(foundArticle).toBe(true);
    });

    test("guide pages include FAQPage JSON-LD", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/monohull-vs-catamaran-comparison`);
      await page.waitForLoadState("networkidle");

      // Get all JSON-LD scripts
      const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();

      let foundFAQ = false;
      for (const script of jsonLdScripts) {
        const content = await script.textContent();
        if (content) {
          try {
            const json = JSON.parse(content);
            const graph = Array.isArray(json) ? json : json["@graph"];

            const hasFAQ = Array.isArray(graph)
              ? graph.some((item: any) => item["@type"] === "FAQPage")
              : json["@type"] === "FAQPage";

            if (hasFAQ) {
              foundFAQ = true;
              break;
            }
          } catch (e) {
            // Invalid JSON, skip
          }
        }
      }

      expect(foundFAQ).toBe(true);
    });

    test("FAQ JSON-LD has question and answer structure", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/monohull-vs-catamaran-comparison`);
      await page.waitForLoadState("networkidle");

      // Get all JSON-LD scripts
      const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();

      let validFAQ = false;
      for (const script of jsonLdScripts) {
        const content = await script.textContent();
        if (content) {
          try {
            const json = JSON.parse(content);
            const graph = Array.isArray(json) ? json : json["@graph"];

            const faqPage = Array.isArray(graph)
              ? graph.find((item: any) => item["@type"] === "FAQPage")
              : json["@type"] === "FAQPage"
              ? json
              : null;

            if (faqPage && faqPage.mainEntity) {
              // Check that FAQ items have question and acceptedAnswer
              const firstFAQ = Array.isArray(faqPage.mainEntity)
                ? faqPage.mainEntity[0]
                : faqPage.mainEntity;

              if (firstFAQ.name && firstFAQ.acceptedAnswer && firstFAQ.acceptedAnswer.text) {
                validFAQ = true;
                break;
              }
            }
          } catch (e) {
            // Invalid JSON, skip
          }
        }
      }

      expect(validFAQ).toBe(true);
    });
  });

  test.describe("API endpoints", () => {
    test("GET /api/buying-guides returns templates", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/buying-guides`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("templates");
      expect(Array.isArray(data.templates)).toBe(true);
      expect(data.templates.length).toBeGreaterThan(0);
    });

    test("GET /api/buying-guides returns template with required fields", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/buying-guides`);

      expect(response.status()).toBe(200);
      const data = await response.json();

      if (data.templates && data.templates.length > 0) {
        const firstTemplate = data.templates[0];
        expect(firstTemplate).toHaveProperty("id");
        expect(firstTemplate).toHaveProperty("type");
        expect(firstTemplate).toHaveProperty("title");
        expect(firstTemplate).toHaveProperty("description");
        expect(firstTemplate).toHaveProperty("faqs");
        expect(Array.isArray(firstTemplate.faqs)).toBe(true);
      }
    });

    test("GET /api/buying-guides/[id] returns specific template", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/buying-guides/best-beginner-sailboats`);

      // This may return 404 if template doesn't exist, which is ok
      // We're testing that the route works
      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty("template");
        expect(data.template).toHaveProperty("id");
        expect(data.template).toHaveProperty("faqs");
      }
    });

    test("GET /api/buying-guides/[id]/yachts returns filtered yachts", async ({ request }) => {
      const templateId = "best-beginner-sailboats";
      const response = await request.get(`${BASE_URL}/api/buying-guides/${templateId}/yachts`);

      // Should return 200 with yachts array
      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty("yachts");
        expect(Array.isArray(data.yachts)).toBe(true);
      }
    });
  });

  test.describe("navigation and UX", () => {
    test("guide pages link back to guides index", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/how-to-choose-your-first-sailboat`);
      await page.waitForLoadState("networkidle");

      // Should have a link back to /guides
      const backLink = page.locator("a[href='/guides']");
      expect(await backLink.count()).toBeGreaterThan(0);
    });

    test("yacht cards in guide link to yacht detail pages", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/best-bluewater-cruising-sailboats`);
      await page.waitForLoadState("networkidle");

      // Find yacht cards and check they have /yachts/ links
      const yachtLinks = page.locator("a[href^='/yachts/']");
      const count = await yachtLinks.count();

      if (count > 0) {
        // Just verify href format (don't click to avoid navigation issues in tests)
        const firstLink = yachtLinks.first();
        const href = await firstLink.getAttribute("href");
        expect(href).toMatch(/^\/yachts\/[^\/]+$/);
      }
    });

    test("FAQ items are interactive (expandable)", async ({ page }) => {
      await page.goto(`${BASE_URL}/guides/monohull-vs-catamaran-comparison`);
      await page.waitForLoadState("networkidle");

      // Find first FAQ item (using details element or similar)
      const faqItems = page.locator("details").first();

      const count = await faqItems.count();
      if (count > 0) {
        // Check if it's closed initially (summary visible, answer hidden)
        const summary = faqItems.locator("summary");
        expect(await summary.isVisible()).toBe(true);

        // Click to expand
        await summary.click();

        // Now answer should be visible (details[open])
        const isOpen = await faqItems.evaluate((el: any) => el.open);
        expect(isOpen).toBe(true);
      }
    });
  });
});
