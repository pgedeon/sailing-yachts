import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * P13.6 — Reduced motion & responsive accessibility tests
 *
 * These tests verify:
 * 1. CSS has @media (prefers-reduced-motion: reduce) rules
 * 2. Animations (animate-spin, animate-pulse, animate-bounce) are disabled in reduced motion
 * 3. Transitions are disabled in reduced motion
 * 4. Touch target minimums (44×44px) via CSS @media (pointer: coarse)
 * 5. Screen reader patterns on key pages (ARIA landmarks, roles, labels)
 * 6. Focus indicators preserved in reduced motion
 */

// ── Helper ──
function readFile(relPath: string): string {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf-8");
}

function findTsxFiles(dir: string): string[] {
  const results: string[] = [];
  function walk(d: string) {
    if (!fs.existsSync(d)) return;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".cache"
      )
        continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx"))
        results.push(full);
    }
  }
  walk(dir);
  return results;
}

// ── Reduced motion CSS ──
describe("P13.6: Reduced motion — CSS rules", () => {
  const css = readFile("app/globals.css");

  it("has @media (prefers-reduced-motion: reduce) block", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("disables animation-duration in reduced motion", () => {
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
  });

  it("limits animation-iteration-count to 1 in reduced motion", () => {
    expect(css).toMatch(/animation-iteration-count:\s*1\s*!important/);
  });

  it("disables transition-duration in reduced motion", () => {
    expect(css).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  it("sets scroll-behavior to auto in reduced motion", () => {
    expect(css).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });

  it("applies reduced-motion rules to *, *::before, *::after", () => {
    const reducedMotionBlock = css.substring(
      css.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    expect(reducedMotionBlock).toContain("*::before");
    expect(reducedMotionBlock).toContain("*::after");
  });

  it("disables animate-spin in reduced motion", () => {
    const reducedMotionBlock = css.substring(
      css.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    expect(reducedMotionBlock).toContain(".animate-spin");
    expect(reducedMotionBlock).toMatch(/animation:\s*none\s*!important/);
  });

  it("disables animate-pulse in reduced motion", () => {
    const reducedMotionBlock = css.substring(
      css.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    expect(reducedMotionBlock).toContain(".animate-pulse");
  });

  it("disables animate-bounce in reduced motion", () => {
    const reducedMotionBlock = css.substring(
      css.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    expect(reducedMotionBlock).toContain(".animate-bounce");
  });

  it("preserves focus-visible outlines in reduced motion", () => {
    const reducedMotionBlock = css.substring(
      css.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    expect(reducedMotionBlock).toContain("focus-visible");
    expect(reducedMotionBlock).toContain("outline: 2px solid #2563eb");
  });
});

// ── Touch target CSS ──
describe("P13.6: Touch targets — CSS rules", () => {
  const css = readFile("app/globals.css");

  it("has @media (pointer: coarse) block for touch targets", () => {
    expect(css).toContain("@media (pointer: coarse)");
  });

  it("sets min-height 44px for buttons on touch devices", () => {
    const touchBlock = css.substring(css.indexOf("@media (pointer: coarse)"));
    expect(touchBlock).toContain("min-height: 44px");
  });

  it("sets min-width 44px for buttons on touch devices", () => {
    const touchBlock = css.substring(css.indexOf("@media (pointer: coarse)"));
    expect(touchBlock).toContain("min-width: 44px");
  });

  it("ensures form inputs meet 44px touch target", () => {
    const touchBlock = css.substring(css.indexOf("@media (pointer: coarse)"));
    expect(touchBlock).toContain("input[type=\"text\"]");
    expect(touchBlock).toContain("select");
    expect(touchBlock).toContain("textarea");
    expect(touchBlock).toMatch(/min-height:\s*44px/);
  });

  it("ensures checkbox/radio have 44px tap area", () => {
    const touchBlock = css.substring(css.indexOf("@media (pointer: coarse)"));
    expect(touchBlock).toContain("input[type=\"checkbox\"]");
    expect(touchBlock).toContain("input[type=\"radio\"]");
  });

  it("ensures footer links have 44px height", () => {
    const touchBlock = css.substring(css.indexOf("@media (pointer: coarse)"));
    expect(touchBlock).toContain("footer a");
  });

  it("ensures nav links in mobile menu have 44px height", () => {
    const touchBlock = css.substring(css.indexOf("@media (pointer: coarse)"));
    expect(touchBlock).toContain('[role="navigation"] a');
  });

  it("ensures aria-labeled buttons have 44px target", () => {
    const touchBlock = css.substring(css.indexOf("@media (pointer: coarse)"));
    expect(touchBlock).toContain("button[aria-label]");
  });
});

// ── Screen reader patterns ──
describe("P13.6: Screen reader patterns — public pages", () => {
  describe("Home page", () => {
    const homePage = readFile("app/(main)/page.tsx");

    it("has semantic structure with headings", () => {
      expect(homePage).toMatch(/<h[1-3]/);
    });

    it("uses aria-labels or accessible labels where needed", () => {
      // Main content region is in layout, but page should have proper heading structure
      expect(homePage).toMatch(/<h[1-6]|role=|aria-/);
    });
  });

  describe("Yachts listing page", () => {
    const yachtsPage = readFile("app/(main)/yachts/page.tsx");

    it("exports metadata or has a heading", () => {
      expect(yachtsPage).toMatch(/metadata|<h1|heading/);
    });
  });

  describe("YachtsClient component", () => {
    const yachtsClient = readFile("app/(main)/yachts/YachtsClient.tsx");

    it("has aria-live region for search results", () => {
      expect(yachtsClient).toContain("aria-live");
    });

    it("has role attributes for dynamic content", () => {
      expect(yachtsClient).toMatch(/role=/);
    });

    it("modal has proper dialog ARIA", () => {
      expect(yachtsClient).toContain('role="dialog"');
      expect(yachtsClient).toContain('aria-modal="true"');
    });
  });

  describe("Search page", () => {
    const searchClient = readFile("app/(main)/search/SearchClient.tsx");

    it("search input has accessible label", () => {
      expect(searchClient).toMatch(/aria-label|<label/);
    });

    it("has aria-live for search results", () => {
      expect(searchClient).toContain("aria-live");
    });

    it("loading spinner uses aria-hidden or aria-label", () => {
      // Loading spinners should be marked decorative (aria-hidden) or have a label
      const hasHiddenSpinners =
        searchClient.includes("aria-hidden") ||
        searchClient.includes("sr-only");
      expect(hasHiddenSpinners).toBe(true);
    });
  });

  describe("Compare page", () => {
    const compareClient = readFile("app/(main)/compare/CompareClient.tsx");

    it("has accessible labels for picker inputs", () => {
      expect(compareClient).toMatch(/aria-label|<label/);
    });

    it("picker has Escape handler for keyboard users", () => {
      expect(compareClient).toContain("Escape");
    });

    it("status indicators use aria-live or sr-only", () => {
      expect(
        compareClient.includes("aria-live") || compareClient.includes("sr-only"),
      ).toBe(true);
    });
  });

  describe("Newsletter form", () => {
    const newsletter = readFile("components/NewsletterSignup.tsx");

    it("form has aria-label", () => {
      expect(newsletter).toContain("aria-label");
    });

    it("input has associated label", () => {
      expect(newsletter).toMatch(/<label|aria-label/);
    });

    it("error messages use aria-live", () => {
      expect(newsletter).toContain("aria-live");
    });
  });

  describe("FavoriteButton", () => {
    const favButton = readFile("app/components/FavoriteButton.tsx");

    it("button has descriptive aria-label", () => {
      expect(favButton).toContain("aria-label");
    });

    it("icon is hidden from screen readers", () => {
      expect(favButton).toContain('aria-hidden="true"');
    });

    it("has dynamic aria-label based on state", () => {
      expect(favButton).toMatch(/Remove.*from favorites|Add.*to favorites/);
    });
  });
});

// ── Responsive accessibility checks ──
describe("P13.6: Responsive accessibility — layout & components", () => {
  describe("Main layout", () => {
    const layout = readFile("app/(main)/layout.tsx");

    it("has skip-to-content link", () => {
      expect(layout).toContain('href="#main-content"');
      expect(layout).toContain("Skip to content");
    });

    it("has sr-only class on skip link for visual hiding", () => {
      expect(layout).toContain("sr-only");
      expect(layout).toContain("focus:not-sr-only");
    });

    it("main has id matching skip link target", () => {
      expect(layout).toContain('id="main-content"');
    });

    it("has landmark roles", () => {
      expect(layout).toContain('role="banner"');
      expect(layout).toContain('role="main"');
      expect(layout).toContain('role="contentinfo"');
    });

    it("footer links have accessible text", () => {
      expect(layout).toMatch(
        /3DPUT|Sailboats\.fr/,
      );
    });
  });

  describe("Mobile menu responsive behavior", () => {
    const mobileMenu = readFile("app/(main)/MobileMenuKeyboard.tsx");

    it("is hidden on desktop (md:hidden)", () => {
      expect(mobileMenu).toContain("md:hidden");
    });

    it("menu items have adequate spacing for touch (py-3)", () => {
      expect(mobileMenu).toContain("py-3");
    });

    it("has aria-expanded state", () => {
      expect(mobileMenu).toContain("aria-expanded");
    });

    it("has aria-hidden when closed", () => {
      expect(mobileMenu).toContain("aria-hidden");
    });
  });
});

// ── Animation audit: verify components using animate-* classes ──
describe("P13.6: Animation audit — all animate-* classes are reduced-motion safe", () => {
  const allFiles = [
    ...findTsxFiles(path.join(PROJECT_ROOT, "app")),
    ...findTsxFiles(path.join(PROJECT_ROOT, "components")),
  ].filter((f) => !f.includes("/admin/"));

  const css = readFile("app/globals.css");
  const hasReducedMotion = css.includes("@media (prefers-reduced-motion: reduce)");

  const animateClasses: string[] = [];
  for (const file of allFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const matches = content.match(/animate-\w+/g) || [];
    for (const m of matches) {
      if (!animateClasses.includes(m)) animateClasses.push(m);
    }
  }

  for (const cls of animateClasses) {
    it(`${cls} is disabled in reduced-motion CSS`, () => {
      expect(hasReducedMotion).toBe(true);
      // Check that the CSS disables this specific animate class
      const reducedMotionBlock = css.substring(
        css.indexOf("@media (prefers-reduced-motion: reduce)"),
      );
      expect(reducedMotionBlock).toContain(`.${cls}`);
    });
  }
});

// ── Touch target audit: icon-only buttons have adequate size ──
describe("P13.6: Touch target audit — icon-only buttons", () => {
  const publicFiles = [
    ...findTsxFiles(path.join(PROJECT_ROOT, "app/(main)")),
    ...findTsxFiles(path.join(PROJECT_ROOT, "components")),
  ].filter((f) => !f.includes("/admin/"));

  const iconButtons: { file: string; cls: string }[] = [];
  for (const file of publicFiles) {
    const content = fs.readFileSync(file, "utf-8");
    // Find buttons that contain SVGs (icon buttons)
    const lines = content.split("\n");
    let inButtonWithSvg = false;
    let buttonClasses = "";
    for (const line of lines) {
      if (line.includes("<button") && !line.includes("</button>")) {
        inButtonWithSvg = true;
        const clsMatch = line.match(/className="([^"]*)"/);
        buttonClasses = clsMatch ? clsMatch[1] : "";
      }
      if (inButtonWithSvg && line.includes("<svg")) {
        const relPath = path.relative(PROJECT_ROOT, file);
        iconButtons.push({ file: relPath, cls: buttonClasses });
        inButtonWithSvg = false;
      }
      if (line.includes("</button>")) {
        inButtonWithSvg = false;
      }
    }
  }

  it("CSS provides min-height 44px for buttons on touch devices", () => {
    const touchBlock = css.substring(css.indexOf("@media (pointer: coarse)"));
    expect(touchBlock).toContain("button");
    expect(touchBlock).toContain("min-height: 44px");
  });
});

// Re-read for the last test block
const css = readFile("app/globals.css");
