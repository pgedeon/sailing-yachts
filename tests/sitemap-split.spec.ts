import { test, expect } from "@playwright/test";

test.describe("Split Sitemap System", () => {
  const BASE = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

  test("sitemap index should be valid XML with sub-sitemaps", async ({ request }) => {
    const resp = await request.get(`${BASE}/sitemap.xml`);
    expect(resp.status()).toBe(200);
    expect(resp.headers()["content-type"]).toContain("xml");

    const xml = await resp.text();

    // Validate it's a sitemap index
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("</sitemapindex>");

    // Validate all sub-sitemaps are listed
    expect(xml).toContain("/sitemap-pages.xml");
    expect(xml).toContain("/sitemap-yachts.xml");
    expect(xml).toContain("/sitemap-manufacturers.xml");
    expect(xml).toContain("/sitemap-compare.xml");
    expect(xml).toContain("/sitemap-images.xml");

    // Each sub-sitemap should have a <sitemap> wrapper with <loc>
    const sitemapCount = (xml.match(/<sitemap>/g) || []).length;
    expect(sitemapCount).toBe(5);
  });

  test("sitemap-pages.xml should list static pages", async ({ request }) => {
    const resp = await request.get(`${BASE}/sitemap-pages.xml`);
    expect(resp.status()).toBe(200);
    expect(resp.headers()["content-type"]).toContain("xml");

    const xml = await resp.text();

    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");

    // Must contain core pages
    expect(xml).toContain("/yachts");
    expect(xml).toContain("/manufacturers");
    expect(xml).toContain("/compare");
    expect(xml).toContain("/search");

    // Verify URL entries have required fields
    expect(xml).toContain("<loc>");
    expect(xml).toContain("<priority>");
  });

  test("sitemap-yachts.xml should list yacht pages with lastmod", async ({ request }) => {
    const resp = await request.get(`${BASE}/sitemap-yachts.xml`);
    expect(resp.status()).toBe(200);

    const xml = await resp.text();

    expect(xml).toContain("<urlset");
    expect(xml).toContain("/yachts/");
    expect(xml).toContain("<lastmod>");

    // Should have multiple yacht entries
    const urlCount = (xml.match(/<url>/g) || []).length;
    expect(urlCount).toBeGreaterThan(10);
  });

  test("sitemap-manufacturers.xml should list manufacturer pages", async ({ request }) => {
    const resp = await request.get(`${BASE}/sitemap-manufacturers.xml`);
    expect(resp.status()).toBe(200);

    const xml = await resp.text();

    expect(xml).toContain("<urlset");
    expect(xml).toContain("/manufacturers/");

    // Should have multiple manufacturer entries
    const urlCount = (xml.match(/<url>/g) || []).length;
    expect(urlCount).toBeGreaterThan(5);
  });

  test("sitemap-compare.xml should list comparison pages", async ({ request }) => {
    const resp = await request.get(`${BASE}/sitemap-compare.xml`);
    expect(resp.status()).toBe(200);

    const xml = await resp.text();

    expect(xml).toContain("<urlset");
    expect(xml).toContain("/compare/");
    expect(xml).toContain("-vs-");

    // Should have comparison pair entries
    const urlCount = (xml.match(/<url>/g) || []).length;
    expect(urlCount).toBeGreaterThan(0);
  });

  test("sitemap-images.xml should include image:image tags", async ({ request }) => {
    const resp = await request.get(`${BASE}/sitemap-images.xml`);
    expect(resp.status()).toBe(200);

    const xml = await resp.text();

    expect(xml).toContain("<urlset");
    // Should include image namespace
    expect(xml).toContain("xmlns:image");

    // If there are entries, they should have image:image children
    const urlCount = (xml.match(/<url>/g) || []).length;
    if (urlCount > 0) {
      expect(xml).toContain("<image:image>");
      expect(xml).toContain("<image:loc>");
    }
  });

  test("robots.txt should reference all sitemaps", async ({ request }) => {
    const resp = await request.get(`${BASE}/robots.txt`);
    expect(resp.status()).toBe(200);

    const text = await resp.text();

    // Should allow all crawlers
    expect(text).toContain("User-agent: *");
    expect(text).toContain("Allow: /");

    // Should reference the main sitemap index
    expect(text).toContain("Sitemap:");
    expect(text).toContain("/sitemap.xml");

    // Should also reference individual sitemaps for broader crawl coverage
    expect(text).toContain("/sitemap-yachts.xml");
    expect(text).toContain("/sitemap-manufacturers.xml");
    expect(text).toContain("/sitemap-compare.xml");
    expect(text).toContain("/sitemap-images.xml");
  });
});

test.describe("Sitemap XML Validity", () => {
  const BASE = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

  async function validateXmlStructure(request: any, url: string) {
    const resp = await request.get(url);
    expect(resp.status()).toBe(200);

    const xml = await resp.text();

    // Must start with XML declaration
    expect(xml.startsWith("<?xml")).toBe(true);

    // No unescaped ampersands (except in entities)
    const bodyWithoutEntities = xml.replace(/&[a-z]+;/g, "").replace(/&#\d+;/g, "");
    const unescapedAmpersands = (bodyWithoutEntities.match(/&/g) || []).length;
    expect(unescapedAmpersands).toBe(0);
  }

  test("sitemap index has valid XML structure", async ({ request }) => {
    await validateXmlStructure(request, `${BASE}/sitemap.xml`);
  });

  test("sitemap-pages.xml has valid XML structure", async ({ request }) => {
    await validateXmlStructure(request, `${BASE}/sitemap-pages.xml`);
  });

  test("sitemap-yachts.xml has valid XML structure", async ({ request }) => {
    await validateXmlStructure(request, `${BASE}/sitemap-yachts.xml`);
  });

  test("sitemap-manufacturers.xml has valid XML structure", async ({ request }) => {
    await validateXmlStructure(request, `${BASE}/sitemap-manufacturers.xml`);
  });

  test("sitemap-compare.xml has valid XML structure", async ({ request }) => {
    await validateXmlStructure(request, `${BASE}/sitemap-compare.xml`);
  });

  test("sitemap-images.xml has valid XML structure", async ({ request }) => {
    await validateXmlStructure(request, `${BASE}/sitemap-images.xml`);
  });
});
