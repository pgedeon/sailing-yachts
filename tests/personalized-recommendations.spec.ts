import { test, expect } from "@playwright/test";

test.describe("Personalized Recommendations (P9.6)", () => {
  test.describe("Homepage - guest user", () => {
    test("homepage loads without personalized recommendations for guests", async ({ page }) => {
      await page.goto("http://localhost:3000/");
      // Guest users should not see the personalized recommendations section
      const recSection = page.locator('[data-testid="personalized-recommendations"]');
      await expect(recSection).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Account Dashboard - guest user", () => {
    test("account page shows login prompt for guests", async ({ page }) => {
      await page.goto("http://localhost:3000/account");
      await expect(page.locator("text=Sign in Required")).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Recommendations API", () => {
    test("API returns 401 for unauthenticated users", async ({ request }) => {
      const response = await request.get("http://localhost:3000/api/user/recommendations");
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });
  });
});
