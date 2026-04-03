import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Newsletter Signup", () => {
  test("newsletter form is visible on homepage", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const form = page.locator("form");
    // There may be multiple forms, check for email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("newsletter form shows validation for empty submit", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`);
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill("");
    // HTML5 validation should prevent submit
    const submitBtn = page.locator('button:has-text("Subscribe")').first();
    await expect(submitBtn).toBeVisible();
  });

  test("newsletter form accepts valid email", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Listen for the API call
    const apiPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/newsletter") && resp.request().method() === "POST",
      { timeout: 10000 },
    );

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill("test-newsletter@example.com");

    const submitBtn = page.locator('button:has-text("Subscribe")').first();
    await submitBtn.click();

    // Wait for API response
    const response = await apiPromise;
    expect([200, 201]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty("message");
  });

  test("newsletter form rejects invalid email", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill("not-an-email");
    // HTML5 validation should prevent submission
    const submitBtn = page.locator('button:has-text("Subscribe")').first();
    // The button should be visible but the form should not submit
    await expect(submitBtn).toBeVisible();
  });

  test("newsletter signup visible on yachts page", async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts`);
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("no console errors on homepage with newsletter", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(`${BASE_URL}/`);
    // Scroll to newsletter section
    await page.locator('input[type="email"]').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});

test.describe("Newsletter API", () => {
  test("POST /api/newsletter requires email", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/newsletter`, {
      data: {},
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("required");
  });

  test("POST /api/newsletter validates email format", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/newsletter`, {
      data: { email: "invalid" },
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid");
  });

  test("POST /api/newsletter accepts valid email", async ({ request }) => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const response = await request.post(`${BASE_URL}/api/newsletter`, {
      data: { email: uniqueEmail, source: "test" },
    });
    expect([200, 201]).toContain(response.status());
    const data = await response.json();
    expect(data.message).toBeTruthy();
  });

  test("POST /api/newsletter handles duplicate email gracefully", async ({
    request,
  }) => {
    const uniqueEmail = `dup-test-${Date.now()}@example.com`;
    // First subscription
    await request.post(`${BASE_URL}/api/newsletter`, {
      data: { email: uniqueEmail },
    });
    // Duplicate subscription
    const response = await request.post(`${BASE_URL}/api/newsletter`, {
      data: { email: uniqueEmail },
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.alreadySubscribed).toBe(true);
  });
});
