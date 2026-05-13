import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const projectRoot = resolve(__dirname, "..");

// ─── Component file tests ────────────────────────────────────────

describe("Scroll Progress Component", () => {
  const filePath = resolve(projectRoot, "components/ui/scroll-progress.tsx");

  it("exists", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("is a client component", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain('"use client"');
  });

  it("uses requestAnimationFrame for throttled scroll", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("requestAnimationFrame");
  });

  it("respects prefers-reduced-motion", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("prefers-reduced-motion");
    expect(content).toContain("reduce");
  });

  it("has progressbar role for accessibility", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("role=\"progressbar\"");
    expect(content).toContain("aria-valuenow");
    expect(content).toContain("aria-valuemin");
    expect(content).toContain("aria-valuemax");
  });

  it("uses passive scroll listener", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("passive: true");
  });
});

describe("Back To Top Component", () => {
  const filePath = resolve(projectRoot, "components/ui/back-to-top.tsx");

  it("exists", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("is a client component", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain('"use client"');
  });

  it("uses useTranslations for i18n aria-label", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("useTranslations");
    expect(content).toContain("aria-label");
    expect(content).toContain("backToTop");
  });

  it("has scroll threshold prop", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("threshold");
  });

  it("respects prefers-reduced-motion for scroll behavior", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("prefers-reduced-motion");
    expect(content).toContain("instant");
  });

  it("has an up arrow SVG icon", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("<svg");
    expect(content).toContain("M4.5 15.75l7.5-7.5 7.5 7.5");
  });

  it("uses requestAnimationFrame for throttled scroll", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("requestAnimationFrame");
  });

  it("has opacity/visibility transition", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("opacity-0");
    expect(content).toContain("opacity-100");
  });
});

describe("UXPolish Wrapper", () => {
  const filePath = resolve(projectRoot, "components/UXPolish.tsx");

  it("exists", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("is a client component", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain('"use client"');
  });

  it("uses dynamic imports to reduce bundle", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("dynamic(");
    expect(content).toContain("ssr: false");
  });

  it("imports both components", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("scroll-progress");
    expect(content).toContain("back-to-top");
  });
});

describe("Layout Integration", () => {
  const layoutPath = resolve(projectRoot, "app/[locale]/layout.tsx");

  it("layout imports UXPolish", () => {
    const content = readFileSync(layoutPath, "utf-8");
    expect(content).toContain("UXPolish");
  });

  it("UXPolish is rendered in layout", () => {
    const content = readFileSync(layoutPath, "utf-8");
    expect(content).toContain("<UXPolish />");
  });
});

// ─── i18n tests ──────────────────────────────────────────────────

describe("UI Translation Keys", () => {
  it("en.json has backToTop key", async () => {
    const { default: fs } = await import("fs");
    const en = JSON.parse(fs.readFileSync(resolve(projectRoot, "messages/en.json"), "utf-8"));
    expect(en.UI).toBeTruthy();
    expect(en.UI.backToTop).toBe("Back to top");
  });

  it("fr.json has backToTop key", async () => {
    const { default: fs } = await import("fs");
    const fr = JSON.parse(fs.readFileSync(resolve(projectRoot, "messages/fr.json"), "utf-8"));
    expect(fr.UI).toBeTruthy();
    expect(fr.UI.backToTop).toBe("Retour en haut");
  });
});
