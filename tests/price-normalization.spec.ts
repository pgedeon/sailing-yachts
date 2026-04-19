/**
 * Price Normalization & Exchange Rates API Tests (P10.6)
 *
 * Tests the /api/prices/normalize and /api/exchange-rates endpoints.
 * Also tests price display fallback behavior via the prices API.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Exchange Rates API", () => {
  test("GET /api/exchange-rates returns rates", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/exchange-rates`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.base).toBe("EUR");
    expect(data.rates).toBeDefined();
    // Should have EUR_USD, EUR_EUR, EUR_GBP
    expect(data.rates["EUR_EUR"]).toBe(1);
    expect(data.rates["EUR_USD"]).toBeGreaterThan(0);
    expect(data.rates["EUR_GBP"]).toBeGreaterThan(0);
  });

  test("GET /api/exchange-rates?base=USD works", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/exchange-rates?base=USD`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.base).toBe("USD");
    expect(data.rates["USD_USD"]).toBe(1);
  });

  test("GET /api/exchange-rates rejects invalid base", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/exchange-rates?base=XYZ`);
    expect(response.status()).toBe(400);
  });
});

test.describe("Price Normalization API", () => {
  test("GET /api/prices/normalize requires yachtModelId", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/prices/normalize`);
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("yachtModelId");
  });

  test("GET /api/prices/normalize returns display info for existing yacht", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/prices/normalize?yachtModelId=1&currency=EUR`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.yachtModelId).toBe(1);
    expect(data.currency).toBe("EUR");
    expect(data.displayInfo).toBeDefined();
    expect(data.displayInfo).toHaveProperty("status");
    expect(data.displayInfo).toHaveProperty("label");
    expect(data.displayInfo).toHaveProperty("confidenceLevel");
    // Rates used should be present
    expect(data.ratesUsed).toBeDefined();
  });

  test("GET /api/prices/normalize supports USD", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/prices/normalize?yachtModelId=1&currency=USD`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.currency).toBe("USD");
  });

  test("GET /api/prices/normalize supports GBP", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/prices/normalize?yachtModelId=1&currency=GBP`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.currency).toBe("GBP");
  });

  test("GET /api/prices/normalize rejects invalid currency", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/prices/normalize?yachtModelId=1&currency=XYZ`);
    expect(response.status()).toBe(400);
  });

  test("GET /api/prices/normalize includes history when requested", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/prices/normalize?yachtModelId=1&currency=EUR&history=true`
    );
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.history).toBeDefined();
    expect(Array.isArray(data.history)).toBeTruthy();
  });

  test("Returns unavailable status for yacht with no prices", async ({ request }) => {
    // Use a yacht model ID that is unlikely to have prices
    const response = await request.get(`${BASE_URL}/api/prices/normalize?yachtModelId=99999&currency=EUR`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.displayInfo.status).toBe("unavailable");
    expect(data.newPrice).toBeNull();
    expect(data.usedPrice).toBeNull();
  });
});

test.describe("Price Display Fallbacks", () => {
  test("Existing prices API still works alongside normalization", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/prices?limit=10`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("prices");
    expect(data).toHaveProperty("total");
  });

  test("Price summary for yacht works", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/prices?yachtId=1`);
    // May be 200 (has prices) or 404 (no yacht) — both are valid
    expect([200, 404]).toContain(response.status());
  });
});
