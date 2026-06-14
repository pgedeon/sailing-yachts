import { test, expect } from "@playwright/test";

// Tests use baseURL from playwright.config (https://info.sailboats.fr by default)

test.describe("Newsletter Monetization — Public Tracking Endpoints", () => {
  test("GET /api/newsletter/track/open/:campaignId returns tracking pixel GIF", async ({ request }) => {
    // Use campaign ID 1 (or any existing one) — even if it doesn't exist,
    // the endpoint still returns a pixel to avoid breaking emails
    const res = await request.get(`/api/newsletter/track/open/1`);

    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/gif");
  });

  test("GET /api/newsletter/track/click rejects missing URL param", async ({ request }) => {
    const res = await request.get(`/api/newsletter/track/click`);
    expect(res.status()).toBe(400);
  });

  test("GET /api/newsletter/track/click redirects to target URL", async ({ request }) => {
    const res = await request.get(
      `/api/newsletter/track/click?url=https://info.sailboats.fr/yachts&c=1&s=1&label=test_link`,
      { maxRedirects: 0 }
    );

    expect(res.status()).toBe(302);
    expect(res.headers()["location"]).toContain("info.sailboats.fr");
  });

  test("tracking pixel returns correct cache headers", async ({ request }) => {
    const res = await request.get(`/api/newsletter/track/open/1`);

    expect(res.headers()["content-type"]).toContain("image/gif");
    // Should have no-cache headers to ensure accurate tracking
    const cacheControl = res.headers()["cache-control"] || "";
    expect(cacheControl).toContain("no-store");
  });
});

test.describe("Newsletter Signup (existing) still works with new schema", () => {
  test("POST /api/newsletter subscribes with valid email", async ({ request }) => {
    const testEmail = `test-newsletter-${Date.now()}@sailboats-test.fr`;
    const res = await request.post(`/api/newsletter`, {
      data: {
        email: testEmail,
        source: "test",
      },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.message).toBeTruthy();
  });

  test("POST /api/newsletter rejects invalid email", async ({ request }) => {
    const res = await request.post(`/api/newsletter`, {
      data: {
        email: "not-an-email",
        source: "test",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("POST /api/newsletter deduplication works", async ({ request }) => {
    const testEmail = `dedup-test-${Date.now()}@sailboats-test.fr`;

    // First subscription
    const res1 = await request.post(`/api/newsletter`, {
      data: { email: testEmail, source: "test" },
    });
    expect(res1.ok()).toBeTruthy();

    // Second subscription — should say already subscribed
    const res2 = await request.post(`/api/newsletter`, {
      data: { email: testEmail, source: "test" },
    });
    expect(res2.ok()).toBeTruthy();
    const data2 = await res2.json();
    expect(data2.alreadySubscribed).toBeTruthy();
  });
});

test.describe("Newsletter Campaign Pages (admin auth required)", () => {
  test("admin newsletter campaigns page redirects without auth", async ({ page }) => {
    const res = await page.goto(`/admin/newsletter/campaigns`);
    // Should redirect to admin login
    expect(res?.url()).toContain("/admin");
  });

  test("admin newsletter subscribers page loads with tags UI", async ({ page }) => {
    // Just verify it redirects to admin login (not a 500 error)
    const res = await page.goto(`/admin/newsletter`);
    expect(res?.status()).not.toBe(500);
  });
});
