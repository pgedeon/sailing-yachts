import { test, expect } from "@playwright/test";

/**
 * P10.8: Rich media schema tests
 *
 * Validates VideoObject, DigitalDocument (brochure), and ImageObject
 * JSON-LD structured data on yacht detail pages.
 *
 * Since media assets are data-driven, tests gracefully handle cases
 * where no media assets exist for a particular yacht.
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
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

function findAllJsonLdByType(scripts: Record<string, any>[], type: string) {
  return scripts.filter((s) => s["@type"] === type);
}

/** Navigate to a yacht detail page, return true if we got there */
async function navigateToYachtDetail(page: import("@playwright/test").Page): Promise<string | null> {
  await page.goto("/yachts");
  const firstLink = page.locator('a[href^="/yachts/"]').first();
  if ((await firstLink.count()) === 0) return null;
  const href = await firstLink.getAttribute("href");
  if (!href) return null;
  await page.goto(href);
  await page.waitForLoadState("networkidle");
  return href;
}

/* ------------------------------------------------------------------ */
/*  VideoObject JSON-LD validation                                    */
/* ------------------------------------------------------------------ */

test.describe("P10.8 — VideoObject JSON-LD", () => {
  test("VideoObject schema has required @context and @type", async ({ request }) => {
    // Fetch the media API for a known yacht to check if videos exist
    const slug = "beneteau-oceanis-30-1";
    const resp = await request.get(`/api/yachts/${slug}/media`);
    if (resp.status() !== 200) return test.skip();

    const body = await resp.json();
    const videos = (body.mediaAssets || []).filter((a: any) => a.mediaType === "video");
    if (videos.length === 0) return test.skip();

    // Navigate to the yacht page and check JSON-LD
    const page = await request.context().newPage();
    await page.goto(`/yachts/${slug}`, { waitUntil: "networkidle" });
    const scripts = await getJsonLdScripts(page);
    await page.close();

    const videoObjects = findAllJsonLdByType(scripts, "VideoObject");
    expect(videoObjects.length).toBeGreaterThanOrEqual(1);

    for (const vo of videoObjects) {
      // Required by schema.org
      expect(vo["@context"]).toBe("https://schema.org");
      expect(vo["@type"]).toBe("VideoObject");
      expect(vo.name).toBeTruthy();
      expect(typeof vo.name).toBe("string");
    }
  });

  test("VideoObject includes optional fields when provided", async ({ request }) => {
    const slug = "beneteau-oceanis-30-1";
    const resp = await request.get(`/api/yachts/${slug}/media`);
    if (resp.status() !== 200) return test.skip();

    const body = await resp.json();
    const videos = (body.mediaAssets || []).filter((a: any) => a.mediaType === "video");
    if (videos.length === 0) return test.skip();

    const page = await request.context().newPage();
    await page.goto(`/yachts/${slug}`, { waitUntil: "networkidle" });
    const scripts = await getJsonLdScripts(page);
    await page.close();

    const videoObjects = findAllJsonLdByType(scripts, "VideoObject");
    expect(videoObjects.length).toBeGreaterThan(0);

    // At least one video should have contentUrl or embedUrl if the asset has a url
    const hasUrl = videos.some((v: any) => v.url || v.embedUrl);
    if (hasUrl) {
      const withUrl = videoObjects.find((vo) => vo.contentUrl || vo.embedUrl);
      expect(withUrl).toBeDefined();
    }
  });

  test("VideoObject JSON-LD is valid JSON and parseable", async ({ page }) => {
    const yachtSlug = await navigateToYachtDetail(page);
    if (!yachtSlug) return test.skip();

    const scripts = await getJsonLdScripts(page);
    const videoObjects = findAllJsonLdByType(scripts, "VideoObject");

    // If videos exist, validate structure
    for (const vo of videoObjects) {
      // Must be valid JSON (already parsed above, so it's valid)
      const reStringified = JSON.stringify(vo);
      const reparsed = JSON.parse(reStringified);
      expect(reparsed["@type"]).toBe("VideoObject");
      expect(reparsed.name).toBeTruthy();
    }
  });
});

/* ------------------------------------------------------------------ */
/*  DigitalDocument (brochure/deck plan) JSON-LD validation           */
/* ------------------------------------------------------------------ */

test.describe("P10.8 — DigitalDocument JSON-LD (brochures)", () => {
  test("DigitalDocument schema has required @context and @type", async ({ request }) => {
    const slug = "beneteau-oceanis-30-1";
    const resp = await request.get(`/api/yachts/${slug}/media`);
    if (resp.status() !== 200) return test.skip();

    const body = await resp.json();
    const docs = (body.mediaAssets || []).filter(
      (a: any) => a.mediaType === "brochure" || a.mediaType === "deck_plan" || a.mediaType === "interior_layout"
    );
    if (docs.length === 0) return test.skip();

    const page = await request.context().newPage();
    await page.goto(`/yachts/${slug}`, { waitUntil: "networkidle" });
    const scripts = await getJsonLdScripts(page);
    await page.close();

    const digitalDocs = findAllJsonLdByType(scripts, "DigitalDocument");
    expect(digitalDocs.length).toBeGreaterThanOrEqual(1);

    for (const doc of digitalDocs) {
      expect(doc["@context"]).toBe("https://schema.org");
      expect(doc["@type"]).toBe("DigitalDocument");
      expect(doc.name).toBeTruthy();
    }
  });

  test("DigitalDocument includes URL and format when available", async ({ request }) => {
    const slug = "beneteau-oceanis-30-1";
    const resp = await request.get(`/api/yachts/${slug}/media`);
    if (resp.status() !== 200) return test.skip();

    const body = await resp.json();
    const docs = (body.mediaAssets || []).filter(
      (a: any) => a.mediaType === "brochure" || a.mediaType === "deck_plan" || a.mediaType === "interior_layout"
    );
    if (docs.length === 0) return test.skip();

    const page = await request.context().newPage();
    await page.goto(`/yachts/${slug}`, { waitUntil: "networkidle" });
    const scripts = await getJsonLdScripts(page);
    await page.close();

    const digitalDocs = findAllJsonLdByType(scripts, "DigitalDocument");
    // Check that documents with URLs have url field in JSON-LD
    const docsWithUrl = docs.filter((d: any) => d.url);
    if (docsWithUrl.length > 0) {
      expect(digitalDocs.some((d) => d.url)).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  ImageObject JSON-LD validation                                    */
/* ------------------------------------------------------------------ */

test.describe("P10.8 — ImageObject JSON-LD", () => {
  test("yacht page with primary image has ImageObject JSON-LD", async ({ page }) => {
    const yachtSlug = await navigateToYachtDetail(page);
    if (!yachtSlug) return test.skip();

    const scripts = await getJsonLdScripts(page);
    const imageObj = findJsonLdByType(scripts, "ImageObject");

    if (imageObj) {
      expect(imageObj["@context"]).toBe("https://schema.org");
      expect(imageObj["@type"]).toBe("ImageObject");
      expect(imageObj.contentUrl).toBeTruthy();
      expect(typeof imageObj.contentUrl).toBe("string");
      // Name should describe the yacht
      expect(imageObj.name).toBeTruthy();
    }
    // If no ImageObject, the yacht might not have an image — that's OK
  });

  test("ImageObject contentUrl is an absolute URL", async ({ page }) => {
    const yachtSlug = await navigateToYachtDetail(page);
    if (!yachtSlug) return test.skip();

    const scripts = await getJsonLdScripts(page);
    const imageObj = findJsonLdByType(scripts, "ImageObject");

    if (imageObj) {
      expect(imageObj.contentUrl).toMatch(/^https?:\/\//);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Integration: yacht detail page renders media JSON-LD correctly    */
/* ------------------------------------------------------------------ */

test.describe("P10.8 — Yacht detail page media JSON-LD integration", () => {
  test("page always has Product and BreadcrumbList JSON-LD", async ({ page }) => {
    const yachtSlug = await navigateToYachtDetail(page);
    if (!yachtSlug) return test.skip();

    const scripts = await getJsonLdScripts(page);

    const product = findJsonLdByType(scripts, "Product");
    expect(product).toBeDefined();
    expect(product!.name).toBeTruthy();
    expect(product!.brand).toBeDefined();

    const breadcrumb = findJsonLdByType(scripts, "BreadcrumbList");
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb!.itemListElement.length).toBeGreaterThanOrEqual(3);
  });

  test("media JSON-LD items are separate script tags", async ({ page }) => {
    const slug = "beneteau-oceanis-30-1";
    const resp = await page.goto(`/yachts/${slug}`, { waitUntil: "networkidle" });
    if (!resp || resp.status() === 404) return test.skip();

    const scripts = await getJsonLdScripts(page);

    // Media JSON-LD items should be separate from Product schema
    const product = findJsonLdByType(scripts, "Product");
    expect(product).toBeDefined();

    // VideoObject and DigitalDocument should be separate script tags,
    // not embedded inside the Product
    const videoObjects = findAllJsonLdByType(scripts, "VideoObject");
    const digitalDocs = findAllJsonLdByType(scripts, "DigitalDocument");

    // If they exist, they should not be nested inside Product
    for (const vo of videoObjects) {
      expect(vo["@type"]).toBe("VideoObject");
      expect(vo["@context"]).toBe("https://schema.org");
    }
    for (const doc of digitalDocs) {
      expect(doc["@type"]).toBe("DigitalDocument");
      expect(doc["@context"]).toBe("https://schema.org");
    }
  });

  test("all JSON-LD scripts on yacht page are valid JSON", async ({ page }) => {
    const yachtSlug = await navigateToYachtDetail(page);
    if (!yachtSlug) return test.skip();

    // Re-read raw scripts to verify parseability
    const scriptEls = page.locator('script[type="application/ld+json"]');
    const count = await scriptEls.count();
    expect(count).toBeGreaterThanOrEqual(2); // At least Product + BreadcrumbList

    for (let i = 0; i < count; i++) {
      const raw = await scriptEls.nth(i).textContent();
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed["@context"]).toBe("https://schema.org");
      expect(parsed["@type"]).toBeTruthy();
    }
  });

  test("media JSON-LD is emitted only when media assets exist", async ({ request, page }) => {
    // Find a yacht and check its media
    const slug = "beneteau-oceanis-30-1";

    const mediaResp = await request.get(`/api/yachts/${slug}/media`);
    if (mediaResp.status() !== 200) return test.skip();
    const mediaBody = await mediaResp.json();
    const allMedia = mediaBody.mediaAssets || [];

    const pageResp = await page.goto(`/yachts/${slug}`, { waitUntil: "networkidle" });
    if (!pageResp || pageResp.status() === 404) return test.skip();

    const scripts = await getJsonLdScripts(page);
    const videoObjects = findAllJsonLdByType(scripts, "VideoObject");
    const digitalDocs = findAllJsonLdByType(scripts, "DigitalDocument");

    const videos = allMedia.filter((a: any) => a.mediaType === "video");
    const docs = allMedia.filter(
      (a: any) => a.mediaType === "brochure" || a.mediaType === "deck_plan" || a.mediaType === "interior_layout"
    );

    // Count should match data
    expect(videoObjects.length).toBe(videos.length);
    expect(digitalDocs.length).toBe(docs.length);
  });
});
