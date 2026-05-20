import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const projectRoot = resolve(__dirname, "..");

describe("SocialShareButtons Component", () => {
  const componentPath = resolve(projectRoot, "components/SocialShareButtons.tsx");

  it("file exists", () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  it("exports default function", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("export default function SocialShareButtons");
  });

  it("has Twitter share link", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("twitter.com/intent/tweet");
  });

  it("has Facebook share link", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("facebook.com/sharer");
  });

  it("has LinkedIn share link", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("linkedin.com");
  });

  it("has copy link functionality using clipboard API", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("navigator.clipboard.writeText");
  });

  it("uses SocialShare translation namespace", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain('useTranslations("SocialShare")');
  });

  it("has data-testid", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain('data-testid="social-share-buttons"');
  });

  it("opens share links in new tab with rel=noopener", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain('target="_blank"');
    expect(content).toContain('rel="noopener noreferrer"');
  });

  it("shows copied state feedback", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("copied");
    expect(content).toContain("Copied");
  });
});

describe("SocialShare i18n Messages", () => {
  it("has English translations", () => {
    const en = JSON.parse(readFileSync(resolve(projectRoot, "messages/en.json"), "utf-8"));
    const ss = en.SocialShare;
    expect(ss).toBeDefined();
    expect(ss.share).toBeDefined();
    expect(ss.shareOn).toBeDefined();
    expect(ss.copyLink).toBeDefined();
    expect(ss.copy).toBeDefined();
    expect(ss.copied).toBeDefined();
  });

  it("has French translations", () => {
    const fr = JSON.parse(readFileSync(resolve(projectRoot, "messages/fr.json"), "utf-8"));
    const ss = fr.SocialShare;
    expect(ss).toBeDefined();
    expect(ss.share).toBe("Partager");
    expect(ss.copy).toBe("Copier");
    expect(ss.copied).toBeDefined();
  });
});
