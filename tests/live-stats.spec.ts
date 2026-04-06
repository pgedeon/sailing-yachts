import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://sailing-yachts.vercel.app';

test.describe('Live Site Stats', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('homepage should display live yacht count (not hardcoded 1,000+)', async ({ page }) => {
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

  test('FAQ should have live yacht count in answer', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Find the FAQ answer about yacht count
    const faqSection = page.locator('section:has-text("Frequently Asked Questions")');
    const faqText = await faqSection.textContent();

    expect(faqText).toBeDefined();
    // FAQ should mention the actual database size, not "over 1,000"
    expect(faqText).not.toContain('over 1,000');
    expect(faqText).not.toContain('over 1,000');

    // Should contain a realistic count (200-300 range)
    const countMatch = faqText?.match(/(\d+)\s+sailing\s+yacht/i);
    expect(countMatch).toBeDefined();
    const count = parseInt(countMatch?.[1] || '0', 10);
    expect(count).toBeGreaterThan(100);
    expect(count).toBeLessThan(500);
  });

  test('page metadata should have live yacht count', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check description meta tag
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeDefined();
    // Should not contain "1,000+ boats" (old hardcoded)
    expect(description).not.toContain('1,000+ boats');
    expect(description).not.toMatch(/1,000\+/);

    // Should contain a sailing yachts phrase
    const countMatch = description?.match(/(\d+)\+\s+sailing\s+yachts/i);
    expect(countMatch).toBeDefined();
    const count = parseInt(countMatch?.[1] || '0', 10);
    expect(count).toBeGreaterThan(100);
    expect(count).toBeLessThan(500);
  });

  test('OpenGraph description should have live yacht count', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check og:description meta tag
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeDefined();
    // Should not contain "1,000+"
    expect(ogDescription).not.toMatch(/1,000\+/);

    // Should contain a sailing yachts phrase
    const countMatch = ogDescription?.match(/(\d+)\+\s+sailing\s+yachts/i);
    expect(countMatch).toBeDefined();
    const count = parseInt(countMatch?.[1] || '0', 10);
    expect(count).toBeGreaterThan(100);
    expect(count).toBeLessThan(500);
  });

  test('Twitter card description should have live yacht count', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check twitter:description meta tag
    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content');
    expect(twitterDescription).toBeDefined();
    // Should not contain "1,000+"
    expect(twitterDescription).not.toMatch(/1,000\+/);

    // Should contain a sailing yachts phrase
    const countMatch = twitterDescription?.match(/(\d+)\+\s+sailing\s+yachts/i);
    expect(countMatch).toBeDefined();
    const count = parseInt(countMatch?.[1] || '0', 10);
    expect(count).toBeGreaterThan(100);
    expect(count).toBeLessThan(500);
  });

  test('JSON-LD FAQ schema should have live yacht count', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Get JSON-LD scripts
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();

    let faqJsonLd = null;
    for (const script of jsonLdScripts) {
      const content = await script.textContent();
      if (content?.includes('"@type": "FAQPage"')) {
        faqJsonLd = JSON.parse(content!);
        break;
      }
    }

    expect(faqJsonLd).not.toBeNull();
    expect(faqJsonLd?.mainEntity).toBeDefined();
    expect(Array.isArray(faqJsonLd.mainEntity)).toBe(true);

    // Find the yacht count question
    const yachtCountQuestion = faqJsonLd.mainEntity.find(
      (q: any) => q.name === 'How many yachts are in the database?'
    );
    expect(yachtCountQuestion).toBeDefined();

    const answerText = yachtCountQuestion.acceptedAnswer.text;
    // Should not contain "over 1,000"
    expect(answerText).not.toContain('over 1,000');
    expect(answerText).not.toMatch(/over\s+1,000/);

    // Should contain a realistic count
    const countMatch = answerText?.match(/(\d+)\s+sailing\s+yacht/i);
    expect(countMatch).toBeDefined();
    const count = parseInt(countMatch?.[1] || '0', 10);
    expect(count).toBeGreaterThan(100);
    expect(count).toBeLessThan(500);
  });

  test('top manufacturers should show dynamic yacht counts', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Find manufacturer cards
    const manufacturerCards = page.locator('section:has-text("Popular Manufacturers") a[href*="/manufacturers/"]');

    const count = await manufacturerCards.count();
    expect(count).toBeGreaterThan(0);

    // Check a few cards to ensure they have model counts
    const firstCard = manufacturerCards.first();
    const cardText = await firstCard.textContent();
    expect(cardText).toBeDefined();
    // Should contain "model" or "models"
    expect(cardText).toMatch(/model/);
  });
});
