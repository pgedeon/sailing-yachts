import { pool } from "@/lib/db";
import { calculatePriceTier } from "@/lib/price-tier";
import EmbedCompareClient from "./EmbedCompareClient";

export const dynamic = "force-dynamic";

interface YachtRow {
  id: number;
  model_name: string;
  manufacturer_name: string;
  slug: string | null;
  year: number | null;
  length_overall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sail_area_main: number | null;
  rig_type: string | null;
  keel_type: string | null;
  hull_material: string | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  max_occupancy: number | null;
  engine_hp: number | null;
  engine_type: string | null;
  fuel_capacity: number | null;
  water_capacity: number | null;
  design_notes: string | null;
}

interface SpecValue {
  yacht_model_id: number;
  category_group: string;
  category_name: string;
  unit: string | null;
  value_text: string | null;
  value_numeric: number | null;
}

interface YachtDTO {
  id: number;
  manufacturer: string;
  modelName: string;
  slug: string | null;
  year: number | null;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sailAreaMain: number | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  maxOccupancy: number | null;
  engineHp: number | null;
  engineType: string | null;
  fuelCapacity: number | null;
  waterCapacity: number | null;
  designNotes: string | null;
  specsByGroup: Record<string, { name: string; value: string; unit: string | null }[]>;
  priceTier: ReturnType<typeof calculatePriceTier>;
}

const SPEC_FIELDS: { group: string; fields: { key: keyof YachtDTO; label: string; unit?: string }[] }[] = [
  {
    group: "Dimensions",
    fields: [
      { key: "lengthOverall", label: "LOA", unit: "m" },
      { key: "beam", label: "Beam", unit: "m" },
      { key: "draft", label: "Draft", unit: "m" },
      { key: "displacement", label: "Displacement", unit: "kg" },
      { key: "ballast", label: "Ballast", unit: "kg" },
    ],
  },
  {
    group: "Rig & Sails",
    fields: [
      { key: "sailAreaMain", label: "Sail Area", unit: "m²" },
      { key: "rigType", label: "Rig Type" },
    ],
  },
  {
    group: "Construction",
    fields: [
      { key: "keelType", label: "Keel" },
      { key: "hullMaterial", label: "Hull" },
    ],
  },
  {
    group: "Accommodation",
    fields: [
      { key: "cabins", label: "Cabins" },
      { key: "berths", label: "Berths" },
      { key: "heads", label: "Heads" },
      { key: "maxOccupancy", label: "Max Occupancy" },
    ],
  },
  {
    group: "Engine & Tankage",
    fields: [
      { key: "engineHp", label: "Engine HP" },
      { key: "engineType", label: "Engine Type" },
      { key: "fuelCapacity", label: "Fuel", unit: "L" },
      { key: "waterCapacity", label: "Water", unit: "L" },
    ],
  },
];

export default async function EmbedComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;
  const idsParam = params.ids;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";

  if (!idsParam) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="text-lg font-medium">No yachts selected</p>
        <p className="text-sm mt-1">
          Usage: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/embed/compare?ids=26,27</code>
        </p>
      </div>
    );
  }

  const ids = idsParam
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));

  if (ids.length < 2 || ids.length > 4) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="text-lg font-medium">Invalid selection</p>
        <p className="text-sm mt-1">Please provide 2–4 yacht IDs</p>
      </div>
    );
  }

  // Fetch yachts
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  const yachtResult = await pool.query(
    `SELECT y.id, y.model_name, m.name AS manufacturer_name, y.slug, y.year,
       y.length_overall, y.beam, y.draft, y.displacement, y.ballast,
       y.sail_area_main, y.rig_type, y.keel_type, y.hull_material,
       y.cabins, y.berths, y.heads, y.max_occupancy,
       y.engine_hp, y.engine_type, y.fuel_capacity, y.water_capacity,
       y.design_notes
     FROM yacht_models y
     LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
     WHERE y.id IN (${placeholders})`,
    ids
  );

  const rows = yachtResult.rows as YachtRow[];
  if (rows.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No yachts found for the given IDs.</p>
      </div>
    );
  }

  // Fetch spec values
  const specResult = await pool.query(
    `SELECT sv.yacht_model_id, sv.value_text, sv.value_numeric,
       sc.name AS category_name, sc.category_group, sc.unit
     FROM spec_values sv
     JOIN spec_categories sc ON sv.spec_category_id = sc.id
     WHERE sv.yacht_model_id IN (${placeholders})
     ORDER BY sc.category_group, sc.name`,
    ids
  );
  const specRows = specResult.rows as SpecValue[];

  // Build specsByGroup per yacht
  const specsMap: Record<number, Record<string, { name: string; value: string; unit: string | null }[]>> = {};
  for (const sr of specRows) {
    const yid = sr.yacht_model_id;
    if (!specsMap[yid]) specsMap[yid] = {};
    const group = sr.category_group || "Other";
    if (!specsMap[yid][group]) specsMap[yid][group] = [];
    let value = "—";
    if (sr.value_numeric !== null) {
      value = Number(sr.value_numeric).toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else if (sr.value_text) {
      value = sr.value_text;
    }
    specsMap[yid][group].push({ name: sr.category_name, value, unit: sr.unit });
  }

  // Map to DTO
  const yachts: YachtDTO[] = rows.map((row) => ({
    id: row.id,
    manufacturer: row.manufacturer_name ?? "",
    modelName: row.model_name,
    slug: row.slug,
    year: row.year,
    lengthOverall: row.length_overall ? Number(row.length_overall) : null,
    beam: row.beam ? Number(row.beam) : null,
    draft: row.draft ? Number(row.draft) : null,
    displacement: row.displacement ? Number(row.displacement) : null,
    ballast: row.ballast ? Number(row.ballast) : null,
    sailAreaMain: row.sail_area_main ? Number(row.sail_area_main) : null,
    rigType: row.rig_type,
    keelType: row.keel_type,
    hullMaterial: row.hull_material,
    cabins: row.cabins,
    berths: row.berths,
    heads: row.heads,
    maxOccupancy: row.max_occupancy,
    engineHp: row.engine_hp ? Number(row.engine_hp) : null,
    engineType: row.engine_type,
    fuelCapacity: row.fuel_capacity ? Number(row.fuel_capacity) : null,
    waterCapacity: row.water_capacity ? Number(row.water_capacity) : null,
    designNotes: row.design_notes,
    specsByGroup: specsMap[row.id] || {},
    priceTier: calculatePriceTier({
      lengthOverall: row.length_overall ? Number(row.length_overall) : null,
      displacement: row.displacement ? Number(row.displacement) : null,
      beam: row.beam ? Number(row.beam) : null,
      cabins: row.cabins,
      hullMaterial: row.hull_material,
      keelType: row.keel_type,
      rigType: row.rig_type,
    }),
  }));

  return (
    <EmbedCompareClient yachts={yachts} specFields={SPEC_FIELDS} siteUrl={siteUrl} />
  );
}
