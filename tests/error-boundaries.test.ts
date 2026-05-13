import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// ─── Error boundary file existence tests ────────────────────────

describe("Error Boundary Files", () => {
  const projectRoot = resolve(__dirname, "..");

  const errorFiles = [
    "app/[locale]/yachts/error.tsx",
    "app/[locale]/yachts/[slug]/error.tsx",
    "app/[locale]/yachts/finder/error.tsx",
    "app/[locale]/compare/error.tsx",
    "app/[locale]/compare/[slugA]-vs-[slugB]/error.tsx",
    "app/[locale]/manufacturers/error.tsx",
    "app/[locale]/manufacturers/[slug]/error.tsx",
    "app/[locale]/guides/error.tsx",
    "app/[locale]/guides/[slug]/error.tsx",
    "app/[locale]/search/error.tsx",
    "app/[locale]/glossary/error.tsx",
    "app/[locale]/glossary/[slug]/error.tsx",
    "app/[locale]/account/error.tsx",
    "app/[locale]/favorites/error.tsx",
  ];

  it.each(errorFiles)("%s exists", (file) => {
    const fullPath = resolve(projectRoot, file);
    expect(existsSync(fullPath)).toBe(true);
  });

  it.each(errorFiles)("%s is a client component", (file) => {
    const fullPath = resolve(projectRoot, file);
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain('"use client"');
  });

  it.each(errorFiles)("%s uses the shared ErrorBoundary component", (file) => {
    const fullPath = resolve(projectRoot, file);
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("ErrorBoundary");
  });

  it("shared ErrorBoundary component exists and uses Sentry", () => {
    const fullPath = resolve(projectRoot, "app/[locale]/ErrorBoundary.tsx");
    expect(existsSync(fullPath)).toBe(true);
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain('"use client"');
    expect(content).toContain("captureError");
    expect(content).toContain("role=\"alert\"");
    expect(content).toContain("useTranslations");
  });

  it("ErrorBoundary has retry button functionality", () => {
    const fullPath = resolve(projectRoot, "app/[locale]/ErrorBoundary.tsx");
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("onClick={reset}");
  });

  it("ErrorBoundary has error icon/svg for visual feedback", () => {
    const fullPath = resolve(projectRoot, "app/[locale]/ErrorBoundary.tsx");
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("<svg");
  });
});

// ─── i18n error message tests ───────────────────────────────────

describe("Error i18n Messages", () => {
  const projectRoot = resolve(__dirname, "..");

  const requiredKeys = [
    "genericTitle",
    "genericDescription",
    "tryAgain",
    "goHome",
    "yachtsTitle",
    "yachtsDescription",
    "yachtDetailTitle",
    "yachtDetailDescription",
    "finderTitle",
    "finderDescription",
    "compareTitle",
    "compareDescription",
    "compareDetailTitle",
    "compareDetailDescription",
    "manufacturersTitle",
    "manufacturersDescription",
    "manufacturerDetailTitle",
    "manufacturerDetailDescription",
    "guidesTitle",
    "guidesDescription",
    "guideDetailTitle",
    "guideDetailDescription",
    "searchTitle",
    "searchDescription",
    "glossaryTitle",
    "glossaryDescription",
    "glossaryDetailTitle",
    "glossaryDetailDescription",
    "accountTitle",
    "accountDescription",
    "favoritesTitle",
    "favoritesDescription",
  ];

  it("en.json has all error message keys", async () => {
    const { default: fs } = await import("fs");
    const en = JSON.parse(fs.readFileSync(resolve(projectRoot, "messages/en.json"), "utf-8"));
    expect(en.Errors).toBeTruthy();
    for (const key of requiredKeys) {
      expect(en.Errors[key]).toBeTruthy();
      expect(typeof en.Errors[key]).toBe("string");
    }
  });

  it("fr.json has all error message keys", async () => {
    const { default: fs } = await import("fs");
    const fr = JSON.parse(fs.readFileSync(resolve(projectRoot, "messages/fr.json"), "utf-8"));
    expect(fr.Errors).toBeTruthy();
    for (const key of requiredKeys) {
      expect(fr.Errors[key]).toBeTruthy();
      expect(typeof fr.Errors[key]).toBe("string");
    }
  });

  it("en.json and fr.json have same error keys", async () => {
    const { default: fs } = await import("fs");
    const en = JSON.parse(fs.readFileSync(resolve(projectRoot, "messages/en.json"), "utf-8"));
    const fr = JSON.parse(fs.readFileSync(resolve(projectRoot, "messages/fr.json"), "utf-8"));
    const enKeys = Object.keys(en.Errors).sort();
    const frKeys = Object.keys(fr.Errors).sort();
    expect(enKeys).toEqual(frKeys);
  });

  it("no error message is empty", async () => {
    const { default: fs } = await import("fs");
    const en = JSON.parse(fs.readFileSync(resolve(projectRoot, "messages/en.json"), "utf-8"));
    for (const [key, value] of Object.entries(en.Errors)) {
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});
