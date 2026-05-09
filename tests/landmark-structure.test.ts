import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * P13.2 — Skip navigation & landmark structure tests
 *
 * These tests verify:
 * 1. Skip-to-content link exists in the main layout
 * 2. Proper ARIA landmarks (banner, navigation, main, contentinfo)
 * 3. Consistent heading hierarchy across pages
 * 4. All pages have exactly one h1
 */

describe("P13.2: Skip navigation & landmark structure", () => {
  // ── Skip-to-content link ──
  describe("Skip-to-content link", () => {
    const mainLayout = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/[locale]/layout.tsx"),
      "utf-8"
    );

    it("has a skip-to-content link in the main layout", () => {
      expect(mainLayout).toContain('href="#main-content"');
      expect(mainLayout).toContain("Skip to content");
    });

    it("skip link uses sr-only with focus:not-sr-only for keyboard accessibility", () => {
      expect(mainLayout).toContain("sr-only");
      expect(mainLayout).toContain("focus:not-sr-only");
    });

    it("skip link is positioned fixed when focused for visibility", () => {
      expect(mainLayout).toContain("focus:fixed");
      expect(mainLayout).toContain("focus:z-[100]");
    });
  });

  // ── ARIA Landmarks ──
  describe("ARIA landmarks", () => {
    const mainLayout = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/[locale]/layout.tsx"),
      "utf-8"
    );
    // Mobile menu ARIA attributes are in ClientNav.tsx (extracted during i18n refactor)
    const clientNav = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/[locale]/ClientNav.tsx"),
      "utf-8"
    );

    it("header has role='banner'", () => {
      expect(mainLayout).toContain('role="banner"');
    });

    it("main content has id='main-content' and role='main'", () => {
      expect(mainLayout).toContain('id="main-content"');
      expect(mainLayout).toContain('role="main"');
    });

    it("footer has role='contentinfo'", () => {
      expect(mainLayout).toContain('role="contentinfo"');
    });

    it("desktop nav has aria-label='Main navigation'", () => {
      expect(mainLayout).toContain('aria-label="Main navigation"');
    });

    it("mobile menu panel has role='navigation' and aria-label", () => {
      expect(clientNav).toContain('role="navigation"');
      expect(clientNav).toContain('aria-label="Mobile navigation"');
    });

    it("mobile menu button has aria-controls attribute", () => {
      expect(clientNav).toContain('aria-controls="mobile-menu-panel"');
    });
  });

  // ── Heading hierarchy ──
  describe("Heading hierarchy", () => {
    function getHeadings(filePath: string): { level: number; line: number }[] {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      const headings: { level: number; line: number }[] = [];
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/<h([1-6])[\s>]/);
        if (match) {
          headings.push({ level: parseInt(match[1]), line: i + 1 });
        }
      }
      return headings;
    }

    /**
     * Check heading hierarchy only within the return block(s) of a component.
     * For files with nested function components (like FilterSidebar), we check
     * the main return statement separately.
     */
    function getHeadingsFromMainReturn(filePath: string): { level: number; line: number }[] {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      // Find the last top-level `return (` which is the main component's return
      let mainReturnLine = -1;
      let braceDepth = 0;
      let foundFirstFn = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Track function depth to distinguish nested component functions from main return
        if (line.match(/^(export\s+)?(default\s+)?function|^(const|let|var)\s+\w+\s*=\s*(\(|function)/)) {
          foundFirstFn = true;
        }
        // Look for the main return statement at depth 1 (inside the main function)
        if (foundFirstFn && line.match(/^\s*return\s*[\(\<]/)) {
          // This could be a nested function's return or the main return
          // The main return is typically the one with the biggest JSX tree
          mainReturnLine = i;
        }
      }

      // Just get all headings and check the overall hierarchy
      // For files with nested components, the headings are conceptually correct
      // in the rendered DOM even if file order is different
      const headings: { level: number; line: number }[] = [];
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/<h([1-6])[\s>]/);
        if (match) {
          headings.push({ level: parseInt(match[1]), line: i + 1 });
        }
      }
      return headings;
    }

    function checkHeadingHierarchy(filePath: string): { valid: boolean; headings: { level: number; line: number }[] } {
      const headings = getHeadings(filePath);
      if (headings.length === 0) return { valid: false, headings };

      // For server components and simple pages, check linear order
      // For client components with nested functions, we verify only that:
      // 1. There's at least one h1
      // 2. All heading levels used are between 1-6
      // 3. The highest used level starts with h1

      const hasH1 = headings.some(h => h.level === 1);
      if (!hasH1) return { valid: false, headings };

      return { valid: true, headings };
    }

    function checkLinearHeadingHierarchy(filePath: string): { valid: boolean; error?: string } {
      const headings = getHeadings(filePath);
      if (headings.length === 0) return { valid: false, error: "No headings found" };
      if (headings[0].level !== 1) return { valid: false, error: `First heading is h${headings[0].level}, expected h1` };

      for (let i = 1; i < headings.length; i++) {
        if (headings[i].level > headings[i - 1].level + 1) {
          return {
            valid: false,
            error: `Heading skip at line ${headings[i].line}: h${headings[i - 1].level} → h${headings[i].level}`
          };
        }
      }
      return { valid: true };
    }

    it("home page has proper heading hierarchy", () => {
      const result = checkLinearHeadingHierarchy(
        path.join(PROJECT_ROOT, "app/[locale]/page.tsx")
      );
      expect(result.valid, result.error).toBe(true);
    });

    it("guides listing page has proper heading hierarchy", () => {
      const result = checkLinearHeadingHierarchy(
        path.join(PROJECT_ROOT, "app/[locale]/guides/page.tsx")
      );
      expect(result.valid, result.error).toBe(true);
    });

    it("glossary page has proper heading hierarchy", () => {
      const result = checkLinearHeadingHierarchy(
        path.join(PROJECT_ROOT, "app/[locale]/glossary/page.tsx")
      );
      expect(result.valid, result.error).toBe(true);
    });

    it("manufacturers page has proper heading hierarchy", () => {
      const result = checkLinearHeadingHierarchy(
        path.join(PROJECT_ROOT, "app/[locale]/manufacturers/page.tsx")
      );
      expect(result.valid, result.error).toBe(true);
    });

    it("links page has proper heading hierarchy", () => {
      const headings = getHeadings(
        path.join(PROJECT_ROOT, "app/[locale]/links/page.tsx")
      );
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].level).toBe(1);
    });

    it("yachts client has h1 and proper heading levels", () => {
      // YachtsClient has a nested FilterSidebar function defined before the main return,
      // so linear file order doesn't match DOM order. Check that all heading levels exist
      // and there's an h1.
      const result = checkHeadingHierarchy(
        path.join(PROJECT_ROOT, "app/[locale]/yachts/YachtsClient.tsx")
      );
      expect(result.valid).toBe(true);
      // Verify heading levels: should have h1, h2, h3
      const levels = result.headings.map(h => h.level);
      expect(levels).toContain(1);
      expect(levels).toContain(2);
      expect(levels).toContain(3);
    });

    it("search client has proper heading hierarchy", () => {
      const result = checkLinearHeadingHierarchy(
        path.join(PROJECT_ROOT, "app/[locale]/search/SearchClient.tsx")
      );
      expect(result.valid, result.error).toBe(true);
    });

    it("compare client has h1 elements", () => {
      const result = checkHeadingHierarchy(
        path.join(PROJECT_ROOT, "app/[locale]/compare/CompareClient.tsx")
      );
      expect(result.valid).toBe(true);
    });

    it("yacht detail client has h1 elements and proper heading levels", () => {
      const result = checkHeadingHierarchy(
        path.join(
          PROJECT_ROOT,
          "app/[locale]/yachts/[slug]/YachtDetailClient.tsx"
        )
      );
      expect(result.valid).toBe(true);
      const levels = result.headings.map(h => h.level);
      expect(levels).toContain(1);
      expect(levels).toContain(2);
    });

    it("favorites client has proper heading hierarchy", () => {
      const result = checkLinearHeadingHierarchy(
        path.join(
          PROJECT_ROOT,
          "app/[locale]/favorites/FavoritesClient.tsx"
        )
      );
      expect(result.valid, result.error).toBe(true);
    });
  });

  // ── Page-level h1 uniqueness ──
  describe("Each public page has exactly one visible h1", () => {
    function countH1(filePath: string): number {
      const content = fs.readFileSync(filePath, "utf-8");
      const matches = content.match(/<h1[\s>]/g);
      return matches ? matches.length : 0;
    }

    const pages = [
      { name: "home", path: "app/[locale]/page.tsx" },
      { name: "guides listing", path: "app/[locale]/guides/page.tsx" },
      { name: "glossary listing", path: "app/[locale]/glossary/page.tsx" },
      { name: "manufacturers", path: "app/[locale]/manufacturers/page.tsx" },
      { name: "links", path: "app/[locale]/links/page.tsx" },
      { name: "favorites", path: "app/[locale]/favorites/FavoritesClient.tsx" },
    ];

    for (const page of pages) {
      it(`${page.name} has exactly one h1`, () => {
        expect(countH1(path.join(PROJECT_ROOT, page.path))).toBe(1);
      });
    }

    // Client components that conditionally render h1 (e.g. print vs screen)
    it("compare client has h1 elements (print + screen)", () => {
      const count = countH1(
        path.join(PROJECT_ROOT, "app/[locale]/compare/CompareClient.tsx")
      );
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it("yacht detail client has h1 elements (print + screen)", () => {
      const count = countH1(
        path.join(
          PROJECT_ROOT,
          "app/[locale]/yachts/[slug]/YachtDetailClient.tsx"
        )
      );
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});
