import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("P11.2: Query/index audit — API performance", () => {
  test("yachts listing API responds within performance budget", async ({
    request,
  }) => {
    const start = Date.now();
    const response = await request.get(`${BASE_URL}/api/yachts?page=1&limit=20`);
    const duration = Date.now() - start;

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.yachts).toBeDefined();
    expect(data.total).toBeGreaterThan(0);
    expect(data.yachts.length).toBeLessThanOrEqual(20);

    // Performance budget: listing API should respond within 2 seconds
    expect(duration).toBeLessThan(2000);
  });

  test("yachts listing with filters uses proper query structure", async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/yachts?page=1&limit=20&filters[lengthMin]=25&filters[lengthMax]=40&sort=length_overall&order=desc`,
    );

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.yachts).toBeDefined();

    // All returned yachts should have length within range
    for (const yacht of data.yachts) {
      if (yacht.lengthOverall) {
        const loa = Number(yacht.lengthOverall);
        expect(loa).toBeGreaterThanOrEqual(25);
        expect(loa).toBeLessThanOrEqual(40);
      }
    }
  });

  test("yachts listing with manufacturer filter returns filtered results", async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/yachts?page=1&limit=20&filters[manufacturers]=1`,
    );

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.yachts).toBeDefined();
  });

  test("yacht detail API responds within performance budget", async ({
    request,
  }) => {
    // First get a list of available yachts
    const listResponse = await request.get(
      `${BASE_URL}/api/yachts?page=1&limit=5`,
    );
    const listData = await listResponse.json();

    if (listData.yachts.length === 0) {
      test.skip();
      return;
    }

    const slug = listData.yachts.find((y: { slug?: string }) => y.slug)?.slug;
    if (!slug) {
      test.skip();
      return;
    }

    const start = Date.now();
    const response = await request.get(`${BASE_URL}/api/yachts/${slug}`);
    const duration = Date.now() - start;

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.modelName).toBeDefined();

    // Performance budget: detail API should respond within 2 seconds
    expect(duration).toBeLessThan(2000);
  });

  test("search API autocomplete responds within performance budget", async ({
    request,
  }) => {
    const start = Date.now();
    const response = await request.get(
      `${BASE_URL}/api/search?q=oceanis&mode=autocomplete&limit=10`,
    );
    const duration = Date.now() - start;

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.suggestions).toBeDefined();

    // Performance budget: autocomplete should be fast
    expect(duration).toBeLessThan(1500);
  });

  test("search API full mode responds within performance budget", async ({
    request,
  }) => {
    const start = Date.now();
    const response = await request.get(
      `${BASE_URL}/api/search?q=beneteau&mode=full&limit=10`,
    );
    const duration = Date.now() - start;

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.yachts).toBeDefined();

    // Performance budget: full search should respond within 2 seconds
    expect(duration).toBeLessThan(2000);
  });

  test("compare API responds within performance budget", async ({
    request,
  }) => {
    // First get some yacht IDs
    const listResponse = await request.get(
      `${BASE_URL}/api/yachts?page=1&limit=5`,
    );
    const listData = await listResponse.json();

    if (listData.yachts.length < 2) {
      test.skip();
      return;
    }

    const ids = listData.yachts
      .slice(0, 3)
      .map((y: { id: number }) => y.id)
      .join(",");

    const start = Date.now();
    const response = await request.get(
      `${BASE_URL}/api/compare?ids=${ids}`,
    );
    const duration = Date.now() - start;

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.yachts).toBeDefined();

    // Performance budget: compare should respond within 2 seconds
    expect(duration).toBeLessThan(2000);
  });

  test("yachts API returns distinct filter values", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/yachts`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.distinct).toBeDefined();
    expect(Array.isArray(data.distinct.rigTypes)).toBeTruthy();
    expect(Array.isArray(data.distinct.keelTypes)).toBeTruthy();
    expect(Array.isArray(data.distinct.hullMaterials)).toBeTruthy();
  });

  test("manufacturer listing API responds within budget", async ({
    request,
  }) => {
    const start = Date.now();
    const response = await request.get(`${BASE_URL}/api/manufacturers`);
    const duration = Date.now() - start;

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.manufacturers).toBeDefined();
    expect(data.manufacturers.length).toBeGreaterThan(0);

    // Performance budget
    expect(duration).toBeLessThan(2000);
  });
});

test.describe("P11.2: Query/index audit — Query regression benchmarks", () => {
  test("listing API pagination returns consistent total counts", async ({
    request,
  }) => {
    const page1 = await request.get(`${BASE_URL}/api/yachts?page=1&limit=20`);
    const page2 = await request.get(`${BASE_URL}/api/yachts?page=2&limit=20`);

    const data1 = await page1.json();
    const data2 = await page2.json();

    expect(data1.total).toBe(data2.total);
    expect(data1.totalPages).toBe(data2.totalPages);
  });

  test("filtered listing total count is less than unfiltered", async ({
    request,
  }) => {
    const unfiltered = await request.get(`${BASE_URL}/api/yachts`);
    const filtered = await request.get(
      `${BASE_URL}/api/yachts?filters[hullMaterial]=GRP`,
    );

    const dataUnfiltered = await unfiltered.json();
    const dataFiltered = await filtered.json();

    expect(dataFiltered.total).toBeLessThanOrEqual(dataUnfiltered.total);
  });

  test("search results are relevant to query", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/search?q=beneteau&mode=full&limit=10`,
    );
    const data = await response.json();

    if (data.yachts.length > 0) {
      // At least one result should have "beneteau" in manufacturer name
      const hasMatch = data.yachts.some(
        (y: { manufacturer: string; modelName: string }) =>
          y.manufacturer?.toLowerCase().includes("beneteau") ||
          y.modelName?.toLowerCase().includes("beneteau"),
      );
      expect(hasMatch).toBeTruthy();
    }
  });
});
