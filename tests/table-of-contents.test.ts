import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const projectRoot = resolve(__dirname, "..");

describe("TableOfContents Component", () => {
  const componentPath = resolve(projectRoot, "components/TableOfContents.tsx");

  it("file exists", () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  it("exports default function", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("export default function TableOfContents");
  });

  it("returns null when sections is empty", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("sections.length === 0");
    expect(content).toContain("return null");
  });

  it("uses scrollIntoView for smooth scrolling", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("scrollIntoView");
    expect(content).toContain("behavior: \"smooth\"");
  });

  it("has active section highlighting", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("activeId");
    expect(content).toContain("text-primary");
    expect(content).toContain("text-muted-foreground");
  });

  it("uses TableOfContents translation namespace", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain('useTranslations("TableOfContents")');
  });

  it("is hidden on mobile and shown on desktop (lg:block)", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("hidden lg:block");
  });

  it("has sticky positioning for sidebar behavior", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("sticky");
  });

  it("has data-testid", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain('data-testid="table-of-contents"');
  });
});

describe("TableOfContents i18n Messages", () => {
  it("has English translations", () => {
    const en = JSON.parse(readFileSync(resolve(projectRoot, "messages/en.json"), "utf-8"));
    const toc = en.TableOfContents;
    expect(toc).toBeDefined();
    expect(toc.heading).toBe("On This Page");
    expect(toc.label).toBe("Page sections");
  });

  it("has French translations", () => {
    const fr = JSON.parse(readFileSync(resolve(projectRoot, "messages/fr.json"), "utf-8"));
    const toc = fr.TableOfContents;
    expect(toc).toBeDefined();
    expect(toc.heading).toBeDefined();
    expect(toc.label).toBeDefined();
  });
});

describe("YachtDetailClient — Enhanced Layout Integration", () => {
  const clientPath = resolve(projectRoot, "app/[locale]/yachts/[slug]/YachtDetailClient.tsx");

  it("imports QuickFacts component", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).toContain("import QuickFacts");
  });

  it("imports SocialShareButtons component", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).toContain("import SocialShareButtons");
  });

  it("imports TableOfContents component", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).toContain("import TableOfContents");
  });

  it("renders QuickFacts with id for TOC navigation", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).toContain('id="quick-facts"');
  });

  it("renders specifications section with id", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).toContain('id="specifications"');
  });

  it("renders performance section with id", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).toContain('id="performance"');
  });

  it("renders reviews section with id", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).toContain('id="reviews"');
  });

  it("renders contact section with id", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).toContain('id="contact"');
  });

  it("uses two-column layout with TOC sidebar", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).toContain("TableOfContents sections={tocSections}");
    expect(content).toContain("activeSection");
  });

  it("has IntersectionObserver for active TOC tracking", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).toContain("IntersectionObserver");
  });

  it("has enhanced spec grid with hover effects", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).toContain("hover:border-primary/30");
  });

  it("has YachtDetail TOC translations", () => {
    const en = JSON.parse(readFileSync(resolve(projectRoot, "messages/en.json"), "utf-8"));
    const toc = en.YachtDetail.toc;
    expect(toc).toBeDefined();
    expect(toc.quickFacts).toBeDefined();
    expect(toc.specifications).toBeDefined();
    expect(toc.performance).toBeDefined();
    expect(toc.recommendation).toBeDefined();
    expect(toc.reviews).toBeDefined();
    expect(toc.similar).toBeDefined();
    expect(toc.relatedGuides).toBeDefined();
    expect(toc.contact).toBeDefined();
  });

  it("has French TOC translations", () => {
    const fr = JSON.parse(readFileSync(resolve(projectRoot, "messages/fr.json"), "utf-8"));
    const toc = fr.YachtDetail.toc;
    expect(toc).toBeDefined();
    expect(toc.quickFacts).toBeDefined();
    expect(toc.specifications).toBeDefined();
    expect(toc.contact).toBeDefined();
  });
});
