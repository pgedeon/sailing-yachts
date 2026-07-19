import { test, expect } from "@playwright/test";

/**
 * Comprehensive Admin Section Tests
 *
 * Tests all admin pages and API routes for:
 * 1. Auth protection (unauthenticated users get redirected/login form, not data)
 * 2. API auth enforcement (all /api/admin/* return 401 without session)
 * 3. No server errors on authenticated pages (no 500s)
 * 4. Security headers on admin routes
 *
 * Runs against the live site by default.
 * Set PLAYWRIGHT_BASE_URL for local testing.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

// ─── All admin page routes (from app/admin directory structure) ───
const ADMIN_PAGES = [
  "/admin",
  "/admin/manufacturers",
  "/admin/manufacturers/new",
  "/admin/yachts",
  "/admin/yachts/new",
  "/admin/premium",
  "/admin/prices",
  "/admin/prices/import",
  "/admin/prices/aggregate",
  "/admin/reviews",
  "/admin/reviews/new",
  "/admin/review-sources",
  "/admin/review-sources/new",
  "/admin/spec-categories",
  "/admin/spec-categories/new",
  "/admin/leads",
  "/admin/newsletter",
  "/admin/newsletter/campaigns",
  "/admin/guides",
  "/admin/guides/new",
  "/admin/completeness",
  "/admin/image-coverage",
  "/admin/validation",
  "/admin/vitals",
  "/admin/descriptions",
  "/admin/enrichment",
  "/admin/featured",
  "/admin/analytics",
  "/admin/ab-testing",
  "/admin/funnel",
  "/admin/search-analytics",
  "/admin/competitive-positioning",
  "/admin/reports",
  "/admin/security",
  "/admin/translations",
  "/admin/affiliate-tracking",
];

// ─── All admin API routes ───
const ADMIN_APIS = [
  "/api/admin/yachts",
  "/api/admin/manufacturers",
  "/api/admin/manufacturers/premium",
  "/api/admin/reviews",
  "/api/admin/review-sources",
  "/api/admin/spec-categories",
  "/api/admin/prices/aggregate",
  "/api/admin/leads",
  "/api/admin/guides",
  "/api/admin/newsletter",
  "/api/admin/newsletter/campaigns",
  "/api/admin/newsletter/analytics",
  "/api/admin/completeness",
  "/api/admin/image-coverage",
  "/api/admin/validation",
  "/api/admin/descriptions",
  "/api/admin/enrichment",
  "/api/admin/featured",
  "/api/admin/analytics",
  "/api/admin/ab-testing",
  "/api/admin/funnel",
  "/api/admin/search-analytics",
  "/api/admin/competitive-positioning",
  "/api/admin/reports",
  "/api/admin/security",
  "/api/admin/translations",
  "/api/admin/affiliate-tracking",
  "/api/admin/vitals",
  "/api/admin/audit-logs",
  "/api/admin/corrections",
  "/api/admin/flags",
  "/api/admin/imports",
  "/api/admin/media",
  "/api/admin/generate-description",
  "/api/admin/query-benchmark",
  "/api/admin/manufacturer-spotlights",
];

// ═══════════════════════════════════════════════════════
// SECTION 1: Page Auth Protection (unauthenticated)
// ═══════════════════════════════════════════════════════

test.describe("Admin Pages — Auth Protection", () => {
  for (const path of ADMIN_PAGES) {
    test(`${path} requires authentication`, async ({ request }) => {
      const response = await request.get(`${BASE}${path}`, {
        maxRedirects: 0, // Don't follow redirects
      });

      // Acceptable: 307 redirect to /admin (login), or 200 showing login form
      // NOT acceptable: 200 showing admin dashboard content
      const status = response.status();

      if (status === 307 || status === 302) {
        // Redirect — should go to /admin login
        const location = response.headers()["location"] || "";
        expect(
          location.includes("/admin") || location.includes("signin"),
          `${path} redirects to ${location} — expected /admin or signin`
        ).toBeTruthy();
      } else if (status === 200) {
        // Must show login form, not admin content
        const body = await response.text();
        const hasLoginForm =
          body.includes('input[name="email"]') ||
          body.includes("AdminLoginForm") ||
          body.includes("Sign in");
        const hasAdminContent =
          body.includes("Admin Dashboard") &&
          !body.includes('input[name="email"]') &&
          !body.includes("AdminLoginForm");

        expect(
          hasLoginForm,
          `${path} returned 200 without auth — must show login form, not admin content`
        ).toBeTruthy();
        expect(
          !hasAdminContent || hasLoginForm,
          `${path} exposed admin dashboard content without authentication`
        ).toBeTruthy();
      } else {
        throw new Error(`${path} returned unexpected status ${status}`);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════
// SECTION 2: API Auth Enforcement
// ═══════════════════════════════════════════════════════

test.describe("Admin APIs — Auth Enforcement", () => {
  for (const path of ADMIN_APIS) {
    test(`GET ${path} returns 401 without session`, async ({ request }) => {
      const response = await request.get(`${BASE}${path}`);
      const status = response.status();

      expect(
        [401, 302, 307].includes(status),
        `${path} returned ${status} without auth — expected 401 or redirect`
      ).toBeTruthy();
    });
  }
});

// ═══════════════════════════════════════════════════════
// SECTION 3: No Server Errors (500)
// ═══════════════════════════════════════════════════════

test.describe("Admin Pages — No Server Errors", () => {
  for (const path of ADMIN_PAGES) {
    test(`${path} does not return 500`, async ({ request }) => {
      const response = await request.get(`${BASE}${path}`);
      expect(
        response.status(),
        `${path} returned ${response.status()} — server error`
      ).not.toBe(500);
      expect(
        response.status(),
        `${path} returned ${response.status()} — internal server error`
      ).not.toBe(502);
      expect(
        response.status(),
        `${path} returned ${response.status()} — service unavailable`
      ).not.toBe(503);
    });
  }
});

// ═══════════════════════════════════════════════════════
// SECTION 4: Security Headers
// ═══════════════════════════════════════════════════════

test.describe("Admin Security Headers", () => {
  test("admin pages have no-sniff header", async ({ request }) => {
    const response = await request.get(`${BASE}/admin`);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("admin pages have frame-deny header", async ({ request }) => {
    const response = await request.get(`${BASE}/admin`);
    const xfo = response.headers()["x-frame-options"];
    // Either X-Frame-Options: DENY or CSP frame-ancestors: 'none'
    const csp = response.headers()["content-security-policy"] || "";
    expect(
      xfo === "DENY" || csp.includes("frame-ancestors 'none'"),
      "Admin pages must prevent framing"
    ).toBeTruthy();
  });

  test("admin pages have HSTS header", async ({ request }) => {
    const response = await request.get(`${BASE}/admin`);
    const hsts = response.headers()["strict-transport-security"] || "";
    expect(hsts).toContain("max-age=");
  });

  test("admin pages have noindex meta", async ({ request }) => {
    const response = await request.get(`${BASE}/admin`);
    const body = await response.text();
    // Check for robots noindex either in meta tag or header
    const hasNoindex =
      body.includes('robots" content="noindex') ||
      response.headers()["x-robots-tag"]?.includes("noindex");
    expect(hasNoindex, "Admin pages should have noindex").toBeTruthy();
  });

  test("admin API routes have security headers", async ({ request }) => {
    // Even 401 responses should have security headers
    const response = await request.get(`${BASE}/api/admin/yachts`);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
  });
});

// ═══════════════════════════════════════════════════════
// SECTION 5: Login Form Functionality
// ═══════════════════════════════════════════════════════

test.describe("Admin Login Form", () => {
  test("login form is visible on /admin when unauthenticated", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("login form rejects invalid credentials", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    await page.fill('input[name="email"]', "attacker@example.com");
    await page.fill('input[name="password"]', "wrongpassword123");
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);
    // Should still be on login page
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test("login form uses email field, not username", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toHaveCount(0);
  });

  test("admin sub-pages redirect to login", async ({ page }) => {
    await page.goto(`${BASE}/admin/yachts`);
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10000 });
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════
// SECTION 6: Rate Limiting on Auth
// ═══════════════════════════════════════════════════════

test.describe("Admin Rate Limiting", () => {
  test("repeated failed logins are rate limited", async ({ request }) => {
    // Make multiple failed login attempts
    let rateLimited = false;
    for (let i = 0; i < 15; i++) {
      const response = await request.post(`${BASE}/api/auth/callback/credentials`, {
        data: {
          email: "test@example.com",
          password: "wrong",
          csrfToken: "invalid",
          callbackUrl: "/admin",
          json: true,
        },
      });
      if (response.status() === 429) {
        rateLimited = true;
        break;
      }
    }
    expect(rateLimited, "Should be rate limited after repeated failed logins").toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════
// SECTION 7: Public Routes Remain Accessible
// ═══════════════════════════════════════════════════════

test.describe("Public Routes Still Accessible", () => {
  const PUBLIC_PAGES = ["/", "/yachts", "/search", "/compare"];

  for (const path of PUBLIC_PAGES) {
    test(`${path} accessible without auth`, async ({ request }) => {
      const response = await request.get(`${BASE}${path}`);
      expect(response.ok(), `${path} should be accessible`).toBeTruthy();
    });
  }

  test("public API routes accessible without auth", async ({ request }) => {
    const routes = ["/api/yachts", "/api/manufacturers"];
    for (const path of routes) {
      const response = await request.get(`${BASE}${path}`);
      expect(response.ok(), `${path} should be accessible`).toBeTruthy();
    }
  });

  test("next-auth CSRF endpoint available", async ({ request }) => {
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

// ═══════════════════════════════════════════════════════
// SECTION 8: No Data Leakage in Error Responses
// ═══════════════════════════════════════════════════════

test.describe("No Data Leakage", () => {
  test("admin API 401 responses don't leak data", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/yachts`);
    if (response.status() === 401) {
      const body = await response.text();
      // Should not contain actual data
      expect(body).not.toMatch(/\{.*"id"\s*:/); // No JSON with id field
      expect(body).not.toMatch(/\{.*"email"\s*:/); // No email data
      expect(body).not.toMatch(/\{.*"price"\s*:/); // No price data
    }
  });

  test("admin API error responses are generic", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/manufacturers`);
    if (response.status() === 401) {
      const body = await response.json().catch(() => ({}));
      // Error message should be generic, not reveal internal structure
      const errorMsg = body.error || "";
      expect(errorMsg.length).toBeLessThan(100);
      expect(errorMsg.toLowerCase()).not.toContain("database");
      expect(errorMsg.toLowerCase()).not.toContain("sql");
      expect(errorMsg.toLowerCase()).not.toContain("stack");
    }
  });
});
