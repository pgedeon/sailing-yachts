import { test, expect } from "@playwright/test";

test.describe("User Corrections (P10.7)", () => {
  test.describe("Correction form on yacht detail", () => {
    test("correction form button is visible on yacht detail page", async ({ page }) => {
      await page.goto("/yachts");
      await page.waitForLoadState("domcontentloaded");

      const yachtLink = page.locator('a[href^="/yachts/"]').first();
      if ((await yachtLink.count()) === 0) {
        test.skip();
        return;
      }

      await yachtLink.click();
      await page.waitForLoadState("domcontentloaded");

      const btn = page.locator('[data-testid="suggest-correction-btn"]');
      await expect(btn).toBeVisible({ timeout: 10000 });
    });

    test("form opens and has required fields", async ({ page }) => {
      await page.goto("/yachts");
      await page.waitForLoadState("domcontentloaded");

      const link = page.locator('a[href^="/yachts/"]').first();
      if ((await link.count()) === 0) {
        test.skip();
        return;
      }

      await link.click();
      await page.waitForLoadState("domcontentloaded");

      const btn = page.locator('[data-testid="suggest-correction-btn"]');
      await expect(btn).toBeVisible({ timeout: 10000 });
      await btn.click();

      const modal = page.locator('[data-testid="correction-form-modal"]');
      await expect(modal).toBeVisible();

      await expect(page.locator('[data-testid="correction-type-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="field-name-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="suggested-value-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="correction-submit-btn"]')).toBeVisible();
    });
  });

  test.describe("API validation", () => {
    test("submission API validates input (returns error for empty body)", async ({ request }) => {
      const response = await request.post("/api/corrections", {
        data: {},
      });
      // Should return client error: 400 (validation), 404 (not found), or 500 (server error)
      // Exact code depends on deployment state; key is it's not 200/201
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });

    test("submission API returns error for invalid data", async ({ request }) => {
      const response = await request.post("/api/corrections", {
        data: {
          yachtModelId: 999999,
        },
      });
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test("submission API returns 404 for non-existent yacht", async ({ request }) => {
      const response = await request.post("/api/corrections", {
        data: {
          yachtModelId: 999999,
          fieldName: "lengthOverall",
          suggestedValue: "10.5",
        },
      });
      expect(response.status()).toBe(404);
    });
  });

  test.describe("Admin corrections API auth", () => {
    test("GET /api/admin/corrections requires auth (401)", async ({ request }) => {
      const response = await request.get("/api/admin/corrections");
      expect(response.status()).toBe(401);
    });

    test("GET /api/admin/corrections/[id] requires auth (401)", async ({ request }) => {
      const response = await request.get("/api/admin/corrections/1");
      expect(response.status()).toBe(401);
    });

    test("PATCH /api/admin/corrections/[id] requires auth (401)", async ({ request }) => {
      const response = await request.patch("/api/admin/corrections/1", {
        data: { status: "accepted" },
      });
      expect(response.status()).toBe(401);
    });

    test("DELETE /api/admin/corrections/[id] requires auth (401)", async ({ request }) => {
      const response = await request.delete("/api/admin/corrections/1");
      expect(response.status()).toBe(401);
    });
  });
});
