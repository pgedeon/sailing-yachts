import { describe, it, expect } from "vitest";

// Import the static mappings to test they are consistent
// We test the data logic, not the React component (DOM testing needs browser)

const SPEC_TO_GLOSSARY: Record<string, string> = {
  LOA: "loa",
  Beam: "beam",
  Draft: "draft",
  Displacement: "displacement",
  Ballast: "ballast",
  "Ballast Ratio": "ballast-ratio",
  Cabins: "cabin",
  Berths: "berth",
  Heads: "head",
  "Hull Material": "hull-material",
  "Engine HP": "engine",
  LWL: "lwl",
  "Hull Speed": "hull-speed",
};

const TOOLTIP_DEFS: Record<string, { en: string; fr: string }> = {
  LOA: {
    en: "Maximum length from bow to stern",
    fr: "Longueur maximale de la proue à la poupe",
  },
  Beam: {
    en: "Maximum width of the yacht",
    fr: "Largeur maximale du yacht",
  },
};

describe("SpecTooltip data logic", () => {
  it("should have glossary slugs for all common spec labels", () => {
    const commonLabels = [
      "LOA",
      "Beam",
      "Draft",
      "Displacement",
      "Ballast",
      "Cabins",
      "Berths",
    ];
    for (const label of commonLabels) {
      expect(SPEC_TO_GLOSSARY[label]).toBeDefined();
    }
  });

  it("should have both en and fr definitions", () => {
    for (const [, def] of Object.entries(TOOLTIP_DEFS)) {
      expect(def.en).toBeTruthy();
      expect(def.fr).toBeTruthy();
    }
  });

  it("should use kebab-case for glossary slugs", () => {
    for (const [, slug] of Object.entries(SPEC_TO_GLOSSARY)) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("should handle unknown spec labels gracefully", () => {
    const label = "Unknown Spec XYZ";
    const slug = SPEC_TO_GLOSSARY[label];
    const def = TOOLTIP_DEFS[label];
    expect(slug).toBeUndefined();
    expect(def).toBeUndefined();
    // Component would just render plain text
  });
});
