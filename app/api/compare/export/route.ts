import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

interface SpecRow {
  yachtModelId: number;
  categoryName: string;
  categoryGroup: string;
  unit: string | null;
  valueText: string | null;
  valueNumeric: number | null;
}

/**
 * GET /api/compare/export?ids=1,2,3&format=csv
 *
 * Generates a CSV export of comparison data for the given yacht IDs.
 * Also supports a JSON format for programmatic access.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    const format = searchParams.get("format") || "csv";

    if (!idsParam) {
      return NextResponse.json(
        { error: "ids parameter required" },
        { status: 400 }
      );
    }

    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (ids.length < 2) {
      return NextResponse.json(
        { error: "Minimum 2 yachts required" },
        { status: 400 }
      );
    }

    if (ids.length > 4) {
      return NextResponse.json(
        { error: "Maximum 4 yachts allowed" },
        { status: 400 }
      );
    }

    // Fetch yacht base data
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const yachtQuery = `
      SELECT
        y.id,
        y.model_name,
        m.name AS manufacturer_name,
        y.year,
        y.length_overall,
        y.beam,
        y.draft,
        y.displacement,
        y.ballast,
        y.sail_area_main,
        y.rig_type,
        y.keel_type,
        y.hull_material,
        y.cabins,
        y.berths,
        y.heads,
        y.max_occupancy,
        y.engine_hp,
        y.engine_type,
        y.fuel_capacity,
        y.water_capacity,
        y.design_notes
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      WHERE y.id IN (${placeholders})
    `;
    const yachtResult = await pool.query(yachtQuery, ids);
    const yachts = yachtResult.rows;

    if (yachts.length === 0) {
      return NextResponse.json(
        { error: "No yachts found" },
        { status: 404 }
      );
    }

    // Fetch spec_values
    const specPlaceholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const specQuery = `
      SELECT
        sv.yacht_model_id,
        sv.value_text,
        sv.value_numeric,
        sc.name AS category_name,
        sc.category_group,
        sc.unit
      FROM spec_values sv
      JOIN spec_categories sc ON sv.spec_category_id = sc.id
      WHERE sv.yacht_model_id IN (${specPlaceholders})
      ORDER BY sc.category_group, sc.name
    `;
    const specResult = await pool.query(specQuery, ids);
    const specRows: SpecRow[] = specResult.rows;

    // Group specs by yacht id
    const specsByYacht: Record<number, SpecRow[]> = {};
    for (const sr of specRows) {
      if (!specsByYacht[sr.yachtModelId]) specsByYacht[sr.yachtModelId] = [];
      specsByYacht[sr.yachtModelId].push(sr);
    }

    if (format === "json") {
      return NextResponse.json({
        yachts: yachts.map((y: any) => ({
          id: y.id,
          manufacturer: y.manufacturer_name ?? "",
          model: y.model_name,
          year: y.year ?? null,
          specs: {
            lengthOverall: y.length_overall ? Number(y.length_overall) : null,
            beam: y.beam ? Number(y.beam) : null,
            draft: y.draft ? Number(y.draft) : null,
            displacement: y.displacement ? Number(y.displacement) : null,
            ballast: y.ballast ? Number(y.ballast) : null,
            sailAreaMain: y.sail_area_main ? Number(y.sail_area_main) : null,
            rigType: y.rig_type ?? null,
            keelType: y.keel_type ?? null,
            hullMaterial: y.hull_material ?? null,
            cabins: y.cabins ?? null,
            berths: y.berths ?? null,
            heads: y.heads ?? null,
            maxOccupancy: y.max_occupancy ?? null,
            engineHp: y.engine_hp ? Number(y.engine_hp) : null,
            engineType: y.engine_type ?? null,
            fuelCapacity: y.fuel_capacity ? Number(y.fuel_capacity) : null,
            waterCapacity: y.water_capacity ? Number(y.water_capacity) : null,
          },
          designNotes: y.design_notes ?? null,
          extraSpecs: (specsByYacht[y.id] || []).map((s) => ({
            category: s.categoryName,
            group: s.categoryGroup,
            value: s.valueNumeric !== null ? Number(s.valueNumeric) : s.valueText,
            unit: s.unit,
          })),
        })),
        generatedAt: new Date().toISOString(),
        source: "sailboats.fr",
      });
    }

    // CSV format
    const yachtNames = yachts.map(
      (y: any) =>
        `${y.manufacturer_name ?? ""} ${y.model_name}`.trim()
    );
    const csvRows: string[] = [];

    // Header
    csvRows.push(
      ["Specification", ...yachtNames].map(csvEscape).join(",")
    );

    // Built-in spec rows
    const builtinSpecs: { key: string; label: string; unit?: string }[] = [
      { key: "year", label: "Year" },
      { key: "length_overall", label: "Length Overall", unit: "m" },
      { key: "beam", label: "Beam", unit: "m" },
      { key: "draft", label: "Draft", unit: "m" },
      { key: "displacement", label: "Displacement", unit: "kg" },
      { key: "ballast", label: "Ballast", unit: "kg" },
      { key: "sail_area_main", label: "Sail Area (Main)", unit: "m²" },
      { key: "rig_type", label: "Rig Type" },
      { key: "keel_type", label: "Keel Type" },
      { key: "hull_material", label: "Hull Material" },
      { key: "cabins", label: "Cabins" },
      { key: "berths", label: "Berths" },
      { key: "heads", label: "Heads" },
      { key: "max_occupancy", label: "Max Occupancy" },
      { key: "engine_hp", label: "Engine HP" },
      { key: "engine_type", label: "Engine Type" },
      { key: "fuel_capacity", label: "Fuel Capacity", unit: "L" },
      { key: "water_capacity", label: "Water Capacity", unit: "L" },
    ];

    for (const spec of builtinSpecs) {
      const label = spec.unit
        ? `${spec.label} (${spec.unit})`
        : spec.label;
      const values = yachts.map((y: any) => {
        const val = y[spec.key];
        if (val === null || val === undefined) return "—";
        return String(val);
      });
      csvRows.push([label, ...values].map(csvEscape).join(","));
    }

    // Design notes
    if (yachts.some((y: any) => y.design_notes)) {
      const notesValues = yachts.map((y: any) => y.design_notes || "—");
      csvRows.push(
        ["Design Notes", ...notesValues].map(csvEscape).join(",")
      );
    }

    // Extra specs from spec_values
    const allSpecNames = new Set<string>();
    const specMap: Record<string, Record<number, string>> = {};

    for (const yachtId of ids) {
      for (const sr of specsByYacht[yachtId] || []) {
        allSpecNames.add(sr.categoryName);
        if (!specMap[sr.categoryName]) specMap[sr.categoryName] = {};
        specMap[sr.categoryName][yachtId] =
          sr.valueNumeric !== null
            ? String(Number(sr.valueNumeric))
            : sr.valueText || "—";
      }
    }

    for (const name of [...allSpecNames].sort()) {
      const values = ids.map((id) => specMap[name]?.[id] ?? "—");
      csvRows.push([name, ...values].map(csvEscape).join(","));
    }

    // Footer
    csvRows.push("");
    csvRows.push(
      csvEscape(
        `Generated by sailboats.fr on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
      )
    );

    const csvContent = csvRows.join("\n");
    const filename = `comparison-${yachtNames.map((n: string) => n.replace(/\s+/g, "-").toLowerCase()).join("-vs-")}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Compare export error:", error);
    return NextResponse.json(
      { error: "Failed to generate export", details: error.message },
      { status: 500 }
    );
  }
}

function csvEscape(value: string): string {
  if (!value) return '""';
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
