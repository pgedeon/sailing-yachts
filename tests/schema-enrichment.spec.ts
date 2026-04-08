import { test, expect } from "@playwright/test";

/**
 * P6.5: Schema enrichment tests
 *
 * Validates that CollectionPage, ItemList, BreadcrumbList, ImageObject,
 * and other structured data are correctly rendered on public pages.
 */

/* ------------------------------------------------------------------ */
/*  Helper: extract all JSON-LD scripts from a page                   */
/* ------------------------------------------------------------------ */
async function getJsonLdScripts(page: import("@playwright/test").Page) {
  const scripts = page.locator('script[type="application/ld+json"]');
  const count = await scripts.count();
  const results: Record<string, any>[] = [];
  for (let i = 0; i < count; i++) {
    const content = await scripts.nth(i).textContent();
    if (content) {
      try {
        results.push(JSON.parse(content));
      } catch {}
    }
  }
  return results;
}

function findJsonLdByType(scripts: Record<string, any>[], type: string) {
  return scripts.find((s) => s["@type"] === type);
}

/* ------------------------------------------------------------------ */
/*  Browse Yachts page (/yachts)                                      */
/* ------------------------------------------------------------------ */
test.describe("Schema — /yachts browse page", () => {
  test("has BreadcrumbList JSON-LD", async ({ page }) => {
    await page.goto("/yachts");
    const scripts = await getJsonLdScripts(page);
    const breadcrumb = findJsonLdByType(scripts, "BreadcrumbList");
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb!.itemListElement.length).toBeGreaterThanOrEqual(2);
    expect(breadcrumb!.itemListElement[0].name).toBe("Home");
  });

  test("has CollectionPage JSON-LD", async ({ page }) => {
    await page.goto("/yachts");
    const scripts = await getJsonLdScripts(page);
    const collection = findJsonLdByType(scripts, "CollectionPage");
    expect(collection).toBeDefined();
    expect(collection!.name).toContain("Browse");
    expect(collection!.url).toContain("/yachts");
  });
});

/* ------------------------------------------------------------------ */
/*  Manufacturers list page (/manufacturers)                          */
/* ------------------------------------------------------------------ */
test.describe("Schema — /manufacturers list page", () => {
  test("has BreadcrumbList JSON-LD", async ({ page }) => {
    await page.goto("/manufacturers");
    const scripts = await getJsonLdScripts(page);
    const breadcrumb = findJsonLdByType(scripts, "BreadcrumbList");
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb!.itemListElement.length).toBeGreaterThanOrEqual(2);
  });

  test("has CollectionPage JSON-LD", async ({ page }) => {
    await page.goto("/manufacturers");
    const scripts = await getJsonLdScripts(page);
    const collection = findJsonLdByType(scripts, "CollectionPage");
    expect(collection).toBeDefined();
    expect(collection!.name).toContain("Manufacturers");
    expect(collection!.url).toContain("/manufacturers");
  });

  test("has ItemList JSON-LD", async ({ page }) => {
    await page.goto("/manufacturers");
    const scripts = await getJsonLdScripts(page);
    const itemList = findJsonLdByType(scripts, "ItemList");
    expect(itemList).toBeDefined();
    expect(itemList!.itemListElement.length).toBeGreaterThan(0);
    expect(itemList!.itemListElement[0].url).toContain("/manufacturers/");
  });
});

/* ------------------------------------------------------------------ */
/*  Manufacturer detail page (/manufacturers/[slug])                  */
/* ------------------------------------------------------------------ */
test.describe("Schema — manufacturer detail page", () => {
  test("has BreadcrumbList, CollectionPage, and ItemList", async ({ page }) => {
    await page.goto("/manufacturers");
    const firstLink = page.locator('a[href^="/manufacturers/"]').first();
    if ((await firstLink.count()) === 0) return test.skip();
    const href = await firstLink.getAttribute("href");
    await page.goto(href!);

    const scripts = await getJsonLdScripts(page);

    const breadcrumb = findJsonLdByType(scripts, "BreadcrumbList");
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb!.itemListElement.length).toBeGreaterThanOrEqual(3);

    const collection = findJsonLdByType(scripts, "CollectionPage");
    expect(collection).toBeDefined();
    expect(collection!.name).toContain("Yachts");

    const itemList = findJsonLdByType(scripts, "ItemList");
    expect(itemList).toBeDefined();
    expect(itemList!.itemListElement.length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/*  Compare page (/compare)                                           */
/* ------------------------------------------------------------------ */
test.describe("Schema — /compare page", () => {
  test("has BreadcrumbList JSON-LD", async ({ page }) => {
    await page.goto("/compare");
    const scripts = await getJsonLdScripts(page);
    const breadcrumb = findJsonLdByType(scripts, "BreadcrumbList");
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb!.itemListElement[0].name).toBe("Home");
    expect(
      breadcrumb!.itemListElement.some(
        (el: any) => el.name === "Compare Yachts"
      )
    ).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  Search page (/search)                                             */
/* ------------------------------------------------------------------ */
test.describe("Schema — /search page", () => {
  test("has BreadcrumbList JSON-LD", async ({ page }) => {
    await page.goto("/search");
    const scripts = await getJsonLdScripts(page);
    const breadcrumb = findJsonLdByType(scripts, "BreadcrumbList");
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb!.itemListElement[0].name).toBe("Home");
  });
});

/* ------------------------------------------------------------------ */
/*  Yacht detail page (/yachts/[slug]) — ImageObject                  */
/* ------------------------------------------------------------------ */
test.describe("Schema — yacht detail page ImageObject", () => {
  test("has ImageObject JSON-LD when image exists", async ({ page }) => {
    await page.goto("/yachts");
    const firstLink = page.locator('a[href^="/yachts/"]').first();
    if ((await firstLink.count()) === 0) return test.skip();
    await firstLink.click();
    await page.waitForLoadState("networkidle");

    const scripts = await getJsonLdScripts(page);

    // ImageObject is only present if the yacht has a primary image
    const imageObj = findJsonLdByType(scripts, "ImageObject");
    if (imageObj) {
      expect(imageObj.contentUrl).toBeTruthy();
      expect(imageObj.name).toBeTruthy();
    }

    // Either way, Product and BreadcrumbList should exist
    const product = findJsonLdByType(scripts, "Product");
    expect(product).toBeDefined();
    expect(product!.brand).toBeDefined();

    const breadcrumb = findJsonLdByType(scripts, "BreadcrumbList");
    expect(breadcrumb).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/*  Homepage — WebSite + FAQPage                                      */
/* ------------------------------------------------------------------ */
test.describe("Schema — homepage", () => {
  test("has WebSite and FAQPage JSON-LD", async ({ page }) => {
    await page.goto("/");
    const scripts = await getJsonLdScripts(page);

    const website = findJsonLdByType(scripts, "WebSite");
    expect(website).toBeDefined();
    expect(website!.potentialAction).toBeDefined();
    expect(website!.potentialAction["@type"]).toBe("SearchAction");

    const faq = findJsonLdByType(scripts, "FAQPage");
    // FAQPage is optional — homepage may or may not have FAQ
    if (faq) {
      expect(faq.mainEntity.length).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Landing pages (/best/[slug]) — CollectionPage + ItemList          */
/* ------------------------------------------------------------------ */
test.describe("Schema — landing pages", () => {
  test("best page has CollectionPage and BreadcrumbList", async ({ page }) => {
    // Navigate to a known landing page
    const resp = await page.goto("/best/40-foot-cruising-sailboats");
    if (!resp || resp.status() === 404) return test.skip();

    const scripts = await getJsonLdScripts(page);

    const collection = findJsonLdByType(scripts, "CollectionPage");
    expect(collection).toBeDefined();

    const breadcrumb = findJsonLdByType(scripts, "BreadcrumbList");
    expect(breadcrumb).toBeDefined();
  });
});
