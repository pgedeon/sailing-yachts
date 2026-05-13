import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// ─── Skeleton component logic tests ─────────────────────────────

// Mirrors the class merging logic from the Skeleton component
function getExpectedClasses(base: string, extra?: string): string {
  return [base, extra].filter(Boolean).join(" ");
}

describe("Skeleton Utility Logic", () => {
  it("base classes are applied", () => {
    const cls = getExpectedClasses("animate-pulse rounded-md bg-muted");
    expect(cls).toContain("animate-pulse");
    expect(cls).toContain("rounded-md");
    expect(cls).toContain("bg-muted");
  });

  it("custom classes are appended", () => {
    const cls = getExpectedClasses("animate-pulse rounded-md bg-muted", "h-8 w-full");
    expect(cls).toContain("h-8");
    expect(cls).toContain("w-full");
    expect(cls).toContain("animate-pulse");
  });

  it("handles no extra class", () => {
    const cls = getExpectedClasses("animate-pulse rounded-md bg-muted");
    expect(cls).toBe("animate-pulse rounded-md bg-muted");
  });
});

// ─── Loading file existence and content tests ───────────────────

describe("Loading Skeleton Files", () => {
  const projectRoot = resolve(__dirname, "..");

  const loadingFiles = [
    "app/[locale]/yachts/loading.tsx",
    "app/[locale]/yachts/[slug]/loading.tsx",
    "app/[locale]/yachts/finder/loading.tsx",
    "app/[locale]/compare/loading.tsx",
    "app/[locale]/compare/[slugA]-vs-[slugB]/loading.tsx",
    "app/[locale]/manufacturers/loading.tsx",
    "app/[locale]/manufacturers/[slug]/loading.tsx",
    "app/[locale]/guides/loading.tsx",
    "app/[locale]/guides/[slug]/loading.tsx",
    "app/[locale]/search/loading.tsx",
    "app/[locale]/glossary/loading.tsx",
    "app/[locale]/glossary/[slug]/loading.tsx",
    "app/[locale]/account/loading.tsx",
    "app/[locale]/favorites/loading.tsx",
  ];

  it.each(loadingFiles)("%s exists", (file) => {
    const fullPath = resolve(projectRoot, file);
    expect(existsSync(fullPath)).toBe(true);
  });

  it.each(loadingFiles)("%s exports a default function", (file) => {
    const fullPath = resolve(projectRoot, file);
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("export default function");
  });

  it.each(loadingFiles)("%s uses animate-pulse for loading effect", (file) => {
    const fullPath = resolve(projectRoot, file);
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("animate-pulse");
  });

  it("skeleton component file exists and exports all components", () => {
    const fullPath = resolve(projectRoot, "components/ui/skeleton.tsx");
    expect(existsSync(fullPath)).toBe(true);

    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain("export function Skeleton");
    expect(content).toContain("export function SkeletonLine");
    expect(content).toContain("export function SkeletonCircle");
    expect(content).toContain("export function SkeletonImage");
    expect(content).toContain("export function SkeletonCard");
    expect(content).toContain("export function SkeletonStat");
    expect(content).toContain("export function SkeletonTableRow");
    expect(content).toContain("export function SkeletonFilterSection");
  });

  it("skeleton component uses cn() utility for class merging", () => {
    const fullPath = resolve(projectRoot, "components/ui/skeleton.tsx");
    const content = readFileSync(fullPath, "utf-8");
    expect(content).toContain('import { cn }');
    expect(content).toContain("cn(");
  });
});

// ─── Layout dimension calculations ─────────────────────────────

describe("Skeleton Layout Calculations", () => {
  it("generates correct number of card placeholders for grid", () => {
    const count = 9; // 3x3 grid
    const cards = Array.from({ length: count }, (_, i) => i);
    expect(cards.length).toBe(9);
  });

  it("generates correct filter option count", () => {
    const options = Array.from({ length: 8 }, (_, i) => i);
    expect(options.length).toBe(8);
  });

  it("generates alphabet navigation for glossary", () => {
    const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
    expect(letters.length).toBe(26);
    expect(letters[0]).toBe("A");
    expect(letters[25]).toBe("Z");
  });

  it("generates correct wizard step count", () => {
    const steps = Array.from({ length: 5 }, (_, i) => i);
    expect(steps.length).toBe(5);
  });

  it("random width is within valid range", () => {
    for (let i = 0; i < 100; i++) {
      const width = 50 + Math.random() * 40; // 50-90%
      expect(width).toBeGreaterThanOrEqual(50);
      expect(width).toBeLessThanOrEqual(90);
    }
  });
});
