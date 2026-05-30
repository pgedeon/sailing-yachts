import { describe, it, expect } from "vitest";
import {
  SPEC_TO_GLOSSARY,
  TOOLTIP_DEFS,
} from "@/lib/spec-tooltip-data";

describe("SpecTooltip data logic", () => {
  it("should have glossary slugs for all common spec labels", () => {
    const commonLabels = [
      "LOA",
      "Beam",
      "Draft",
      "Displacement",
      "Ballast",
      "Ballast Ratio",
      "Sail Area",
      "Sail Area Main",
      "Sail Area Jib",
      "SA/D Ratio",
      "D/L Ratio",
      "LWL",
      "Hull Speed",
      "Keel Type",
      "Rig Type",
      "Cabins",
      "Berths",
      "Heads",
      "Hull Material",
      "Engine",
      "Engine Type",
      "Engine HP",
      "Fuel Capacity",
      "Water Capacity",
      "Max Occupancy",
    ];
    for (const label of commonLabels) {
      expect(SPEC_TO_GLOSSARY[label], `Missing glossary slug for "${label}"`).toBeDefined();
    }
  });

  it("should have both en and fr definitions for all tooltips", () => {
    for (const [label, def] of Object.entries(TOOLTIP_DEFS)) {
      expect(def.en, `Missing English definition for "${label}"`).toBeTruthy();
      expect(def.fr, `Missing French definition for "${label}"`).toBeTruthy();
      expect(typeof def.en).toBe("string");
      expect(typeof def.fr).toBe("string");
    }
  });

  it("should use kebab-case for all glossary slugs", () => {
    for (const [label, slug] of Object.entries(SPEC_TO_GLOSSARY)) {
      expect(slug, `Invalid slug format for "${label}"`).toMatch(/^[a-z0-9-]+$/);
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

  it("should have tooltip definitions for all primary spec category labels", () => {
    // Primary labels that appear as spec category names from the DB
    const primaryLabels = [
      "LOA",
      "Beam",
      "Draft",
      "Displacement",
      "Ballast",
      "Sail Area Main",
      "Sail Area Jib",
      "Engine HP",
      "Engine Type",
      "Fuel Capacity",
      "Water Capacity",
      "Cabins",
      "Berths",
      "Heads",
      "Hull Material",
      "Keel Type",
      "Rig Type",
      "LWL",
      "Hull Speed",
    ];
    for (const label of primaryLabels) {
      // These should all have either a tooltip definition or a glossary link
      const hasTooltip = TOOLTIP_DEFS[label] !== undefined;
      const hasGlossary = SPEC_TO_GLOSSARY[label] !== undefined;
      expect(hasTooltip || hasGlossary, `"${label}" should have tooltip or glossary link`).toBe(true);
    }
  });

  it("should cover performance ratio labels", () => {
    const performanceLabels = [
      "SA/D Ratio",
      "D/L Ratio",
      "Ballast Ratio",
      "Hull Speed",
    ];
    for (const label of performanceLabels) {
      expect(TOOLTIP_DEFS[label], `Missing tooltip for performance label "${label}"`).toBeDefined();
    }
  });

  it("should cover accommodation spec labels", () => {
    const accommodationLabels = ["Cabins", "Berths", "Heads", "Max Occupancy"];
    for (const label of accommodationLabels) {
      expect(SPEC_TO_GLOSSARY[label], `Missing glossary slug for "${label}"`).toBeDefined();
      expect(TOOLTIP_DEFS[label], `Missing tooltip for "${label}"`).toBeDefined();
    }
  });

  it("should cover technical spec labels", () => {
    const technicalLabels = [
      "Engine HP",
      "Engine Type",
      "Fuel Capacity",
      "Water Capacity",
      "Hull Material",
    ];
    for (const label of technicalLabels) {
      expect(SPEC_TO_GLOSSARY[label], `Missing glossary slug for "${label}"`).toBeDefined();
      expect(TOOLTIP_DEFS[label], `Missing tooltip for "${label}"`).toBeDefined();
    }
  });

  it("should cover dimension spec labels", () => {
    const dimensionLabels = ["LOA", "Beam", "Draft", "Displacement", "LWL"];
    for (const label of dimensionLabels) {
      expect(SPEC_TO_GLOSSARY[label], `Missing glossary slug for "${label}"`).toBeDefined();
      expect(TOOLTIP_DEFS[label], `Missing tooltip for "${label}"`).toBeDefined();
    }
  });

  it("should cover rig and keel type labels", () => {
    const rigKeelLabels = [
      "Keel Type",
      "Rig Type",
      "Fin Keel",
      "Wing Keel",
      "Sloop Rig",
      "Cutter Rig",
      "Ketch Rig",
      "Shoal Draft",
    ];
    for (const label of rigKeelLabels) {
      expect(SPEC_TO_GLOSSARY[label], `Missing glossary slug for "${label}"`).toBeDefined();
    }
  });

  it("should map alias labels to the same glossary slug", () => {
    // "LOA" and "Length Overall" both go to "loa"
    expect(SPEC_TO_GLOSSARY["LOA"]).toBe("loa");
    expect(SPEC_TO_GLOSSARY["Length Overall"]).toBe("loa");
    // "Cabins" and "Cabin" both go to "cabin"
    expect(SPEC_TO_GLOSSARY["Cabins"]).toBe("cabin");
    expect(SPEC_TO_GLOSSARY["Cabin"]).toBe("cabin");
    // "Engine", "Engine Type", "Engine HP" all map to "engine"
    expect(SPEC_TO_GLOSSARY["Engine"]).toBe("engine");
    expect(SPEC_TO_GLOSSARY["Engine Type"]).toBe("engine");
    expect(SPEC_TO_GLOSSARY["Engine HP"]).toBe("engine");
  });

  it("should have consistent data between SPEC_TO_GLOSSARY and TOOLTIP_DEFS", () => {
    // Every entry in TOOLTIP_DEFS should have a corresponding SPEC_TO_GLOSSARY entry
    for (const label of Object.keys(TOOLTIP_DEFS)) {
      expect(SPEC_TO_GLOSSARY[label], `TOOLTIP_DEFS has "${label}" but SPEC_TO_GLOSSARY doesn't`).toBeDefined();
    }
  });
});
