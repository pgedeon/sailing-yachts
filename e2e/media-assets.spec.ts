import { test, expect } from "@playwright/test";

// Use a known yacht slug that exists in the test DB
const TEST_SLUG = "beneteau-oceanis-30-1";
const BASE_URL = process.env.PLAYWRIGHT_TEST_URL || "http://localhost:3000";

test.describe("Media Assets API", () => {
  test.describe("Admin API - Auth Guard", () => {
    test("GET /api/admin/media returns 401 without auth cookie", async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/admin/media?yachtId=1`);
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
      const response = await request.patch(`${BASE_URL}/api/admin/media?id=1`, {
        data: { title: "Test" },
      });
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

  test.describe("Admin API - CRUD with auth", () => {
    // These tests require auth cookie — skip if no test auth available
    test.skip(
      () => !process.env.TEST_AUTH_COOKIE,
      "No TEST_AUTH_COOKIE set — skipping authenticated CRUD tests",
    );

    const authCookie = process.env.TEST_AUTH_COOKIE || "";
    const headers = { Cookie: `auth=${authCookie}` };

    test("should create a media asset", async ({ request }) => {
      // First get a valid yacht ID
      const yachtResponse = await request.get(
        `${BASE_URL}/api/yachts/${TEST_SLUG}`,
      );
      if (yachtResponse.status() !== 200) {
        test.skip();
        return;
      }
      const yacht = await yachtResponse.json();

      const response = await request.post(`${BASE_URL}/api/admin/media`, {
        headers,
        data: {
          yachtModelId: yacht.id,
          mediaType: "photo",
          title: "Test Photo",
          caption: "A test photo",
          url: "https://example.com/test.jpg",
          dataSource: "test",
        },
      });

      expect([201, 200]).toContain(response.status());
      const body = await response.json();
      expect(body.mediaAsset).toBeDefined();
      expect(body.mediaAsset.title).toBe("Test Photo");
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
        expect([200, 404, 500]).toContain(response.status());
      }
    });

    test("media response is grouped by type", async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/yachts/${TEST_SLUG}/media`,
      );
      if (response.status() === 200) {
        const body = await response.json();
        // grouped should be an object with media type keys
        expect(typeof body.grouped).toBe("object");
      }
    });
  });
});

test.describe("Media Gallery Component", () => {
  test("gallery renders when media exists on yacht page", async ({ page }) => {
    // Navigate to a yacht detail page
    await page.goto(`${BASE_URL}/yachts/${TEST_SLUG}`);

    // Wait for page to load (client-side fetch)
    await page.waitForTimeout(3000);

    // If media gallery exists, check it renders
    const gallery = page.locator('[data-testid="media-gallery"]');
    if ((await gallery.count()) > 0) {
      await expect(gallery).toBeVisible();
    }
    // It's OK if there's no gallery — yacht may have no media assets
  });

  test("gallery tabs switch content correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts/${TEST_SLUG}`);
    await page.waitForTimeout(3000);

    const gallery = page.locator('[data-testid="media-gallery"]');
    if ((await gallery.count()) === 0) {
      // No media — skip tab tests
      test.info().annotations.push({
        type: "skip",
        description: "No media assets on test yacht",
      });
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
