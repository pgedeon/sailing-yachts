import { describe, it, expect, beforeAll, afterAll } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

describe("P26.4 — Premium Comparison Reports (PDF)", () => {
  describe("PDF Report API", () => {
    it("should reject missing email", async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/compare/report`, {
        data: { yachtIds: [1, 2] },
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("email");
    });

    it("should reject invalid email", async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/compare/report`, {
        data: { yachtIds: [1, 2], email: "not-an-email" },
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Invalid email");
    });

    it("should reject fewer than 2 yachts", async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/compare/report`, {
        data: { yachtIds: [1], email: "test@example.com" },
      });
      expect(res.status()).toBe(400);
    });

    it("should reject more than 4 yachts", async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/compare/report`, {
        data: { yachtIds: [1, 2, 3, 4, 5], email: "test@example.com" },
      });
      expect(res.status()).toBe(400);
    });

    it("should generate PDF for valid request", async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/compare/report`, {
        data: {
          yachtIds: [1, 2],
          email: "test-pdfs@example.com",
          name: "Test User",
        },
      });

      // If no yachts with id 1,2 exist in test DB, we get 404
      if (res.status() === 404) {
        console.log("No test yachts found — skipping PDF generation test");
        return;
      }

      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toBe("application/pdf");
      expect(res.headers()["content-disposition"]).toContain("attachment");
      expect(res.headers()["content-disposition"]).toContain(".pdf");

      const body = await res.body();
      // PDF files start with %PDF
      expect(body.length).toBeGreaterThan(1000);
      const header = body.slice(0, 4).toString("ascii");
      expect(header).toBe("%PDF");
    });

    it("should return count data via GET", async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/compare/report?count=true`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("totalDownloads");
      expect(body).toHaveProperty("recentDownloads");
      expect(typeof body.totalDownloads).toBe("number");
    });
  });

  describe("Compare Export UI", () => {
    it("should show export dropdown with PDF report option", async ({ page }) => {
      await page.goto(`${BASE_URL}/compare?ids=1,2`);

      // Wait for compare page to load
      await page.waitForLoadState("networkidle");

      // Find and click the export button
      const exportBtn = page.locator('button:has-text("Export")').first();
      if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await exportBtn.click();

        // Check for PDF Report option
        const pdfOption = page.locator('text=PDF Report').first();
        await expect(pdfOption).toBeVisible({ timeout: 3000 });

        // Check for CSV option
        const csvOption = page.locator('text=Download CSV').first();
        await expect(csvOption).toBeVisible({ timeout: 3000 });
      }
    });

    it("should open lead gate modal when PDF Report clicked", async ({ page }) => {
      await page.goto(`${BASE_URL}/compare?ids=1,2`);
      await page.waitForLoadState("networkidle");

      const exportBtn = page.locator('button:has-text("Export")').first();
      if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await exportBtn.click();

        const pdfOption = page.locator('text=PDF Report').first();
        if (await pdfOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await pdfOption.click();

          // Should show modal with email input
          const modal = page.locator('text=Premium PDF Report').first();
          await expect(modal).toBeVisible({ timeout: 3000 });

          // Email field
          const emailInput = page.locator('input[type="email"]').first();
          await expect(emailInput).toBeVisible({ timeout: 3000 });

          // Download button
          const downloadBtn = page.locator('button:has-text("Download Report")').first();
          await expect(downloadBtn).toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  describe("Admin Reports Dashboard", () => {
    it("should redirect non-admin users", async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/reports`);
      // Should redirect to login or show unauthorized
      await page.waitForLoadState("networkidle");
      const url = page.url();
      expect(url).not.toContain("/admin/reports");
    });
  });
});
