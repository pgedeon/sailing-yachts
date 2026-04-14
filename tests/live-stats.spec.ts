import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://info.sailboats.fr";

test.describe("Live Site Stats", () => {
  test("homepage should display live yacht count (not hardcoded 1,000+)", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Hero section should mention sailing yachts with a live count
    const heroText = await page.locator('section:has-text("Sailing Yacht Specs & Comparison") p').first().textContent();
    expect(heroText).toBeDefined();

    // Should NOT contain the old hardcoded "1,000+ sailing yachts" claim
    expect(heroText).not.toContain('1,000+ sailing yachts');

    // Should contain a sailing yachts phrase with a realistic count (200-300 range based on current DB)
    const countMatch = heroText?.match(/(\d+)\+\s+sailing\s+yachts/i);
    expect(countMatch).toBeDefined();
    const count = parseInt(countMatch?.[1] || '0', 10);
    // Count should be in realistic range (not 1000+)
    expect(count).toBeGreaterThan(100);
    expect(count).toBeLessThan(500);
  });

  test("FAQ should have live yacht count in answer", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Find FAQ section
    const faqSection = page.locator('section:has-text("Frequently Asked Questions")');
    await expect(faqSection).toBeVisible();

    // Find the yacht count question
    const yachtQuestion = faqSection.locator('h3:has-text("How many yachts are in the database?")');
    await expect(yachtQuestion).toBeVisible();

    // Get the answer text
    const answerText = await yachtQuestion.locator('..').locator('p').textContent();
    expect(answerText).toBeDefined();

    // Should not contain old hardcoded claims
    expect(answerText).not.toContain('1,000+');
    expect(answerText).not.toContain('over 1,000');

    // Should contain realistic count
    const countMatch = answerText?.match(/(\d+)\s+sailing\s*yacht\s+models/i);
    expect(countMatch).toBeDefined();
    const count = parseInt(countMatch?.[1] || '0', 10);
    expect(count).toBeGreaterThan(50);
    expect(count).toBeLessThan(500);
  });

  test("top manufacturers should show dynamic yacht counts", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Find manufacturer cards
    const manufacturerCards = page.locator('section:has-text("Popular Manufacturers") a[href*="/manufacturers/"]');

    const count = await manufacturerCards.count();
    expect(count).toBeGreaterThan(0);

    // Check a few cards to ensure they have model counts
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = manufacturerCards.nth(i);
      const cardText = await card.textContent();
      expect(cardText).toBeDefined();
      // Should contain "model" or "models"
      expect(cardText).toMatch(/model/);
    }
  });

  test("homepage uses live yacht count in metadata", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check meta description contains live count
    const metaDescription = await page.locator('meta[name="description"]').first().getAttribute('content');
    expect(metaDescription).toBeDefined();

    // Should contain a count phrase
    const countMatch = metaDescription?.match(/(\d+)\+\s+sailing\s*yachts/);
    expect(countMatch).toBeDefined();
    const count = parseInt(countMatch?.[1] || '0', 10);
    expect(count).toBeGreaterThan(50);
    expect(count).toBeLessThan(500);
  });
});