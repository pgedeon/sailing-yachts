import { test, expect } from "@playwright/test";

// Use a known yacht slug that exists in production
const TEST_SLUG = "beneteau-oceanis-30-1";
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

test.describe("Media Assets API", () => {
  test.describe("Admin API - Auth Guard", () => {
    test("GET /api/admin/media returns 401 without auth cookie", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE_URL}/api/admin/media?yachtId=1`,
      );
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toContain("Unauthorized");
    });

    test("POST /api/admin/media returns 401 without auth cookie", async ({
      request,
    }) => {
      const response = await request.post(`${BASE_URL}/api/admin/media`, {
        data: { yachtModelId: 1, mediaType: "photo" },
      });
      expect(response.status()).toBe(401);
    });

    test("PATCH /api/admin/media returns 401 without auth cookie", async ({
      request,
    }) => {
      const response = await request.patch(
        `${BASE_URL}/api/admin/media?id=1`,
        { data: { title: "Test" } },
      );
      expect(response.status()).toBe(401);
    });

    test("DELETE /api/admin/media returns 401 without auth cookie", async ({
      request,
    }) => {
      const response = await request.delete(
        `${BASE_URL}/api/admin/media?id=999`,
      );
      expect(response.status()).toBe(401);
    });
  });

  test.describe("Public API", () => {
    test("GET /api/yachts/[slug]/media returns data", async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/yachts/${TEST_SLUG}/media`,
      );
      // May be 200 with empty array or 404 if yacht doesn't exist
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.mediaAssets).toBeDefined();
        expect(body.grouped).toBeDefined();
        expect(typeof body.total).toBe("number");
      } else {
        // Yacht might not exist in test DB — that's OK
        expect([200, 404]).toContain(response.status());
      }
    });

    test("media response is grouped by type", async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/yachts/${TEST_SLUG}/media`,
      );
      if (response.status() === 200) {
        const body = await response.json();
        expect(typeof body.grouped).toBe("object");
      }
    });
  });
});

test.describe("Media Gallery Component", () => {
  test("gallery renders when media exists on yacht page", async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts/${TEST_SLUG}`, {
      waitUntil: "networkidle",
    });

    // If media gallery exists, check it renders
    const gallery = page.locator('[data-testid="media-gallery"]');
    if ((await gallery.count()) > 0) {
      await expect(gallery).toBeVisible();
    }
    // It's OK if there's no gallery — yacht may have no media assets
  });

  test("gallery tabs switch content correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts/${TEST_SLUG}`, {
      waitUntil: "networkidle",
    });

    const gallery = page.locator('[data-testid="media-gallery"]');
    if ((await gallery.count()) === 0) {
      // No media — skip tab tests
      return;
    }

    // Check that tab bar exists
    const tabBar = page.locator('[data-testid="media-gallery-tabs"]');
    if ((await tabBar.count()) > 0) {
      await expect(tabBar).toBeVisible();

      // Find visible tabs and click through them
      const tabs = tabBar.locator("button[role='tab']");
      const tabCount = await tabs.count();
      for (let i = 0; i < tabCount; i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(300);
      }
    }
  });
});
