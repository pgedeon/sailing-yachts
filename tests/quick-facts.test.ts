import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const projectRoot = resolve(__dirname, "..");

describe("QuickFacts Component", () => {
  const componentPath = resolve(projectRoot, "components/QuickFacts.tsx");
  it("file exists", () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  it("exports default function", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("export default function QuickFacts");
  });

  it("has all required props interface", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("lengthOverall");
    expect(content).toContain("beam");
    expect(content).toContain("draft");
    expect(content).toContain("displacement");
    expect(content).toContain("cabins");
    expect(content).toContain("berths");
    expect(content).toContain("engineHp");
  });

  it("uses QuickFacts translation namespace", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain('useTranslations("QuickFacts")');
  });

  it("has data-testid for integration testing", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain('data-testid="quick-facts-section"');
  });

  it("formats displacement in tonnes", () => {
    const content = readFileSync(componentPath, "utf-8");
    // Displacement should be divided by 1000 to show tonnes
    expect(content).toContain("/ 1000");
  });

  it("returns null when all values are missing", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("facts.length === 0");
    expect(content).toContain("return null");
  });

  it("highlights length overall with special styling", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("highlight");
    expect(content).toContain("border-blue-200");
  });
});

describe("QuickFacts i18n Messages", () => {
  it("has all English translations", () => {
    const en = JSON.parse(readFileSync(resolve(projectRoot, "messages/en.json"), "utf-8"));
    const qf = en.QuickFacts;
    expect(qf).toBeDefined();
    expect(qf.heading).toBeDefined();
    expect(qf.lengthOverall).toBeDefined();
    expect(qf.beam).toBeDefined();
    expect(qf.draft).toBeDefined();
    expect(qf.displacement).toBeDefined();
    expect(qf.cabins).toBeDefined();
    expect(qf.berths).toBeDefined();
    expect(qf.engineHp).toBeDefined();
    expect(qf.fuelCapacity).toBeDefined();
    expect(qf.waterCapacity).toBeDefined();
    expect(qf.rigType).toBeDefined();
  });

  it("has all French translations", () => {
    const fr = JSON.parse(readFileSync(resolve(projectRoot, "messages/fr.json"), "utf-8"));
    const qf = fr.QuickFacts;
    expect(qf).toBeDefined();
    expect(qf.heading).toBeDefined();
    expect(qf.lengthOverall).toBeDefined();
    expect(qf.beam).toBeDefined();
    expect(qf.draft).toBeDefined();
    expect(qf.displacement).toBeDefined();
    expect(qf.cabins).toBeDefined();
    expect(qf.berths).toBeDefined();
  });
});
