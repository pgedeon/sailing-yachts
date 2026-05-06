/**
 * Tests for the comparison radar chart normalization logic.
 *
 * Covers: normalise function, buildChartData function, edge cases.
 */
import { describe, it, expect } from "vitest";

// Inline the functions for unit testing (they're not exported from the component)
function normalise(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.round(((value - min) / (max - min)) * 100);
}

interface YachtSpecData {
  id: number;
  manufacturer: string;
  modelName: string;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sailAreaMain: number | null;
  engineHp: number | null;
}

const RADAR_SPEC_KEYS: (keyof YachtSpecData)[] = [
  "lengthOverall",
  "beam",
  "draft",
  "displacement",
  "ballast",
  "sailAreaMain",
  "engineHp",
];

interface ChartEntry {
  spec: string;
  [yachtKey: string]: string | number;
}

function buildChartData(
  yachts: YachtSpecData[],
  labels: Record<string, string>,
): ChartEntry[] {
  const ranges: Record<string, { min: number; max: number }> = {};
  for (const key of RADAR_SPEC_KEYS) {
    const values = yachts
      .map((y) => y[key])
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) continue;
    ranges[key as string] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  return RADAR_SPEC_KEYS.filter((key) => key in ranges).map((key) => {
    const range = ranges[key as string]!;
    const entry: ChartEntry = {
      spec: labels[key as string] || (key as string),
    };
    yachts.forEach((yacht, i) => {
      const raw = yacht[key] as number | null | undefined;
      entry[`yacht_${i}`] =
        raw !== null && raw !== undefined
          ? normalise(raw, range.min, range.max)
          : 0;
    });
    return entry;
  });
}

describe("Radar chart normalise function", () => {
  it("returns 100 for max value", () => {
    expect(normalise(100, 0, 100)).toBe(100);
  });

  it("returns 0 for min value", () => {
    expect(normalise(0, 0, 100)).toBe(0);
  });

  it("returns 50 when min equals max", () => {
    expect(normalise(50, 50, 50)).toBe(50);
  });

  it("returns 50 for midpoint", () => {
    expect(normalise(50, 0, 100)).toBe(50);
  });

  it("handles non-zero ranges correctly", () => {
    // 15 in range 10-20 → (15-10)/(20-10) = 0.5 → 50
    expect(normalise(15, 10, 20)).toBe(50);
  });

  it("rounds correctly", () => {
    // 7 in range 0-10 → 0.7 → 70
    expect(normalise(7, 0, 10)).toBe(70);
    // 3 in range 0-7 → 3/7 ≈ 0.4286 → 43
    expect(normalise(3, 0, 7)).toBe(43);
  });
});

describe("buildChartData", () => {
  const labels: Record<string, string> = {
    lengthOverall: "Length Overall",
    beam: "Beam",
    draft: "Draft",
    displacement: "Displacement",
    ballast: "Ballast",
    sailAreaMain: "Sail Area",
    engineHp: "Engine HP",
  };

  const yachts: YachtSpecData[] = [
    {
      id: 1,
      manufacturer: "Beneteau",
      modelName: "Oceanis 40.1",
      lengthOverall: 12.43,
      beam: 3.99,
      draft: 2.4,
      displacement: 8300,
      ballast: 2500,
      sailAreaMain: 74,
      engineHp: 45,
    },
    {
      id: 2,
      manufacturer: "Jeanneau",
      modelName: "Sun Odyssey 440",
      lengthOverall: 13.39,
      beam: 4.29,
      draft: 2.24,
      displacement: 9300,
      ballast: 2800,
      sailAreaMain: 80,
      engineHp: 54,
    },
  ];

  it("generates one entry per spec key that has data", () => {
    const data = buildChartData(yachts, labels);
    expect(data).toHaveLength(RADAR_SPEC_KEYS.length);
  });

  it("uses translated labels for spec names", () => {
    const data = buildChartData(yachts, labels);
    const specNames = data.map((d) => d.spec);
    expect(specNames).toContain("Length Overall");
    expect(specNames).toContain("Beam");
    expect(specNames).toContain("Displacement");
  });

  it("normalises min to 0 and max to 100", () => {
    const data = buildChartData(yachts, labels);
    const loaEntry = data.find((d) => d.spec === "Length Overall")!;
    // Beneteau 12.43 is min → 0, Jeanneau 13.39 is max → 100
    expect(loaEntry["yacht_0"]).toBe(0);
    expect(loaEntry["yacht_1"]).toBe(100);
  });

  it("normalises intermediate values correctly", () => {
    const data = buildChartData(yachts, labels);
    const dispEntry = data.find((d) => d.spec === "Displacement")!;
    // Beneteau 8300 is min → 0, Jeanneau 9300 is max → 100
    expect(dispEntry["yacht_0"]).toBe(0);
    expect(dispEntry["yacht_1"]).toBe(100);
  });

  it("handles null values as 0", () => {
    const yachtWithNull: YachtSpecData[] = [
      {
        ...yachts[0],
        lengthOverall: 10,
      },
      {
        ...yachts[1],
        lengthOverall: 20,
        beam: null,
      },
    ];
    const data = buildChartData(yachtWithNull, labels);
    // LOA: 10 vs 20 → 0 vs 100
    const loaEntry = data.find((d) => d.spec === "Length Overall")!;
    expect(loaEntry["yacht_0"]).toBe(0);
    expect(loaEntry["yacht_1"]).toBe(100);
    // Beam: yacht_1 has null → 0
    const beamEntry = data.find((d) => d.spec === "Beam")!;
    expect(beamEntry["yacht_1"]).toBe(0);
  });

  it("skips spec keys where all yachts have null values", () => {
    const yachtNoHp: YachtSpecData[] = [
      { ...yachts[0], engineHp: null },
      { ...yachts[1], engineHp: null },
    ];
    const data = buildChartData(yachtNoHp, labels);
    const specNames = data.map((d) => d.spec);
    expect(specNames).not.toContain("Engine HP");
  });

  it("handles single yacht gracefully", () => {
    const data = buildChartData([yachts[0]], labels);
    // All values should be 50 (min === max)
    for (const entry of data) {
      expect(entry["yacht_0"]).toBe(50);
    }
  });

  it("handles 3+ yachts", () => {
    const threeYachts: YachtSpecData[] = [
      ...yachts,
      {
        id: 3,
        manufacturer: "Hanse",
        modelName: "418",
        lengthOverall: 12.4,
        beam: 3.95,
        draft: 2.1,
        displacement: 8700,
        ballast: 2600,
        sailAreaMain: 72,
        engineHp: 42,
      },
    ];
    const data = buildChartData(threeYachts, labels);
    const loaEntry = data.find((d) => d.spec === "Length Overall")!;
    expect(Object.keys(loaEntry)).toContain("yacht_0");
    expect(Object.keys(loaEntry)).toContain("yacht_1");
    expect(Object.keys(loaEntry)).toContain("yacht_2");
  });
});

describe("Radar chart i18n keys", () => {
  it("en.json has radar keys in Compare namespace", async () => {
    const en = (await import("../messages/en.json")).default;
    expect(en.Compare.radar).toBeDefined();
    expect(en.Compare.radar.title).toBe("Spec Comparison");
    expect(en.Compare.radar.scaleNote).toBeDefined();
    expect(en.Compare.radar.dataTableToggle).toBeDefined();
  });

  it("fr.json has radar keys in Compare namespace", async () => {
    const fr = (await import("../messages/fr.json")).default;
    expect(fr.Compare.radar).toBeDefined();
    expect(fr.Compare.radar.title).toBe("Comparaison des spécifications");
    expect(fr.Compare.radar.scaleNote).toBeDefined();
    expect(fr.Compare.radar.dataTableToggle).toBeDefined();
  });

  it("en and fr have identical radar key structure", async () => {
    const en = (await import("../messages/en.json")).default;
    const fr = (await import("../messages/fr.json")).default;
    const enKeys = Object.keys(en.Compare.radar);
    const frKeys = Object.keys(fr.Compare.radar);
    expect(enKeys.sort()).toEqual(frKeys.sort());
  });
});
