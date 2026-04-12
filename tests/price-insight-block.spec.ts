import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Price Insight Blocks on Yacht Pages (P8.2)", () => {
  // First, seed price data via API for a known yacht
  let priceId: number | null = null;

  test.beforeAll(async ({ request }) => {
    // Create a new price record for yacht model ID 1
    const res = await request.post(`${BASE_URL}/api/prices`, {
      data: {
        action: "create",
        yachtModelId: 1,
        priceMin: 180000,
        priceMax: 250000,
        currency: "USD",
        condition: "new",
        source: "Test Dealer P8.2",
        sourceType: "manual",
        confidenceScore: 80,
      },
    });
    if (res.ok()) {
      const data = await res.json();
      priceId = data.price?.id ?? null;
    }
  });

  test.afterAll(async ({ request }) => {
    // Clean up test price data
    if (priceId) {
      await request.post(`${BASE_URL}/api/prices`, {
        data: { action: "delete", id: priceId },
      });
    }
  });

  test("price insight block renders on yacht detail page with price data", async ({ page }) => {
    // Navigate to a yacht that we know has ID 1 (first yacht in DB)
    // First get a slug
    const yachtsRes = await page.request.get(`${BASE_URL}/api/yachts?limit=1`);
    expect(yachtsRes.ok()).toBeTruthy();
    const yachtsData = await yachtsRes.json();
    const yacht = yachtsData.yachts?.[0];
    if (!yacht) return;

    await page.goto(`${BASE_URL}/yachts/${yacht.slug}`);
    await page.waitForLoadState("networkidle");

    // If this yacht has price data (yacht.id === 1 from our seed), the block should be visible
    if (yacht.id === 1) {
      const block = page.getByTestId("price-insight-block");
      await expect(block).toBeVisible({ timeout: 5000 });

      // Should show "Price Range" heading
      await expect(block.locator("h3")).toContainText("Price Range");

      // Should show confidence badge
      await expect(block.locator("text=confidence")).toBeVisible();

      // Should show source count
      await expect(block.locator("text=source")).toBeVisible();
    }
  });

  test("price insight block hides gracefully when no price data", async ({ page }) => {
    // Find a yacht without price data (any yacht that isn't ID 1)
    const yachtsRes = await page.request.get(`${BASE_URL}/api/yachts?limit=10`);
    expect(yachtsRes.ok()).toBeTruthy();
    const yachtsData = await yachtsRes.json();
    const yacht = yachtsData.yachts?.find((y: any) => y.id !== 1);
    if (!yacht) return;

    await page.goto(`${BASE_URL}/yachts/${yacht.slug}`);
    await page.waitForLoadState("networkidle");

    // The price insight block should not be visible (returns null when no data)
    const block = page.getByTestId("price-insight-block");
    await expect(block).not.toBeVisible();
  });

  test("price API returns valid summary", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/prices?yachtId=1`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();

    // Should have price summary fields
    expect(data).toHaveProperty("yachtModelId");
    expect(data).toHaveProperty("newPriceMin");
    expect(data).toHaveProperty("newPriceMax");
    expect(data).toHaveProperty("currency");

    if (data.newPriceMin != null) {
      expect(typeof data.newPriceMin).toBe("number");
      expect(data.newPriceMin).toBeGreaterThan(0);
    }
  });
});

test.describe("AggregateOffer JSON-LD on Yacht Pages (P8.2)", () => {
  test("yacht page contains AggregateOffer schema when price data exists", async ({ page }) => {
    // Get first yacht (ID 1, has our test price data)
    const yachtsRes = await page.request.get(`${BASE_URL}/api/yachts?limit=1`);
    const yachtsData = await yachtsRes.json();
    const yacht = yachtsData.yachts?.[0];
    if (!yacht || yacht.id !== 1) return;

    await page.goto(`${BASE_URL}/yachts/${yacht.slug}`);
    await page.waitForLoadState("networkidle");

    // Check for AggregateOffer JSON-LD
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hasAggregateOffer = jsonLdScripts.some((text) => {
      try {
        const json = JSON.parse(text);
        return json["@type"] === "AggregateOffer";
      } catch {
        return false;
      }
    });

    expect(hasAggregateOffer).toBeTruthy();

    // Validate the AggregateOffer structure
    const offerJsonLd = jsonLdScripts
      .map((text) => {
        try { return JSON.parse(text); } catch { return null; }
      })
      .find((json) => json?.["@type"] === "AggregateOffer");

    expect(offerJsonLd).toBeTruthy();
    expect(offerJsonLd.priceCurrency).toBe("USD");
    expect(offerJsonLd.lowPrice).toBeGreaterThan(0);
    expect(offerJsonLd.highPrice).toBeGreaterThanOrEqual(offerJsonLd.lowPrice);
    expect(offerJsonLd.offers).toBeDefined();
    expect(offerJsonLd.offers.length).toBeGreaterThan(0);

    // Check the first offer has correct structure
    const offer = offerJsonLd.offers[0];
    expect(offer["@type"]).toBe("Offer");
    expect(offer.priceCurrency).toBeTruthy();
    expect(offer.availability).toContain("schema.org");
    expect(offer.itemCondition).toContain("schema.org");
  });

  test("yacht page without price data does not include AggregateOffer schema", async ({ page }) => {
    const yachtsRes = await page.request.get(`${BASE_URL}/api/yachts?limit=10`);
    const yachtsData = await yachtsRes.json();
    const yacht = yachtsData.yachts?.find((y: any) => y.id !== 1);
    if (!yacht) return;

    await page.goto(`${BASE_URL}/yachts/${yacht.slug}`);
    await page.waitForLoadState("networkidle");

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hasAggregateOffer = jsonLdScripts.some((text) => {
      try {
        const json = JSON.parse(text);
        return json["@type"] === "AggregateOffer";
      } catch {
        return false;
      }
    });

    expect(hasAggregateOffer).toBeFalsy();
  });
});
