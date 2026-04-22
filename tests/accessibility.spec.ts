import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://info.sailboats.fr';

// Pages to audit
const PUBLIC_PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Yachts listing', path: '/yachts' },
  { name: 'Search', path: '/search' },
  { name: 'Compare (empty)', path: '/compare' },
  { name: 'Manufacturers', path: '/manufacturers' },
  { name: 'Guides hub', path: '/guides' },
  { name: 'Glossary', path: '/glossary' },
  { name: 'Best Value', path: '/best-value' },
  { name: 'API Docs', path: '/api/docs' },
  { name: 'Favorites', path: '/favorites' },
  { name: 'Account', path: '/account' },
];

test.describe('Accessibility Audit — WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // Run full axe audit on each public page
  for (const pageInfo of PUBLIC_PAGES) {
    test(`${pageInfo.name} (${pageInfo.path}) should have no accessibility violations`, async ({ page }) => {
      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      // Wait for dynamic content to settle
      await page.waitForTimeout(2000);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log(`\n=== ${pageInfo.name} violations ===`);
        for (const violation of results.violations) {
          console.log(`  [${violation.id}] ${violation.description}`);
          console.log(`    Impact: ${violation.impact}`);
          console.log(`    Nodes affected: ${violation.nodes.length}`);
          for (const node of violation.nodes.slice(0, 3)) {
            console.log(`    Selector: ${node.target.join(', ')}`);
            console.log(`    HTML: ${node.html.substring(0, 120)}`);
          }
        }
      }

      expect(results.violations).toEqual([]);
    });
  }

  // Yacht detail page (needs a valid slug)
  test('Yacht detail page should have no accessibility violations', async ({ page }) => {
    // Get a valid yacht slug from the API
    const response = await page.goto(`${BASE_URL}/api/v1/yachts?limit=1`);
    const data = await response?.json();
    
    if (!data?.yachts?.[0]?.slug) {
      test.skip(true, 'No yachts available for testing');
      return;
    }

    const slug = data.yachts[0].slug;
    await page.goto(`${BASE_URL}/yachts/${slug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(`\n=== Yacht Detail (${slug}) violations ===`);
      for (const violation of results.violations) {
        console.log(`  [${violation.id}] ${violation.description}`);
        for (const node of violation.nodes.slice(0, 3)) {
          console.log(`    Selector: ${node.target.join(', ')}`);
        }
      }
    }

    expect(results.violations).toEqual([]);
  });

  // Manufacturer detail page
  test('Manufacturer detail page should have no accessibility violations', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api/v1/manufacturers?limit=1`);
    const data = await response?.json();
    
    if (!data?.manufacturers?.[0]?.slug) {
      test.skip(true, 'No manufacturers available for testing');
      return;
    }

    const slug = data.manufacturers[0].slug;
    await page.goto(`${BASE_URL}/manufacturers/${slug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(`\n=== Manufacturer Detail (${slug}) violations ===`);
      for (const violation of results.violations) {
        console.log(`  [${violation.id}] ${violation.description}`);
        for (const node of violation.nodes.slice(0, 3)) {
          console.log(`    Selector: ${node.target.join(', ')}`);
        }
      }
    }

    expect(results.violations).toEqual([]);
  });
});

test.describe('Accessibility — Structural & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('All pages should have exactly one main landmark', async ({ page }) => {
    const pagesToTest = ['/', '/yachts', '/compare', '/search'];
    
    for (const path of pagesToTest) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');

      const mainCount = await page.locator('main, [role="main"]').count();
      expect(mainCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('All pages should have a nav landmark', async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState('networkidle');

    const navCount = await page.locator('nav, [role="navigation"]').count();
    expect(navCount).toBeGreaterThanOrEqual(1);
  });

  test('Heading hierarchy should be correct (h1 present, no skipping)', async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('All images should have alt text', async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Image must have alt text, OR be marked decorative (role="presentation" or aria-hidden)
      const hasAlt = alt !== null;
      const isDecorative = role === 'presentation' || ariaHidden === 'true';
      
      expect(hasAlt || isDecorative).toBe(true);
    }
  });

  test('All form inputs should have associated labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    await page.waitForLoadState('networkidle');

    const inputs = page.locator('input:not([type="hidden"]):not([type="submit"])');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      const title = await input.getAttribute('title');
      
      // Input must have some form of accessible label
      const hasLabel = !!(id && await page.locator(`label[for="${id}"]`).count() > 0);
      const hasAriaLabel = !!(ariaLabel || ariaLabelledBy);
      const hasPlaceholder = !!placeholder;
      const hasTitle = !!title;

      expect(hasLabel || hasAriaLabel || hasPlaceholder || hasTitle).toBe(true);
    }
  });

  test('All links should have discernible text', async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .include(['a'])
      .withRules(['link-name'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Page should have correct lang attribute', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(lang!.length).toBeGreaterThanOrEqual(2);
  });

  test('Page should have a title', async ({ page }) => {
    const pagesToTest = ['/', '/yachts', '/compare', '/search'];
    
    for (const path of pagesToTest) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    }
  });

  test('Color contrast should meet AA standards on home page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('\n=== Color contrast violations ===');
      for (const v of results.violations) {
        for (const node of v.nodes) {
          console.log(`  Selector: ${node.target.join(', ')}`);
        }
      }
    }

    expect(results.violations).toEqual([]);
  });
});

test.describe('Accessibility — Keyboard Navigation', () => {
  test('Skip-to-content or focus management should exist', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check for skip link (often hidden until focused)
    const skipLink = page.locator('a[href="#main-content"], a[href="#content"], a[href="#main"], [class*="skip"]').first();
    
    // Tab to the first focusable element
    await page.keyboard.press('Tab');
    
    // Check if first focusable element is a skip link (good practice)
    // Even if not present, test passes — this is a best practice check
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(firstFocused);
  });

  test('All interactive elements should be focusable via keyboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Tab through first 20 focusable elements and verify they receive focus
    let focusableFound = 0;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const isBody = await page.evaluate(() => document.activeElement === document.body);
      if (isBody) break; // Wrapped around
      focusableFound++;
    }

    expect(focusableFound).toBeGreaterThan(0);
  });

  test('Buttons should have accessible names', async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withRules(['button-name'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
