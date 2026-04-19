import { test, expect } from "@playwright/test";

test.describe("Compare Export API — Auth Required", () => {
  test("CSV export returns 401 without authentication", async ({ request }) => {
    const response = await request.get(
      "/api/compare/export?ids=26,27&format=csv"
    );
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toContain("Authentication required");
    expect(data.code).toBe("AUTH_REQUIRED");
  });

  test("JSON export returns 401 without authentication", async ({ request }) => {
    const response = await request.get(
      "/api/compare/export?ids=26,27&format=json"
    );
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.code).toBe("AUTH_REQUIRED");
  });

  test("Export rejects missing ids with 401 before validation", async ({
    request,
  }) => {
    const response = await request.get("/api/compare/export?format=csv");
    expect(response.status()).toBe(401);
  });
});

test.describe("Compare Export API — Input Validation (requires auth context)", () => {
  // Note: These validation tests check the API returns 401 since we can't
  // easily authenticate in Playwright API context. The validation logic
  // runs after auth check, so unauthenticated requests hit auth first.
  // Unit/integration tests would cover validation with mocked auth.

  test("Export endpoint requires ids parameter (returns 401 for unauthenticated)", async ({
    request,
  }) => {
    const response = await request.get("/api/compare/export?format=csv");
    expect(response.status()).toBe(401);
  });

  test("Export endpoint rejects single yacht (returns 401 for unauthenticated)", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/compare/export?ids=26&format=csv"
    );
    expect(response.status()).toBe(401);
  });

  test("Export endpoint rejects more than 4 yachts (returns 401 for unauthenticated)", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/compare/export?ids=1,2,3,4,5&format=csv"
    );
    expect(response.status()).toBe(401);
  });

  test("Export endpoint handles invalid ids (returns 401 for unauthenticated)", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/compare/export?ids=abc,def&format=csv"
    );
    expect(response.status()).toBe(401);
  });
});

test.describe("Compare Export UI", () => {
  test("Export button appears when 2+ yachts selected", async ({ page }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const exportButton = page.locator("button:has-text('Export')");
    await expect(exportButton).toBeVisible({ timeout: 10000 });
  });

  test("Export dropdown opens with CSV and PDF options", async ({ page }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const exportButton = page.locator("button:has-text('Export')");
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();

    await expect(page.locator("text=Download CSV")).toBeVisible();
    await expect(page.locator("text=Save as PDF")).toBeVisible();
  });

  test("Export dropdown shows sign-in hint for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const exportButton = page.locator("button:has-text('Export')");
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();

    // Should show auth hint in dropdown
    await expect(page.locator("text=Sign in to export")).toBeVisible();
  });

  test("CSV click shows auth prompt modal for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const exportButton = page.locator("button:has-text('Export')");
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();

    await page.locator("text=Download CSV").click();

    // Auth modal should appear
    await expect(
      page.locator("text=Sign in to export").last()
    ).toBeVisible({ timeout: 5000 });

    // Modal should have sign in button
    await expect(
      page.locator('button:has-text("Sign in to export")').last()
    ).toBeVisible();
  });

  test("PDF click shows auth prompt modal for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const exportButton = page.locator("button:has-text('Export')");
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();

    await page.locator("text=Save as PDF").click();

    // Auth modal should appear
    await expect(
      page.locator('button:has-text("Sign in to export")').last()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Auth prompt modal can be dismissed", async ({ page }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const exportButton = page.locator("button:has-text('Export')");
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();

    await page.locator("text=Download CSV").click();

    // Wait for modal
    const cancelButton = page.locator("button:has-text('Cancel')");
    await expect(cancelButton).toBeVisible({ timeout: 5000 });
    await cancelButton.click();

    // Modal should be gone
    await expect(
      page.locator('button:has-text("Sign in to export")')
    ).not.toBeVisible();
  });

  test("Export button hidden when no yachts selected", async ({ page }) => {
    await page.goto("/compare");
    await page.waitForLoadState("networkidle");

    const exportButton = page.locator("button:has-text('Export')");
    await expect(exportButton).not.toBeVisible();
  });
});

test.describe("Buyer Checklist UI", () => {
  test("Buyer checklist appears on compare page with 2+ yachts", async ({
    page,
  }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const checklist = page.locator('[data-testid="buyer-checklist"]');
    await expect(checklist).toBeVisible({ timeout: 10000 });
  });

  test("Buyer checklist shows yacht names", async ({ page }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const checklist = page.locator('[data-testid="buyer-checklist"]');
    await expect(checklist).toBeVisible({ timeout: 10000 });
    await expect(checklist.locator("text=Comparating")).toBeVisible();
  });

  test("Buyer checklist has progress bar", async ({ page }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const checklist = page.locator('[data-testid="buyer-checklist"]');
    await expect(checklist).toBeVisible({ timeout: 10000 });
    await expect(checklist.locator("text=0/19 items completed")).toBeVisible();
  });

  test("Buyer checklist items can be checked", async ({ page }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const checklist = page.locator('[data-testid="buyer-checklist"]');
    await expect(checklist).toBeVisible({ timeout: 10000 });

    // Check an item
    const firstCheckbox = checklist.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();

    // Progress should update
    await expect(checklist.locator("text=1/19 items completed")).toBeVisible();
  });

  test("Buyer checklist print button shows auth hint for unauthenticated", async ({
    page,
  }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const checklist = page.locator('[data-testid="buyer-checklist"]');
    await expect(checklist).toBeVisible({ timeout: 10000 });

    const printButton = checklist.locator("button:has-text('Print')");
    await printButton.click();

    // Should show auth hint
    await expect(
      checklist.locator("text=Sign in to print")
    ).toBeVisible({ timeout: 5000 });
  });

  test("Buyer checklist notes field works", async ({ page }) => {
    await page.goto("/compare?ids=26,27");
    await page.waitForLoadState("networkidle");

    const checklist = page.locator('[data-testid="buyer-checklist"]');
    await expect(checklist).toBeVisible({ timeout: 10000 });

    const notesField = checklist.locator("textarea");
    await notesField.fill("Check the keel bolts carefully");
    await expect(notesField).toHaveValue("Check the keel bolts carefully");
  });

  test("Buyer checklist not visible with fewer than 2 yachts", async ({
    page,
  }) => {
    await page.goto("/compare");
    await page.waitForLoadState("networkidle");

    const checklist = page.locator('[data-testid="buyer-checklist"]');
    await expect(checklist).not.toBeVisible();
  });
});
