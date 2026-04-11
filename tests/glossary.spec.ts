import { test, expect } from "@playwright/test";

test.describe("Glossary Pages", () => {
  test("Glossary index page loads and displays all terms", async ({ page }) => {
    await page.goto("/glossary");

    // Check title
    await expect(page).toHaveTitle(/Sailing Glossary/);

    // Check heading
    await expect(page.locator("h1")).toContainText("Sailing Glossary");

    // Check term count is displayed
    await expect(page.locator("text=21 terms")).toBeVisible();

    // Check categories are displayed
    await expect(page.locator("text=Dimensions")).toBeVisible();
    await expect(page.locator("text=Technical")).toBeVisible();
    await expect(page.locator("text=Hull & Keel")).toBeVisible();
    await expect(page.locator("text=Rig & Sails")).toBeVisible();
    await expect(page.locator("text=Accommodation")).toBeVisible();
    await expect(page.locator("text=Sailing Types")).toBeVisible();

    // Check some key terms are displayed
    await expect(page.locator('a[href="/glossary/loa"]')).toBeVisible();
    await expect(page.locator('a[href="/glossary/beam"]')).toBeVisible();
    await expect(page.locator('a[href="/glossary/draft"]')).toBeVisible();
    await expect(page.locator('a[href="/glossary/ballast"]')).toBeVisible();
  });

  test("Glossary term page loads with correct content", async ({ page }) => {
    await page.goto("/glossary/loa");

    // Check title
    await expect(page).toHaveTitle(/LOA – Sailing Glossary/);

    // Check heading
    await expect(page.locator("h1")).toContainText("LOA");

    // Check category badge
    await expect(page.locator("text=Dimensions")).toBeVisible();

    // Check definition is displayed
    await expect(page.locator("text=Length Overall")).toBeVisible();
    await expect(page.locator("text=maximum length")).toBeVisible();

    // Check related terms section
    await expect(page.locator("h2:has-text('Related Terms')")).toBeVisible();

    // Check breadcrumb
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
    await expect(page.locator('nav a[href="/"]')).toContainText("Home");
    await expect(page.locator('nav a[href="/glossary"]')).toContainText("Glossary");

    // Check "View All Glossary Terms" button
    await expect(page.locator('a[href="/glossary"]')).toContainText("View All Glossary Terms");
  });

  test("Glossary term page shows aliases", async ({ page }) => {
    await page.goto("/glossary/loa");

    // LOA should have aliases
    await expect(page.locator("text=Also known as:")).toBeVisible();
    await expect(page.locator("text=Length Overall")).toBeVisible();
    await expect(page.locator("text=overall length")).toBeVisible();
  });

  test("Glossary term page links to related terms", async ({ page }) => {
    await page.goto("/glossary/loa");

    // Click on a related term
    await page.click('a[href="/glossary/lwl"]');

    // Should navigate to LWL page
    await expect(page).toHaveURL(/\/glossary\/lwl/);
    await expect(page.locator("h1")).toContainText("LWL");
    await expect(page.locator("text=Length at Waterline")).toBeVisible();
  });

  test("Glossary term page handles 404 for non-existent slug", async ({ page }) => {
    await page.goto("/glossary/non-existent-term");

    // Should show 404 page
    await expect(page.locator("text=not found")).toBeVisible();
  });

  test("Category filter anchors work", async ({ page }) => {
    await page.goto("/glossary");

    // Click on a category filter link
    await page.click('a[href="#category-dimensions"]');

    // Should scroll to Dimensions section
    const dimensionsSection = page.locator("#category-dimensions");
    await expect(dimensionsSection).toBeVisible();
  });

  test("Glossary pages have correct JSON-LD structured data", async ({ page }) => {
    await page.goto("/glossary");

    // Get JSON-LD scripts
    const scripts = await page.locator('script[type="application/ld+json"]').all();

    let foundCollectionLd = false;
    for (const script of scripts) {
      const content = await script.textContent();
      if (content && content.includes("CollectionPage")) {
        foundCollectionLd = true;
        const jsonLd = JSON.parse(content);
        expect(jsonLd["@type"]).toBe("CollectionPage");
        expect(jsonLd.name).toBe("Sailing Glossary");
        expect(jsonLd.itemListElement).toBeDefined();
        expect(jsonLd.itemListElement.length).toBeGreaterThan(0);
      }
    }

    expect(foundCollectionLd).toBe(true);
  });

  test("Glossary term page has Article JSON-LD", async ({ page }) => {
    await page.goto("/glossary/loa");

    // Get JSON-LD scripts
    const scripts = await page.locator('script[type="application/ld+json"]').all();

    let foundArticleLd = false;
    for (const script of scripts) {
      const content = await script.textContent();
      if (content && content.includes("Article")) {
        foundArticleLd = true;
        const jsonLd = JSON.parse(content);
        expect(jsonLd["@type"]).toBe("Article");
        expect(jsonLd.headline).toContain("LOA");
        expect(jsonLd.isAccessibleForFree).toBe(true);
      }
    }

    expect(foundArticleLd).toBe(true);
  });

  test("Glossary index page CTA links work", async ({ page }) => {
    await page.goto("/glossary");

    // Click "Browse Guides" button
    await page.click('a[href="/guides"]');

    // Should navigate to guides
    await expect(page).toHaveURL(/\/guides/);

    // Go back
    await page.goBack();
    await page.waitForURL(/\/glossary/);

    // Click "Browse Yachts" button
    await page.click('a[href="/yachts"]');

    // Should navigate to yachts
    await expect(page).toHaveURL(/\/yachts/);
  });

  test("Header navigation includes Glossary link", async ({ page }) => {
    await page.goto("/");

    // Check for Glossary link in header (desktop)
    await expect(page.locator('nav:has-text("Glossary")')).toBeVisible();

    // Click Glossary link
    await page.click('nav a[href="/glossary"]');

    // Should navigate to glossary
    await expect(page).toHaveURL(/\/glossary/);
  });

  test("Mobile menu includes Glossary link", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 375, height: 667 });

    // Open mobile menu
    await page.click("#mobile-menu-btn");

    // Check for Glossary link in mobile menu
    await expect(page.locator('#mobile-menu-panel a[href="/glossary"]')).toBeVisible();
  });
});

test.describe("Glossary Auto-Linking", () => {
  test("Yacht detail page should have glossary-ready content", async ({ page }) => {
    // Go to a yacht detail page
    await page.goto("/yachts/beneteau-oceanis-34-1");

    // Check that spec sections are visible (these would have terms that could be auto-linked)
    await expect(page.locator("text=Dimensions")).toBeVisible();
    await expect(page.locator("text=Technical")).toBeVisible();
  });

  test("Glossary links have correct styling", async ({ page }) => {
    await page.goto("/glossary/loa");

    // Check that glossary links in related terms have hover state
    const relatedLink = page.locator('a[href="/glossary/lwl"]').first();
    await expect(relatedLink).toBeVisible();

    // Check link has correct class
    const className = await relatedLink.getAttribute("class");
    expect(className).toContain("hover:text-blue-600");
  });
});
