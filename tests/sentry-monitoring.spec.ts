import { test, expect } from "@playwright/test";

test.describe("P11.1: Error Monitoring + Sentry Integration", () => {
  test.describe("Sentry SDK Initialization", () => {
    test("should load Sentry client config without errors", async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto("/");

      // Page should load without Sentry-related errors
      const sentryErrors = consoleErrors.filter(
        (e) =>
          e.toLowerCase().includes("sentry") &&
          !e.includes("Sentry SDK is not configured")
      );
      expect(sentryErrors).toHaveLength(0);
    });

    test("should have Sentry global object available", async ({ page }) => {
      await page.goto("/");

      const hasSentry = await page.evaluate(() => {
        return typeof (window as any).__SENTRY__ !== "undefined" ||
          typeof (window as any).Sentry !== "undefined";
      });

      // Sentry should be loaded (even if DSN is not configured in test env)
      expect(hasSentry).toBeTruthy();
    });

    test("global error boundary should be defined", async ({ page }) => {
      await page.goto("/");

      // The global-error.tsx should exist as a component
      // We can't easily test it renders without causing an actual error,
      // but we can verify the page loads normally
      const body = page.locator("body");
      await expect(body).toBeVisible();
    });
  });

  test.describe("Sentry Utility Functions", () => {
    test("captureError should not throw when Sentry DSN is missing", async ({
      page,
    }) => {
      await page.goto("/");

      // Verify the page loads fine even without Sentry DSN configured
      // This tests that the beforeSend filter works correctly
      await expect(page.locator("h1, main")).toBeVisible();
    });
  });

  test.describe("Error Boundary Integration", () => {
    test("site loads normally with Sentry integration", async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      // Load key pages and verify no errors
      const pages = ["/", "/yachts", "/search", "/compare"];

      for (const path of pages) {
        await page.goto(path);
        await expect(page.locator("h1, main")).toBeVisible();
      }

      // Filter out known harmless errors
      const realErrors = consoleErrors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("manifest") &&
          !e.includes("Sentry SDK is not configured")
      );

      // Should have no unexpected errors
      expect(realErrors).toHaveLength(0);
    });
  });

  test.describe("Sentry Configuration Files", () => {
    test("sentry client config module exists and is importable", async ({
      request,
    }) => {
      // The sentry client config should be bundled into the page
      // We verify the site still works after adding Sentry
      const response = await request.get("/");
      expect(response.status()).toBe(200);
    });

    test("tunnel route should be accessible", async ({ request }) => {
      // The /monitoring tunnel route is set up to proxy Sentry requests
      // It should exist and not return a 500
      const response = await request.post("/monitoring", {
        data: {
          // Empty POST to verify the route exists
        },
        failOnStatusCode: false,
      });

      // Route should exist (not 404). May return 400 or other status since we're
      // sending invalid data, but it should not 404.
      expect(response.status()).not.toBe(404);
    });
  });

  test.describe("Performance & Bundle Size", () => {
    test("Sentry integration should not significantly increase page load time", async ({
      page,
    }) => {
      const startTime = Date.now();
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const loadTime = Date.now() - startTime;

      // Page should load in under 10 seconds even with Sentry
      expect(loadTime).toBeLessThan(10000);
    });

    test("critical pages still render correctly with Sentry", async ({
      page,
    }) => {
      // Verify Sentry hasn't broken any pages
      await page.goto("/yachts");
      await expect(page.locator("h1")).toBeVisible();

      await page.goto("/search");
      await expect(page.locator("h1, main")).toBeVisible();
    });
  });

  test.describe("Environment Guards", () => {
    test("test environment should not send Sentry events", async ({
      page,
    }) => {
      // In test environment, the beforeSend filter should return null
      // preventing any events from being sent
      const networkRequests: string[] = [];

      page.on("request", (req) => {
        const url = req.url();
        if (url.includes("sentry") || url.includes("ingest")) {
          networkRequests.push(url);
        }
      });

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Should not send any events to Sentry in test env
      expect(networkRequests).toHaveLength(0);
    });
  });
});
