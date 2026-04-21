import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

test.describe("Admin Auth & Security", () => {
  test("admin page shows login form when not authenticated", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    // Should show the login form
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("admin login form rejects invalid credentials", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await page.waitForTimeout(2000);
    // Page should still show login form (not dashboard)
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test("login form has email field, not username", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Should NOT have username field
    const usernameInput = page.locator('input[name="username"]');
    await expect(usernameInput).toHaveCount(0);
  });

  test("admin sub-pages redirect to login when not authenticated", async ({ page }) => {
    await page.goto(`${BASE}/admin/yachts`);
    // Should redirect to /admin login page
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10000 });
  });

  test("admin API routes return 401 when not authenticated", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/yachts`);
    expect([401, 302, 307]).toContain(response.status());
  });

  test("admin audit logs API returns 401 when not authenticated", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/audit-logs`);
    expect([401, 302, 307]).toContain(response.status());
  });
});

test.describe("Admin Security Headers", () => {
  test("admin pages have security headers", async ({ request }) => {
    const response = await request.get(`${BASE}/admin`);

    // Security headers should be present
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("admin API routes have security headers", async ({ request }) => {
    // This will return 401 but should still have security headers
    const response = await request.get(`${BASE}/api/admin/yachts`);

    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
  });

  test("public pages do NOT have admin security headers", async ({ request }) => {
    const response = await request.get(`${BASE}/`);

    // Public pages should not have X-Frame-Options: DENY
    expect(response.headers()["x-frame-options"]).toBeFalsy();
  });
});

test.describe("Public Access", () => {
  test("public pages remain accessible without auth", async ({ request }) => {
    const pages = ["/", "/yachts", "/search", "/compare"];
    for (const path of pages) {
      const response = await request.get(`${BASE}${path}`);
      expect(response.ok(), `${path} should be accessible`).toBeTruthy();
    }
  });

  test("public API routes remain accessible without auth", async ({ request }) => {
    const routes = ["/api/yachts", "/api/manufacturers"];
    for (const path of routes) {
      const response = await request.get(`${BASE}${path}`);
      expect(response.ok(), `${path} should be accessible`).toBeTruthy();
    }
  });

  test("next-auth endpoints are available", async ({ request }) => {
    const response = await request.get(`${BASE}/api/auth/csrf`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.csrfToken).toBeDefined();
  });

  test("next-auth providers endpoint lists credentials", async ({ request }) => {
    const response = await request.get(`${BASE}/api/auth/providers`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.credentials).toBeDefined();
  });
});

test.describe("Session Security", () => {
  test("admin dashboard inaccessible without valid session", async ({ page }) => {
    await page.goto(`${BASE}/admin/yachts`);

    // Should end up on login page
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10000 });
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
