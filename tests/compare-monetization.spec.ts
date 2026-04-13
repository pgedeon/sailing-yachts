import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

test.describe("Compare Page Monetization", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("hides monetization when no yachts selected", async ({ page }) => {
    await page.goto(`${BASE_URL}/compare`);
    await page.waitForLoadState("networkidle");

    // No yachts selected - monetization should not appear
    const monetizationSection = page.locator(".compare-monetization");
    await expect(monetizationSection).not.toBeVisible();
  });

  test("shows monetization CTAs when 2+ yachts are selected", async ({ page }) => {
    // Use valid yacht IDs (26,27 exist in the database)
    await page.goto(`${BASE_URL}/compare?ids=26,27`);
    await page.waitForLoadState("networkidle");

    // Wait for comparison table or error to resolve
    await page.waitForSelector("table", { timeout: 20000 }).catch(() => {});

    // Check that the monetization section appears
    const monetizationSection = page.locator(".compare-monetization");
    await expect(monetizationSection).toBeVisible({ timeout: 10000 });

    // Check contextual CTA banner
    await expect(page.locator("text=Still deciding?")).toBeVisible();

    // Check service CTAs
    await expect(page.locator("[data-testid='cta-insurance']")).toBeVisible();
    await expect(page.locator("[data-testid='cta-charter-demo']")).toBeVisible();
    await expect(page.locator("[data-testid='cta-financing']")).toBeVisible();

    // Check Recommended Gear tab
    await expect(page.locator("text=Recommended Gear")).toBeVisible();
  });

  test("opens inquiry modal when Talk to a Broker is clicked", async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=26,27`);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("table", { timeout: 20000 }).catch(() => {});

    // Click the Talk to a Broker button in the banner
    await page.locator("text=Talk to a Broker").first().click();

    // Check modal appears
    await expect(page.locator("text=Request More Information")).toBeVisible();

    // Check inquiry form fields
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();

    // Check yacht summary in modal
    await expect(page.locator("text=Inquiring about:")).toBeVisible();
  });

  test("insurance CTA has correct link", async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=26,27`);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("table", { timeout: 20000 }).catch(() => {});

    const insuranceCta = page.locator("[data-testid='cta-insurance']");
    await expect(insuranceCta).toBeVisible();
    await expect(insuranceCta).toHaveAttribute("href", "https://www.sailboats.fr/insurance");
  });

  test("charter CTA has correct link", async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=26,27`);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("table", { timeout: 20000 }).catch(() => {});

    const charterCta = page.locator("[data-testid='cta-charter-demo']");
    await expect(charterCta).toBeVisible();
    await expect(charterCta).toHaveAttribute("href", "https://www.sailboats.fr/charter");
  });
});
