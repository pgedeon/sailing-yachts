import { test, expect } from "@playwright/test";

test.describe("Lead Form — Yacht Detail", () => {
  test("shows dealer inquiry and price request buttons on yacht detail", async ({ page }) => {
    // Navigate to a yacht detail page
    const res = await page.goto("https://info.sailboats.fr/yachts");
    await page.waitForLoadState("networkidle");

    // Click the first yacht link
    const firstYacht = page.locator("a[href^='/yachts/']").first();
    if (await firstYacht.isVisible()) {
      await firstYacht.click();
      await page.waitForLoadState("networkidle");

      // Check for lead form buttons
      const dealerBtn = page.getByRole("button", { name: /Ask a Dealer/i });
      const priceBtn = page.getByRole("button", { name: /Request Market Pricing/i });

      await expect(dealerBtn).toBeVisible({ timeout: 5000 });
      await expect(priceBtn).toBeVisible({ timeout: 5000 });
    }
  });

  test("lead form opens and validates on yacht detail", async ({ page }) => {
    await page.goto("https://info.sailboats.fr/yachts");
    await page.waitForLoadState("networkidle");

    const firstYacht = page.locator("a[href^='/yachts/']").first();
    if (await firstYacht.isVisible()) {
      await firstYacht.click();
      await page.waitForLoadState("networkidle");

      const dealerBtn = page.getByRole("button", { name: /Ask a Dealer/i });
      await dealerBtn.click();

      // Form should appear
      const form = page.locator("form").first();
      await expect(form).toBeVisible({ timeout: 3000 });

      // Submit without filling - should show validation
      const submitBtn = form.getByRole("button", { name: /Send Inquiry/i });
      await submitBtn.click();

      // HTML5 validation should prevent submission
      const nameInput = form.locator('input[placeholder="Your name *"]');
      await expect(nameInput).toBeVisible();
    }
  });
});

test.describe("Lead Form — Compare Page", () => {
  test("shows Find Similar button on compare page", async ({ page }) => {
    await page.goto("https://info.sailboats.fr/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const findSimilarBtn = page.getByRole("button", { name: /Find Similar/i });
    await expect(findSimilarBtn).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Lead API", () => {
  test("POST /api/leads creates a lead with attribution", async ({ request }) => {
    const res = await request.post("https://info.sailboats.fr/api/leads", {
      data: {
        name: "Test User",
        email: "test@example.com",
        phone: "+1234567890",
        message: "I'm interested in this yacht",
        yachtIds: "26",
        leadType: "dealer_inquiry",
        pageUrl: "https://info.sailboats.fr/yachts/test-yacht",
        referrer: "https://google.com",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "spring_sale",
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.leadId).toBeDefined();
  });

  test("POST /api/leads rejects missing fields", async ({ request }) => {
    const res = await request.post("https://info.sailboats.fr/api/leads", {
      data: { name: "Test" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/leads rejects invalid email", async ({ request }) => {
    const res = await request.post("https://info.sailboats.fr/api/leads", {
      data: {
        name: "Test",
        email: "not-an-email",
        yachtIds: "26",
      },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("Admin Leads Page", () => {
  test("admin leads page loads", async ({ page }) => {
    await page.goto("https://info.sailboats.fr/admin/leads");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toContainText("Lead Management");
  });
});
