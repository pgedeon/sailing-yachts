import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://info.sailboats.fr';

test.describe('Media Accessibility — P13.5', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  /**
   * Helper: Get all elements matching selector and return their accessibility attributes
   */
  async function getAccessibilityInfo(page: any, selector: string) {
    return page.$$eval(selector, (elements: Element[]) =>
      elements.map((el, idx) => ({
        index: idx,
        tagName: el.tagName.toLowerCase(),
        alt: el.getAttribute('alt'),
        ariaLabel: el.getAttribute('aria-label'),
        ariaHidden: el.getAttribute('aria-hidden'),
        role: el.getAttribute('role'),
        title: el.getAttribute('title'),
        hasTitleChild: el.querySelector('title') !== null,
        textContent: el.textContent?.substring(0, 50),
      }))
    );
  }

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Yachts listing', path: '/yachts' },
    { name: 'Search', path: '/search' },
    { name: 'Compare', path: '/compare' },
    { name: 'Manufacturers', path: '/manufacturers' },
    { name: 'Guides hub', path: '/guides' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name}: all <img> elements have alt text`, async ({ page }) => {
      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const images = await getAccessibilityInfo(page, 'img');
      
      for (const img of images) {
        // Every <img> must have an alt attribute (can be empty for decorative)
        expect(
          img.alt,
          `<img> at index ${img.index} on ${pageInfo.name} is missing alt attribute. Text: "${img.textContent}"`
        ).not.toBeNull();
      }
    });

    test(`${pageInfo.name}: decorative SVGs have aria-hidden`, async ({ page }) => {
      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const svgs = await getAccessibilityInfo(page, 'svg');
      
      for (const svg of svgs) {
        const isDecorative = !svg.ariaLabel && !svg.role && !svg.hasTitleChild;
        if (isDecorative) {
          expect(
            svg.ariaHidden,
            `Decorative <svg> at index ${svg.index} on ${pageInfo.name} should have aria-hidden="true"`
          ).toBe('true');
        }
      }
    });
  }

  test('Yacht detail page: images have meaningful alt text', async ({ page }) => {
    // Navigate to a yacht detail page
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click the first yacht link
    const firstYachtLink = page.locator('a[href^="/yachts/"]').first();
    if (await firstYachtLink.count() === 0) {
      test.skip();
      return;
    }
    
    await firstYachtLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const images = await getAccessibilityInfo(page, 'img');
    
    for (const img of images) {
      // Images on detail page should have meaningful alt text (not empty)
      expect(
        img.alt,
        `Image on yacht detail page at index ${img.index} has empty or missing alt text`
      ).toBeTruthy();
      expect(
        img.alt?.length,
        `Image on yacht detail page at index ${img.index} has too-short alt text: "${img.alt}"`
      ).toBeGreaterThan(2);
    }
  });

  test('Compare page: icon-only buttons have aria-labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find all buttons that contain only SVGs (icon-only)
    const iconButtons = await page.$$eval('button', (buttons: HTMLButtonElement[]) =>
      buttons
        .map((btn, idx) => {
          const textContent = btn.textContent?.trim() || '';
          const hasSvg = btn.querySelector('svg') !== null;
          const hasOnlyWhitespaceText = textContent.length === 0 || /^(|\s)$/.test(textContent);
          // Check if button only contains SVGs and whitespace
          const children = Array.from(btn.childNodes);
          const onlySvgAndText = children.every(child => {
            if (child.nodeType === 1) return (child as Element).tagName === 'svg' || (child as Element).tagName === 'SPAN';
            if (child.nodeType === 3) return !child.textContent?.trim();
            return false;
          });
          const isIconButton = hasSvg && hasOnlyWhitespaceText;
          
          return {
            idx,
            isIconButton,
            textContent: textContent.substring(0, 50),
            ariaLabel: btn.getAttribute('aria-label'),
            title: btn.getAttribute('title'),
          };
        })
        .filter(b => b.isIconButton)
    );

    for (const btn of iconButtons) {
      // Icon-only buttons must have aria-label or title
      expect(
        btn.ariaLabel || btn.title,
        `Icon-only button at index ${btn.idx} on compare page needs aria-label or title. Text: "${btn.textContent}"`
      ).toBeTruthy();
    }
  });

  test('No SVG without accessible name or aria-hidden', async ({ page }) => {
    await page.goto(`${BASE_URL}/yachts`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const svgs = await getAccessibilityInfo(page, 'svg');
    
    const problemSvgs = svgs.filter(svg => 
      !svg.ariaHidden && !svg.ariaLabel && !svg.role && !svg.hasTitleChild
    );

    expect(
      problemSvgs.length,
      `Found ${problemSvgs.length} SVGs without aria-hidden, aria-label, role, or <title>. Indices: ${problemSvgs.map(s => s.index).join(', ')}`
    ).toBe(0);
  });

  test('Search page: SVGs are properly hidden', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const svgs = await getAccessibilityInfo(page, 'svg');
    
    for (const svg of svgs) {
      const hasAccessibleName = svg.ariaLabel || svg.role || svg.hasTitleChild;
      if (!hasAccessibleName) {
        expect(
          svg.ariaHidden,
          `SVG at index ${svg.index} on search page has no accessible name and no aria-hidden`
        ).toBe('true');
      }
    }
  });
});
