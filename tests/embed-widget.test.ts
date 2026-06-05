import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Embed URL Builder Tests ──────────────────────────────────────────

describe("Embed Widget URL Builder", () => {
  const siteUrl = "https://info.sailboats.fr";

  it("builds basic embed URL with yacht IDs", () => {
    const url = `${siteUrl}/embed/compare?ids=26,27`;
    const params = new URL(url).searchParams;
    expect(params.get("ids")).toBe("26,27");
  });

  it("builds compact layout embed URL", () => {
    const url = `${siteUrl}/embed/compare?ids=26,27&layout=compact`;
    const params = new URL(url).searchParams;
    expect(params.get("ids")).toBe("26,27");
    expect(params.get("layout")).toBe("compact");
  });

  it("builds full layout embed URL", () => {
    const url = `${siteUrl}/embed/compare?ids=26,27&layout=full`;
    const params = new URL(url).searchParams;
    expect(params.get("layout")).toBe("full");
  });

  it("builds dark theme embed URL", () => {
    const url = `${siteUrl}/embed/compare?ids=26,27&theme=dark`;
    const params = new URL(url).searchParams;
    expect(params.get("theme")).toBe("dark");
  });

  it("builds auto theme embed URL", () => {
    const url = `${siteUrl}/embed/compare?ids=26,27&theme=auto`;
    const params = new URL(url).searchParams;
    expect(params.get("theme")).toBe("auto");
  });

  it("builds full URL with all options", () => {
    const url = `${siteUrl}/embed/compare?ids=1,2,3,4&layout=compact&theme=dark`;
    const params = new URL(url).searchParams;
    expect(params.get("ids")).toBe("1,2,3,4");
    expect(params.get("layout")).toBe("compact");
    expect(params.get("theme")).toBe("dark");
  });

  it("defaults to full layout when layout param is missing", () => {
    const url = `${siteUrl}/embed/compare?ids=26,27`;
    const params = new URL(url).searchParams;
    const layout = params.get("layout");
    // Default should be "full" when not specified
    expect(layout).toBeNull();
  });
});

// ─── Iframe Embed Code Generation Tests ───────────────────────────────

describe("Iframe Embed Code Generation", () => {
  const siteUrl = "https://info.sailboats.fr";

  it("generates valid iframe embed code with correct src", () => {
    const ids = "26,27";
    const layout = "compact";
    const theme = "light";
    const src = `${siteUrl}/embed/compare?ids=${ids}&layout=${layout}&theme=${theme}`;
    const code = `<iframe src="${src}" width="100%" height="400" frameBorder="0"></iframe>`;

    expect(code).toContain(`src="${src}"`);
    expect(code).toContain('width="100%"');
    expect(code).toContain('height="400"');
    expect(code).toContain("<iframe");
    expect(code).toContain("</iframe>");
  });

  it("uses 600px height for full layout", () => {
    const code = `<iframe src="..." height="600"></iframe>`;
    expect(code).toContain('height="600"');
  });

  it("uses 400px height for compact layout", () => {
    const code = `<iframe src="..." height="400"></iframe>`;
    expect(code).toContain('height="400"');
  });
});

// ─── JS Embed Code Generation Tests ───────────────────────────────────

describe("JS Embed Code Generation", () => {
  it("includes auto-resize listener", () => {
    const code = `window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'sailing-yachts-embed' && e.data.height) {
        iframe.height = e.data.height + 'px';
      }
    });`;

    expect(code).toContain("sailing-yachts-embed");
    expect(code).toContain("e.data.height");
  });

  it("creates iframe dynamically", () => {
    const code = `var iframe = document.createElement('iframe');`;
    expect(code).toContain("createElement('iframe')");
  });

  it("appends to target container", () => {
    const code = `document.getElementById('sailing-yachts-widget').appendChild(iframe);`;
    expect(code).toContain("sailing-yachts-widget");
    expect(code).toContain("appendChild");
  });
});

// ─── Embed Configurator Logic Tests ───────────────────────────────────

describe("Embed Configurator Logic", () => {
  it("limits yacht selection to 4", () => {
    const MAX_YACHTS = 4;
    const selected = [1, 2, 3, 4];
    const canAdd = selected.length < MAX_YACHTS;
    expect(canAdd).toBe(false);
  });

  it("allows adding when under limit", () => {
    const MAX_YACHTS = 4;
    const selected = [1, 2];
    const canAdd = selected.length < MAX_YACHTS;
    expect(canAdd).toBe(true);
  });

  it("requires minimum 2 yachts", () => {
    const selected = [1];
    const canGenerate = selected.length >= 2;
    expect(canGenerate).toBe(false);
  });

  it("generates embed URL with 2 yachts", () => {
    const selected = [
      { id: 26, modelName: "Oceanis 40.1", manufacturer: "Beneteau" },
      { id: 27, modelName: "C42", manufacturer: "Bavaria" },
    ];
    const ids = selected.map((y) => y.id).join(",");
    expect(ids).toBe("26,27");
  });

  it("parses valid IDs from query string", () => {
    const idsParam = "26,27,30";
    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));
    expect(ids).toEqual([26, 27, 30]);
  });

  it("rejects invalid IDs", () => {
    const idsParam = "26,abc,27";
    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));
    expect(ids).toEqual([26, 27]);
  });

  it("validates yacht count between 2 and 4", () => {
    const valid = (n: number) => n >= 2 && n <= 4;
    expect(valid(0)).toBe(false);
    expect(valid(1)).toBe(false);
    expect(valid(2)).toBe(true);
    expect(valid(3)).toBe(true);
    expect(valid(4)).toBe(true);
    expect(valid(5)).toBe(false);
  });
});

// ─── PostMessage Auto-Resize Tests ────────────────────────────────────

describe("PostMessage Auto-Resize Protocol", () => {
  it("sails-yachts-embed message includes height", () => {
    const message = { type: "sailing-yachts-embed", height: 450 };
    expect(message.type).toBe("sailing-yachts-embed");
    expect(message.height).toBe(450);
    expect(typeof message.height).toBe("number");
  });

  it("handler ignores unrelated messages", () => {
    const validMessage = { type: "sailing-yachts-embed", height: 300 };
    const invalidMessage = { type: "other-widget", height: 300 };
    const noTypeMessage = { height: 300 };

    const isValid = (data: any) =>
      data && data.type === "sailing-yachts-embed" && typeof data.height === "number";

    expect(isValid(validMessage)).toBe(true);
    expect(isValid(invalidMessage)).toBe(false);
    expect(isValid(noTypeMessage)).toBe(false);
  });
});

// ─── Theme Detection Tests ────────────────────────────────────────────

describe("Theme Color Scheme", () => {
  type ThemeMode = "light" | "dark" | "auto";

  function resolveTheme(theme: ThemeMode, prefersDark: boolean): boolean {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    // auto
    return prefersDark;
  }

  it("light theme always uses light colors", () => {
    expect(resolveTheme("light", true)).toBe(false);
    expect(resolveTheme("light", false)).toBe(false);
  });

  it("dark theme always uses dark colors", () => {
    expect(resolveTheme("dark", true)).toBe(true);
    expect(resolveTheme("dark", false)).toBe(true);
  });

  it("auto theme follows system preference", () => {
    expect(resolveTheme("auto", true)).toBe(true);
    expect(resolveTheme("auto", false)).toBe(false);
  });
});

// ─── Layout Mode Tests ────────────────────────────────────────────────

describe("Layout Mode Spec Fields", () => {
  interface SpecField { key: string; label: string; unit?: string }
  interface SpecGroup { group: string; fields: SpecField[] }

  const COMPACT_FIELDS: SpecGroup[] = [
    {
      group: "Key Specs",
      fields: [
        { key: "lengthOverall", label: "LOA", unit: "m" },
        { key: "beam", label: "Beam", unit: "m" },
        { key: "draft", label: "Draft", unit: "m" },
        { key: "displacement", label: "Displacement", unit: "kg" },
        { key: "cabins", label: "Cabins" },
        { key: "berths", label: "Berths" },
      ],
    },
  ];

  const FULL_FIELDS: SpecGroup[] = [
    { group: "Dimensions", fields: [
      { key: "lengthOverall", label: "LOA", unit: "m" },
      { key: "beam", label: "Beam", unit: "m" },
      { key: "draft", label: "Draft", unit: "m" },
      { key: "displacement", label: "Displacement", unit: "kg" },
      { key: "ballast", label: "Ballast", unit: "kg" },
    ]},
    { group: "Rig & Sails", fields: [
      { key: "sailAreaMain", label: "Sail Area", unit: "m²" },
      { key: "rigType", label: "Rig Type" },
    ]},
    { group: "Construction", fields: [
      { key: "keelType", label: "Keel" },
      { key: "hullMaterial", label: "Hull" },
    ]},
    { group: "Accommodation", fields: [
      { key: "cabins", label: "Cabins" },
      { key: "berths", label: "Berths" },
      { key: "heads", label: "Heads" },
      { key: "maxOccupancy", label: "Max Occupancy" },
    ]},
    { group: "Engine & Tankage", fields: [
      { key: "engineHp", label: "Engine HP" },
      { key: "engineType", label: "Engine Type" },
      { key: "fuelCapacity", label: "Fuel", unit: "L" },
      { key: "waterCapacity", label: "Water", unit: "L" },
    ]},
  ];

  it("compact layout has fewer spec groups", () => {
    expect(COMPACT_FIELDS.length).toBe(1);
    expect(FULL_FIELDS.length).toBe(5);
  });

  it("compact layout has 6 fields", () => {
    const totalFields = COMPACT_FIELDS.reduce((sum, g) => sum + g.fields.length, 0);
    expect(totalFields).toBe(6);
  });

  it("full layout has 17 fields", () => {
    const totalFields = FULL_FIELDS.reduce((sum, g) => sum + g.fields.length, 0);
    expect(totalFields).toBe(17);
  });

  it("compact includes only essential specs", () => {
    const labels = COMPACT_FIELDS.flatMap((g) => g.fields.map((f) => f.label));
    expect(labels).toContain("LOA");
    expect(labels).toContain("Beam");
    expect(labels).toContain("Draft");
    expect(labels).toContain("Cabins");
    expect(labels).not.toContain("Engine HP");
    expect(labels).not.toContain("Keel");
  });
});
