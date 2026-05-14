import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// ─── File Existence Tests ─────────────────────────────────────────────
describe("P18.5 — Page transition animation files", () => {
  const componentsDir = resolve(__dirname, "../components/ui");
  const appDir = resolve(__dirname, "../app");

  it("has page-transition.tsx component", () => {
    const file = resolve(componentsDir, "page-transition.tsx");
    expect(existsSync(file)).toBe(true);
  });

  it("has animated-grid.tsx component", () => {
    const file = resolve(componentsDir, "animated-grid.tsx");
    expect(existsSync(file)).toBe(true);
  });

  it("page-transition.tsx is a client component", () => {
    const content = readFileSync(resolve(componentsDir, "page-transition.tsx"), "utf-8");
    expect(content).toContain('"use client"');
  });

  it("animated-grid.tsx is a client component", () => {
    const content = readFileSync(resolve(componentsDir, "animated-grid.tsx"), "utf-8");
    expect(content).toContain('"use client"');
  });
});

// ─── CSS Animation Definitions ────────────────────────────────────────
describe("P18.5 — CSS animation classes in globals.css", () => {
  const cssPath = resolve(__dirname, "../app/globals.css");
  const css = readFileSync(cssPath, "utf-8");

  it("defines page-enter keyframe animation", () => {
    expect(css).toContain("@keyframes page-enter");
  });

  it("defines card-enter keyframe animation", () => {
    expect(css).toContain("@keyframes card-enter");
  });

  it("defines page-transition-enter class", () => {
    expect(css).toContain(".page-transition-enter");
  });

  it("defines card-animate class", () => {
    expect(css).toContain(".card-animate");
  });

  it("defines stagger classes for cards 1-12", () => {
    for (let i = 1; i <= 12; i++) {
      expect(css).toContain(`.card-stagger-${i}`);
    }
  });

  it("respects prefers-reduced-motion", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none");
  });

  it("reduced motion rule targets both animation classes", () => {
    const reducedSection = css.substring(
      css.indexOf("@media (prefers-reduced-motion: reduce)")
    );
    expect(reducedSection).toContain("page-transition-enter");
    expect(reducedSection).toContain("card-animate");
  });
});

// ─── Component Logic Tests ────────────────────────────────────────────
describe("P18.5 — Component implementation checks", () => {
  const componentsDir = resolve(__dirname, "../components/ui");

  it("page-transition uses usePathname to detect route changes", () => {
    const content = readFileSync(resolve(componentsDir, "page-transition.tsx"), "utf-8");
    expect(content).toContain("usePathname");
    expect(content).toContain("useEffect");
  });

  it("page-transition checks prefers-reduced-motion", () => {
    const content = readFileSync(resolve(componentsDir, "page-transition.tsx"), "utf-8");
    expect(content).toContain("prefers-reduced-motion");
  });

  it("page-transition targets main-content element", () => {
    const content = readFileSync(resolve(componentsDir, "page-transition.tsx"), "utf-8");
    expect(content).toContain("main-content");
  });

  it("page-transition renders null (no visual DOM output)", () => {
    const content = readFileSync(resolve(componentsDir, "page-transition.tsx"), "utf-8");
    expect(content).toContain("return null");
  });

  it("animated-grid uses Children API to wrap items", () => {
    const content = readFileSync(resolve(componentsDir, "animated-grid.tsx"), "utf-8");
    expect(content).toContain("Children");
    expect(content).toContain("animationKey");
  });

  it("animated-grid only animates on key change (not initial mount)", () => {
    const content = readFileSync(resolve(componentsDir, "animated-grid.tsx"), "utf-8");
    expect(content).toContain("prevKey");
    expect(content).toContain("requestAnimationFrame");
  });
});

// ─── Integration: UXPolish includes PageTransition ────────────────────
describe("P18.5 — UXPolish integration", () => {
  const uxPolishPath = resolve(__dirname, "../components/UXPolish.tsx");

  it("UXPolish imports and renders PageTransition", () => {
    const content = readFileSync(uxPolishPath, "utf-8");
    expect(content).toContain("PageTransition");
    expect(content).toContain("page-transition");
  });

  it("PageTransition is dynamically imported (ssr: false)", () => {
    const content = readFileSync(uxPolishPath, "utf-8");
    // Check the full file content for the dynamic import with ssr: false
    expect(content).toMatch(/PageTransition.*dynamic.*page-transition/s);
    expect(content).toContain("ssr: false");
  });
});

// ─── Integration: YachtsClient uses AnimatedGrid ──────────────────────
describe("P18.5 — YachtsClient integration", () => {
  const yachtsClientPath = resolve(__dirname, "../app/[locale]/yachts/YachtsClient.tsx");

  it("YachtsClient imports AnimatedGrid", () => {
    const content = readFileSync(yachtsClientPath, "utf-8");
    expect(content).toContain("AnimatedGrid");
    expect(content).toContain("animated-grid");
  });

  it("YachtsClient uses currentKey as animationKey", () => {
    const content = readFileSync(yachtsClientPath, "utf-8");
    expect(content).toMatch(/animationKey=\{currentKey\}/);
  });

  it("AnimatedGrid wraps the yacht cards inside the grid div", () => {
    const content = readFileSync(yachtsClientPath, "utf-8");
    // Should have AnimatedGrid inside the grid div
    expect(content).toMatch(/<AnimatedGrid[^>]*>\s*\{yachtsWithTags\.map/);
  });
});
