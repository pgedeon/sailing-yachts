import { test, expect } from "@playwright/test";

test.describe("Print Spec Sheet Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the yachts listing and pick the first yacht
    await page.goto("/yachts");
    await page.waitForLoadState("networkidle");

    const firstYacht = page.locator('a[href^="/yachts/"]').first();
    await firstYacht.click();
    await page.waitForLoadState("networkidle");
  });

  test("print spec sheet button is visible on yacht detail page", async ({
    page,
  }) => {
    const printBtn = page.getByTestId("print-spec-sheet-btn");
    await expect(printBtn).toBeVisible();
    await expect(printBtn).toContainText("Print Spec Sheet");
  });

  test("print button has printer icon", async ({ page }) => {
    const printBtn = page.getByTestId("print-spec-sheet-btn");
    await expect(printBtn).toBeVisible();
    // Check for the lucide printer SVG icon
    const icon = printBtn.locator("svg");
    await expect(icon).toBeVisible();
  });

  test("print header and footer exist in DOM but are hidden on screen", async ({
    page,
  }) => {
    const printHeader = page.getByTestId("print-header");
    const printFooter = page.getByTestId("print-footer");

    // Elements should exist in DOM
    await expect(printHeader).toBeAttached();
    await expect(printFooter).toBeAttached();

    // But hidden on screen (display: none via .hidden class)
    await expect(printHeader).toBeHidden();
    await expect(printFooter).toBeHidden();

    // Print header should contain branding text
    expect(await printHeader.innerText()).toContain("Sailing Yachts Database");

    // Print footer should contain printed-from text
    expect(await printFooter.innerText()).toContain("Printed from");
  });

  test("print CSS is loaded via globals.css", async ({ page }) => {
    // Verify print-specific styles exist by checking computed styles in print mode
    // We emulate print media and check that header/footer are visible
    await page.emulateMedia({ media: "print" });

    const printHeader = page.getByTestId("print-header");
    const printFooter = page.getByTestId("print-footer");

    // After emulating print, these should become visible
    await expect(printHeader).toBeVisible({ timeout: 5000 });
    await expect(printFooter).toBeVisible({ timeout: 5000 });
  });

  test("interactive elements are hidden in print mode", async ({ page }) => {
    await page.emulateMedia({ media: "print" });

    // Back to Browse button should be hidden (has no-print class)
    const backBtn = page.locator("text=Back to Browse");
    const backVisible = await backBtn.isVisible().catch(() => false);
    expect(backVisible).toBe(false);

    // Print Spec Sheet button should be hidden
    const printBtn = page.getByTestId("print-spec-sheet-btn");
    const printBtnVisible = await printBtn.isVisible().catch(() => false);
    expect(printBtnVisible).toBe(false);

    // Compare This Yacht button should be hidden
    const compareBtn = page.locator("text=Compare This Yacht");
    const compareVisible = await compareBtn.isVisible().catch(() => false);
    expect(compareVisible).toBe(false);
  });

  test("spec sections are visible in print mode", async ({ page }) => {
    await page.emulateMedia({ media: "print" });

    // The yacht title should still be visible
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();

    // Spec groups should be present
    const specItems = page.locator(".spec-item");
    const count = await specItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("print spec sheet button triggers window.print", async ({ page }) => {
    // Listen for the beforeprint event to confirm print was triggered
    const printTriggered = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        window.addEventListener("beforeprint", () => resolve(true), {
          once: true,
        });
        // Timeout fallback
        setTimeout(() => resolve(false), 3000);
      });
    });

    const printBtn = page.getByTestId("print-spec-sheet-btn");
    await printBtn.click();

    const wasTriggered = await printTriggered;
    expect(wasTriggered).toBe(true);
  });
});
