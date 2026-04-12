import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Prices API - CRUD", () => {
  let createdPriceId: number | null = null;

  test("POST /api/prices creates a new price record", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/prices`, {
      data: {
        action: "create",
        yachtModelId: 1,
        priceMin: 150000,
        priceMax: 200000,
        currency: "USD",
        condition: "new",
        source: "Test Dealer",
        confidenceScore: 75,
      },
    });
    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.price).toBeDefined();
    expect(data.price.priceMin).toBe(150000);
    expect(data.price.priceMax).toBe(200000);
    expect(data.price.currency).toBe("USD");
    expect(data.price.condition).toBe("new");
    expect(data.price.confidenceScore).toBe(75);
    createdPriceId = data.price.id;
  });

  test("POST /api/prices validates price data", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/prices`, {
      data: {
        action: "validate",
        yachtModelId: 1,
        priceMin: 200000,
        priceMax: 150000, // min > max
      },
    });
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.valid).toBe(false);
    expect(data.errors.length).toBeGreaterThan(0);
  });

  test("POST /api/prices rejects missing required fields", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/prices`, {
      data: {
        action: "create",
        priceMin: 100000,
      },
    });
    expect(response.status()).toBe(400);
  });

  test("GET /api/prices returns list with filters", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/prices?yachtModelId=1&condition=new`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("prices");
    expect(data).toHaveProperty("total");
    expect(Array.isArray(data.prices)).toBe(true);
  });

  test("GET /api/prices?id= returns single record", async ({ request }) => {
    if (!createdPriceId) return;

    const response = await request.get(
      `${BASE_URL}/api/prices?id=${createdPriceId}`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.price.id).toBe(createdPriceId);
  });

  test("POST /api/prices updates a price record", async ({ request }) => {
    if (!createdPriceId) return;

    const response = await request.post(`${BASE_URL}/api/prices`, {
      data: {
        action: "update",
        id: createdPriceId,
        priceMax: 220000,
        confidenceScore: 80,
      },
    });
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.price.priceMax).toBe(220000);
    expect(data.price.confidenceScore).toBe(80);
  });

  test("POST /api/prices deletes a price record", async ({ request }) => {
    if (!createdPriceId) return;

    const response = await request.post(`${BASE_URL}/api/prices`, {
      data: { action: "delete", id: createdPriceId },
    });
    expect(response.status()).toBe(200);
  });

  test("GET /api/prices?id= returns 404 after delete", async ({ request }) => {
    if (!createdPriceId) return;

    const response = await request.get(
      `${BASE_URL}/api/prices?id=${createdPriceId}`
    );
    expect(response.status()).toBe(404);
  });
});

test.describe("Prices API - CSV Import", () => {
  test("POST /api/prices imports batch data", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/prices`, {
      data: {
        action: "import",
        rows: [
          { yacht_model_id: "1", price_min: "100000", price_max: "150000", condition: "used", source: "Test Import" },
          { yacht_model_id: "1", price_min: "180000", price_max: "250000", condition: "new", source: "Test Import" },
        ],
      },
    });
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.imported).toBeGreaterThanOrEqual(1);
    expect(data).toHaveProperty("skipped");
    expect(data).toHaveProperty("errors");
  });

  test("POST /api/prices import skips invalid rows", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/prices`, {
      data: {
        action: "import",
        rows: [
          { yacht_model_id: "invalid", price: "bad" },
          { yacht_model_id: "1", price_min: "50000", price_max: "80000", source: "Test Import" },
        ],
      },
    });
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.skipped).toBeGreaterThanOrEqual(1);
    expect(data.errors.length).toBeGreaterThan(0);
  });
});

test.describe("Prices API - Summary", () => {
  test("GET /api/prices?yachtId= returns price summary", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/prices?yachtId=1`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("yachtModelId");
    expect(data).toHaveProperty("modelName");
    expect(data).toHaveProperty("manufacturerName");
    expect(data).toHaveProperty("currency");
    expect(data).toHaveProperty("totalSources");
  });
});
