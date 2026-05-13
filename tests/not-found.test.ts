import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("Not Found Pages", () => {
  const projectRoot = resolve(__dirname, "..");

  it("root not-found.tsx exists", () => {
    const fullPath = resolve(projectRoot, "app/not-found.tsx");
    expect(existsSync(fullPath)).toBe(true);
  });

  it("root not-found.tsx has noindex meta", () => {
    const fullPath = resolve(projectRoot, "app/not-found.tsx");
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("index: false");
  });

  it("root not-found.tsx has link to homepage", () => {
    const fullPath = resolve(projectRoot, "app/not-found.tsx");
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain('href="/"');
  });

  it("root not-found.tsx has link to browse yachts", () => {
    const fullPath = resolve(projectRoot, "app/not-found.tsx");
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain('href="/yachts"');
  });

  it("root not-found.tsx shows 404 heading", () => {
    const fullPath = resolve(projectRoot, "app/not-found.tsx");
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("404");
  });

  it("locale not-found.tsx exists", () => {
    const fullPath = resolve(projectRoot, "app/[locale]/not-found.tsx");
    expect(existsSync(fullPath)).toBe(true);
  });

  it("locale not-found.tsx has noindex meta", () => {
    const fullPath = resolve(projectRoot, "app/[locale]/not-found.tsx");
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("index: false");
  });

  it("locale not-found.tsx uses getTranslations for i18n", () => {
    const fullPath = resolve(projectRoot, "app/[locale]/not-found.tsx");
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("getTranslations");
    expect(content).toContain("NotFound");
  });

  it("locale not-found.tsx has navigation links to popular pages", () => {
    const fullPath = resolve(projectRoot, "app/[locale]/not-found.tsx");
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("/yachts");
    expect(content).toContain("/manufacturers");
    expect(content).toContain("/guides");
    expect(content).toContain("/compare");
    expect(content).toContain("/search");
  });

  it("locale not-found.tsx shows 404 heading", () => {
    const fullPath = resolve(projectRoot, "app/[locale]/not-found.tsx");
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("404");
  });
});

describe("Not Found i18n Messages", () => {
  const projectRoot = resolve(__dirname, "..");

  const requiredKeys = [
    "title",
    "description",
    "goHome",
    "popularPages",
    "browseYachts",
    "manufacturers",
    "guides",
    "compare",
    "search",
  ];

  it("en.json has all NotFound message keys", async () => {
    const { default: fs } = await import("fs");
    const en = JSON.parse(fs.readFileSync(resolve(projectRoot, "messages/en.json"), "utf-8"));
    expect(en.NotFound).toBeTruthy();
    for (const key of requiredKeys) {
      expect(en.NotFound[key]).toBeTruthy();
      expect(typeof en.NotFound[key]).toBe("string");
    }
  });

  it("fr.json has all NotFound message keys", async () => {
    const { default: fs } = await import("fs");
    const fr = JSON.parse(fs.readFileSync(resolve(projectRoot, "messages/fr.json"), "utf-8"));
    expect(fr.NotFound).toBeTruthy();
    for (const key of requiredKeys) {
      expect(fr.NotFound[key]).toBeTruthy();
      expect(typeof fr.NotFound[key]).toBe("string");
    }
  });

  it("en.json and fr.json have same NotFound keys", async () => {
    const { default: fs } = await import("fs");
    const en = JSON.parse(fs.readFileSync(resolve(projectRoot, "messages/en.json"), "utf-8"));
    const fr = JSON.parse(fs.readFileSync(resolve(projectRoot, "messages/fr.json"), "utf-8"));
    const enKeys = Object.keys(en.NotFound).sort();
    const frKeys = Object.keys(fr.NotFound).sort();
    expect(enKeys).toEqual(frKeys);
  });
});
