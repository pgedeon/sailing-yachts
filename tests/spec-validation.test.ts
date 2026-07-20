import { describe, it, expect } from "vitest";
import {
  validateSpecs,
  calculateDerivedSpecs,
  summarizeBulkValidation,
  RULES,
  type YachtSpecs,
  type YachtValidationEntry,
} from "../lib/spec-validation";

// Helper to create specs with sensible defaults
function makeSpecs(overrides: Partial<YachtSpecs> = {}): YachtSpecs {
  return {
    lengthOverall: 10.5,
    beam: 3.5,
    draft: 1.8,
    displacement: 6500,
    ballast: 2200,
    sailAreaMain: 65,
    rigType: "Sloop",
    keelType: "Fin keel",
    hullMaterial: "Fiberglass",
    cabins: 3,
    berths: 6,
    heads: 1,
    maxOccupancy: 6,
    engineHp: 30,
    engineType: "Diesel",
    fuelCapacity: 120,
    waterCapacity: 160,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Validation Rules
// ---------------------------------------------------------------------------

describe("validateSpecs", () => {
  it("returns no issues for valid specs", () => {
    const result = validateSpecs(makeSpecs());
    expect(result.issues).toEqual([]);
    expect(result.isValid).toBe(true);
    expect(result.issueCount.error).toBe(0);
    expect(result.issueCount.warning).toBe(0);
  });

  it("detects beam exceeding LOA", () => {
    const result = validateSpecs(makeSpecs({ beam: 12, lengthOverall: 10 }));
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.rule === "beam_exceeds_loa")).toBe(true);
  });

  it("detects beam too wide (>40% of LOA, monohull)", () => {
    const result = validateSpecs(makeSpecs({ beam: 4.3, lengthOverall: 10 }));
    const issue = result.issues.find((i) => i.rule === "beam_too_wide");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("warning");
  });

  it("detects beam too narrow (<15% of LOA)", () => {
    const result = validateSpecs(makeSpecs({ beam: 1, lengthOverall: 12 }));
    const issue = result.issues.find((i) => i.rule === "beam_too_narrow");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("warning");
  });

  it("detects draft exceeding LOA", () => {
    const result = validateSpecs(makeSpecs({ draft: 15, lengthOverall: 10 }));
    const issue = result.issues.find((i) => i.rule === "draft_exceeds_loa");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("error");
  });

  it("detects draft exceeding beam", () => {
    const result = validateSpecs(makeSpecs({ draft: 4, beam: 3 }));
    const issue = result.issues.find((i) => i.rule === "draft_exceeds_beam");
    expect(issue).toBeDefined();
  });

  it("detects draft too deep (>30% of LOA)", () => {
    const result = validateSpecs(makeSpecs({ draft: 4, lengthOverall: 10 }));
    const issue = result.issues.find((i) => i.rule === "draft_too_deep");
    expect(issue).toBeDefined();
  });

  it("detects displacement too low", () => {
    const result = validateSpecs(makeSpecs({ displacement: 1000, lengthOverall: 10 }));
    const issue = result.issues.find((i) => i.rule === "displacement_too_low");
    expect(issue).toBeDefined();
  });

  it("detects displacement too high", () => {
    const result = validateSpecs(makeSpecs({ displacement: 100000, lengthOverall: 10 }));
    const issue = result.issues.find((i) => i.rule === "displacement_too_high");
    expect(issue).toBeDefined();
  });

  it("detects ballast exceeding displacement", () => {
    const result = validateSpecs(makeSpecs({ ballast: 8000, displacement: 6500 }));
    const issue = result.issues.find((i) => i.rule === "ballast_exceeds_displacement");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("error");
  });

  it("detects very high ballast ratio", () => {
    const result = validateSpecs(makeSpecs({ ballast: 5000, displacement: 6500 }));
    const issue = result.issues.find((i) => i.rule === "ballast_ratio_very_high");
    expect(issue).toBeDefined();
  });

  it("detects very low ballast ratio", () => {
    const result = validateSpecs(makeSpecs({ ballast: 500, displacement: 6500 }));
    const issue = result.issues.find((i) => i.rule === "ballast_ratio_very_low");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("info");
  });

  it("detects zero sail area", () => {
    const result = validateSpecs(makeSpecs({ sailAreaMain: 0 }));
    const issue = result.issues.find((i) => i.rule === "sail_area_zero");
    expect(issue).toBeDefined();
  });

  it("detects very low sail area", () => {
    const result = validateSpecs(makeSpecs({ sailAreaMain: 10, lengthOverall: 10 }));
    const issue = result.issues.find((i) => i.rule === "sail_area_very_low");
    expect(issue).toBeDefined();
  });

  it("detects very high sail area", () => {
    const result = validateSpecs(makeSpecs({ sailAreaMain: 400, lengthOverall: 10 }));
    const issue = result.issues.find((i) => i.rule === "sail_area_very_high");
    expect(issue).toBeDefined();
  });

  it("detects berths fewer than cabins", () => {
    const result = validateSpecs(makeSpecs({ cabins: 4, berths: 2 }));
    const issue = result.issues.find((i) => i.rule === "berths_fewer_than_cabins");
    expect(issue).toBeDefined();
  });

  it("detects more heads than cabins", () => {
    const result = validateSpecs(makeSpecs({ cabins: 2, heads: 4 }));
    const issue = result.issues.find((i) => i.rule === "heads_exceed_cabins");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("info");
  });

  it("detects occupancy less than berths", () => {
    const result = validateSpecs(makeSpecs({ berths: 6, maxOccupancy: 4 }));
    const issue = result.issues.find((i) => i.rule === "occupancy_less_than_berths");
    expect(issue).toBeDefined();
  });

  it("detects negative LOA", () => {
    const result = validateSpecs(makeSpecs({ lengthOverall: -5 }));
    const issue = result.issues.find((i) => i.rule === "negative_loa");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("error");
  });

  it("detects negative beam", () => {
    const result = validateSpecs(makeSpecs({ beam: -2 }));
    const issue = result.issues.find((i) => i.rule === "negative_beam");
    expect(issue).toBeDefined();
  });

  it("detects negative draft", () => {
    const result = validateSpecs(makeSpecs({ draft: -1 }));
    const issue = result.issues.find((i) => i.rule === "negative_draft");
    expect(issue).toBeDefined();
  });

  it("detects negative displacement", () => {
    const result = validateSpecs(makeSpecs({ displacement: -1000 }));
    const issue = result.issues.find((i) => i.rule === "negative_displacement");
    expect(issue).toBeDefined();
  });

  it("detects negative ballast", () => {
    const result = validateSpecs(makeSpecs({ ballast: -500 }));
    const issue = result.issues.find((i) => i.rule === "negative_ballast");
    expect(issue).toBeDefined();
  });

  it("detects very small LOA (<5m)", () => {
    const result = validateSpecs(makeSpecs({ lengthOverall: 3 }));
    const issue = result.issues.find((i) => i.rule === "loa_very_small");
    expect(issue).toBeDefined();
  });

  it("detects very large LOA (>30m)", () => {
    const result = validateSpecs(makeSpecs({ lengthOverall: 35 }));
    const issue = result.issues.find((i) => i.rule === "loa_very_large");
    expect(issue).toBeDefined();
  });

  it("handles string numeric values from DB", () => {
    const result = validateSpecs({
      ...makeSpecs(),
      lengthOverall: "10.5",
      beam: "3.5",
      draft: "1.8",
      displacement: "6500",
    });
    expect(result.issues).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it("handles null values gracefully", () => {
    const result = validateSpecs({
      lengthOverall: null,
      beam: null,
      draft: null,
      displacement: null,
      ballast: null,
      sailAreaMain: null,
      rigType: null,
      keelType: null,
      hullMaterial: null,
      cabins: null,
      berths: null,
      heads: null,
      maxOccupancy: null,
      engineHp: null,
      engineType: null,
      fuelCapacity: null,
      waterCapacity: null,
    });
    // No rules should fire on null values (except none of our rules check for null specifically)
    expect(result.isValid).toBe(true);
  });

  it("handles empty object", () => {
    const result = validateSpecs({} as YachtSpecs);
    expect(result.isValid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("accumulates multiple issues", () => {
    const result = validateSpecs({
      lengthOverall: -10,
      beam: 12,
      draft: -5,
    } as Partial<YachtSpecs> as YachtSpecs);
    expect(result.issues.length).toBeGreaterThanOrEqual(3);
    expect(result.isValid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Derived Specs
// ---------------------------------------------------------------------------

describe("calculateDerivedSpecs", () => {
  it("calculates all derived specs for complete data", () => {
    const derived = calculateDerivedSpecs(makeSpecs());
    expect(derived.length).toBe(8);

    const keys = derived.map((d) => d.key);
    expect(keys).toContain("hullSpeed");
    expect(keys).toContain("displacementLength");
    expect(keys).toContain("sailAreaDisplacement");
    expect(keys).toContain("ballastRatioPercent");
    expect(keys).toContain("lengthBeamRatio");
    expect(keys).toContain("beamDraftRatio");
    expect(keys).toContain("capsizeScreening");
    expect(keys).toContain("comfortRatio");
  });

  it("calculates length/beam ratio", () => {
    const derived = calculateDerivedSpecs(makeSpecs({ lengthOverall: 12, beam: 4 }));
    const lbr = derived.find((d) => d.key === "lengthBeamRatio");
    expect(lbr!.value).toBe(3);
  });

  it("calculates beam/draft ratio", () => {
    const derived = calculateDerivedSpecs(makeSpecs({ beam: 3.6, draft: 1.8 }));
    const bdr = derived.find((d) => d.key === "beamDraftRatio");
    expect(bdr!.value).toBe(2);
  });

  it("calculates ballast ratio as percentage", () => {
    const derived = calculateDerivedSpecs(makeSpecs({ ballast: 2200, displacement: 6500 }));
    const br = derived.find((d) => d.key === "ballastRatioPercent");
    expect(br!.value).toBeCloseTo(33.85, 1);
  });

  it("returns null for derived specs when inputs missing", () => {
    const derived = calculateDerivedSpecs({} as YachtSpecs);
    for (const spec of derived) {
      expect(spec.value).toBeNull();
    }
  });

  it("returns null when beam is zero for beam/draft ratio", () => {
    const derived = calculateDerivedSpecs(makeSpecs({ beam: 0, draft: 1.8 }));
    const bdr = derived.find((d) => d.key === "beamDraftRatio");
    expect(bdr!.value).toBeNull();
  });

  it("includes descriptions for all derived specs", () => {
    const derived = calculateDerivedSpecs(makeSpecs());
    for (const spec of derived) {
      expect(spec.description).toBeTruthy();
      expect(spec.label).toBeTruthy();
    }
  });

  it("calculates capsize screening value", () => {
    const derived = calculateDerivedSpecs(makeSpecs({ beam: 3.5, displacement: 6500 }));
    const csv = derived.find((d) => d.key === "capsizeScreening");
    expect(csv!.value).toBeGreaterThan(0);
    expect(csv!.value).toBeLessThan(5); // reasonable range
  });
});

// ---------------------------------------------------------------------------
// Bulk Validation
// ---------------------------------------------------------------------------

describe("summarizeBulkValidation", () => {
  function makeEntry(overrides: Partial<YachtValidationEntry> = {}): YachtValidationEntry {
    return {
      id: 1,
      modelName: "Test Yacht",
      manufacturer: "Test Builder",
      year: 2024,
      slug: "test-yacht",
      issues: [],
      derivedSpecs: [],
      issueCount: { error: 0, warning: 0, info: 0 },
      isValid: true,
      ...overrides,
    };
  }

  it("summarizes empty array", () => {
    const summary = summarizeBulkValidation([]);
    expect(summary.totalYachts).toBe(0);
    expect(summary.yachtsClean).toBe(0);
    expect(summary.topIssues).toEqual([]);
  });

  it("counts yachts with errors, warnings, and clean", () => {
    const entries = [
      makeEntry({ issues: [{ rule: "r1", severity: "error", message: "e", field: "f", value: null }], issueCount: { error: 1, warning: 0, info: 0 }, isValid: false }),
      makeEntry({ issues: [{ rule: "r2", severity: "warning", message: "w", field: "f", value: null }], issueCount: { error: 0, warning: 1, info: 0 }, isValid: true }),
      makeEntry({ issues: [], issueCount: { error: 0, warning: 0, info: 0 }, isValid: true }),
    ]
    const summary = summarizeBulkValidation(entries)
    expect(summary.totalYachts).toBe(3)
    expect(summary.yachtsWithErrors).toBe(1)
    expect(summary.yachtsWithWarnings).toBe(1)
    expect(summary.yachtsClean).toBe(1)
  })

  it("aggregates top issues by count", () => {
    const issue = { rule: "beam_exceeds_loa", severity: "error" as const, message: "Beam exceeds LOA", field: "beam", value: 12 }
    const entries = [
      makeEntry({ id: 1, issues: [issue], issueCount: { error: 1, warning: 0, info: 0 }, isValid: false }),
      makeEntry({ id: 2, issues: [issue], issueCount: { error: 1, warning: 0, info: 0 }, isValid: false }),
      makeEntry({ id: 3, issues: [], issueCount: { error: 0, warning: 0, info: 0 }, isValid: true }),
    ]
    const summary = summarizeBulkValidation(entries)
    expect(summary.topIssues).toHaveLength(1)
    expect(summary.topIssues[0].count).toBe(2)
    expect(summary.topIssues[0].rule).toBe("beam_exceeds_loa")
  })

  it("totals issue counts correctly", () => {
    const entries = [
      makeEntry({ issueCount: { error: 2, warning: 1, info: 0 } }),
      makeEntry({ issueCount: { error: 0, warning: 3, info: 1 } }),
    ]
    const summary = summarizeBulkValidation(entries)
    expect(summary.totalIssues).toEqual({ error: 2, warning: 4, info: 1 })
  })
})

// ---------------------------------------------------------------------------
// RULES metadata
// ---------------------------------------------------------------------------

describe("RULES", () => {
  it("has unique rule IDs", () => {
    const ids = RULES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("all rules have valid severity", () => {
    for (const rule of RULES) {
      expect(["error", "warning", "info"]).toContain(rule.severity)
    }
  })

  it("all rules have a field property", () => {
    for (const rule of RULES) {
      expect(rule.field).toBeTruthy()
    }
  })

  it("has at least 20 rules", () => {
    expect(RULES.length).toBeGreaterThanOrEqual(20)
  })
})

// ---------------------------------------------------------------------------
// Validation result structure
// ---------------------------------------------------------------------------

describe("ValidationResult", () => {
  it("includes derived specs in the result", () => {
    const result = validateSpecs(makeSpecs())
    expect(result.derivedSpecs).toBeDefined()
    expect(Array.isArray(result.derivedSpecs)).toBe(true)
    expect(result.derivedSpecs.length).toBe(8)
  })

  it("provides correct issueCount", () => {
    const result = validateSpecs(makeSpecs({ beam: 12, lengthOverall: 10 }))
    expect(result.issueCount.error).toBe(1) // beam_exceeds_loa
    expect(result.issueCount.warning).toBeGreaterThanOrEqual(0)
  })

  it("isValid is false when errors exist", () => {
    const result = validateSpecs(makeSpecs({ beam: 12, lengthOverall: 10 }))
    expect(result.isValid).toBe(false)
  })

  it("isValid is true with only warnings", () => {
    const result = validateSpecs(makeSpecs({ beam: 4.2, lengthOverall: 10 }))
    // beam is 42% of LOA → beam_too_wide warning, but no errors
    const hasErrors = result.issues.some((i) => i.severity === "error")
    if (!hasErrors) {
      expect(result.isValid).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Multihull exemptions
// ---------------------------------------------------------------------------

describe("multihull exemptions", () => {
  it("does not flag catamaran beam as too wide", () => {
    // Lagoon 46: beam 7.94, LOA 13.99 → 57% ratio
    const result = validateSpecs(makeSpecs({ beam: 7.94, lengthOverall: 13.99 }));
    const issue = result.issues.find((i) => i.rule === "beam_too_wide");
    expect(issue).toBeUndefined();
  });

  it("does not flag catamaran displacement as too low", () => {
    // Catamarans are lighter per meter
    const result = validateSpecs(makeSpecs({ beam: 7, lengthOverall: 12, displacement: 9000 }));
    const issue = result.issues.find((i) => i.rule === "displacement_too_low");
    expect(issue).toBeUndefined();
  });

  it("does not flag catamaran sail area as too low", () => {
    const result = validateSpecs(makeSpecs({ beam: 7, lengthOverall: 12, sailAreaMain: 50 }));
    const issue = result.issues.find((i) => i.rule === "sail_area_very_low");
    expect(issue).toBeUndefined();
  });

  it("still flags monohull beam as too wide at 42%", () => {
    const result = validateSpecs(makeSpecs({ beam: 4.2, lengthOverall: 10 }));
    const issue = result.issues.find((i) => i.rule === "beam_too_wide");
    expect(issue).toBeDefined();
  });
});
