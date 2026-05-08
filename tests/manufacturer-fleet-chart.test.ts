import { describe, it, expect } from "vitest";

// ─── Rig color logic (mirrors component logic) ────────────

const RIG_COLORS: Record<string, string> = {
  Sloop: "#3b82f6",
  Cutter: "#8b5cf6",
  Ketch: "#10b981",
  Yawl: "#f59e0b",
  Schooner: "#ef4444",
  "Cutter (staysail)": "#ec4899",
  "Fractional Sloop": "#06b6d4",
  "Masthead Sloop": "#6366f1",
};
const DEFAULT_COLOR = "#94a3b8";

function getRigColor(rigType: string | null): string {
  if (!rigType) return DEFAULT_COLOR;
  return RIG_COLORS[rigType] ?? DEFAULT_COLOR;
}

// ─── Chart data preparation (mirrors component logic) ────────────

interface Yacht {
  modelName: string;
  lengthOverall: number | null;
  year: number;
  beam: number | null;
  displacement: number | null;
  rigType: string | null;
  slug: string | null;
}

function prepareChartData(yachts: Yacht[]) {
  return yachts
    .filter((y) => y.lengthOverall !== null)
    .map((y) => ({
      name: y.modelName,
      loa: y.lengthOverall!,
      year: y.year,
      rigType: y.rigType,
      color: getRigColor(y.rigType),
    }))
    .sort((a, b) => a.loa - b.loa);
}

describe("Manufacturer Fleet Chart — rig color mapping", () => {
  it("maps known rig types to their colors", () => {
    expect(getRigColor("Sloop")).toBe("#3b82f6");
    expect(getRigColor("Ketch")).toBe("#10b981");
    expect(getRigColor("Yawl")).toBe("#f59e0b");
  });

  it("returns default color for null rig type", () => {
    expect(getRigColor(null)).toBe(DEFAULT_COLOR);
  });

  it("returns default color for unknown rig type", () => {
    expect(getRigColor("Catboat")).toBe(DEFAULT_COLOR);
  });
});

describe("Manufacturer Fleet Chart — data preparation", () => {
  const sampleYachts: Yacht[] = [
    { modelName: "Oceanis 30.1", lengthOverall: 9.53, year: 2019, beam: 3.29, displacement: 3800, rigType: "Sloop", slug: "beneteau-oceanis-301" },
    { modelName: "Oceanis 40.1", lengthOverall: 12.43, year: 2019, beam: 3.98, displacement: 7600, rigType: "Sloop", slug: "beneteau-oceanis-401" },
    { modelName: "Oceanis 51.1", lengthOverall: 15.55, year: 2017, beam: 4.78, displacement: 12000, rigType: "Sloop", slug: "beneteau-oceanis-511" },
    { modelName: "Sense 55", lengthOverall: null, year: 2015, beam: 4.9, displacement: 14000, rigType: "Sloop", slug: null },
  ];

  it("filters out yachts without LOA data", () => {
    const result = prepareChartData(sampleYachts);
    expect(result).toHaveLength(3);
    expect(result.find((d) => d.name === "Sense 55")).toBeUndefined();
  });

  it("sorts by LOA ascending", () => {
    const result = prepareChartData(sampleYachts);
    expect(result[0].name).toBe("Oceanis 30.1");
    expect(result[1].name).toBe("Oceanis 40.1");
    expect(result[2].name).toBe("Oceanis 51.1");
  });

  it("assigns rig colors correctly", () => {
    const result = prepareChartData(sampleYachts);
    expect(result[0].color).toBe("#3b82f6"); // Sloop
  });

  it("returns empty array when all yachts have null LOA", () => {
    const noData: Yacht[] = [
      { modelName: "Mystery", lengthOverall: null, year: 2020, beam: null, displacement: null, rigType: null, slug: null },
    ];
    expect(prepareChartData(noData)).toHaveLength(0);
  });

  it("handles mixed rig types with correct colors", () => {
    const mixed: Yacht[] = [
      { modelName: "SloopYacht", lengthOverall: 10, year: 2020, beam: null, displacement: null, rigType: "Sloop", slug: "s" },
      { modelName: "KetchYacht", lengthOverall: 12, year: 2020, beam: null, displacement: null, rigType: "Ketch", slug: "k" },
      { modelName: "UnknownRig", lengthOverall: 14, year: 2020, beam: null, displacement: null, rigType: "Catboat", slug: "u" },
    ];
    const result = prepareChartData(mixed);
    expect(result[0].color).toBe("#3b82f6"); // Sloop
    expect(result[1].color).toBe("#10b981"); // Ketch
    expect(result[2].color).toBe(DEFAULT_COLOR); // unknown rig
  });
});
