import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import {
  yachtModels,
  manufacturers,
  specCategories,
  specValues,
  images,
} from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { createManufacturerSchema, createYachtModelSchema } from "../lib/validations";

// ─── Types ────────────────────────────────────────────────────────────────

interface ManufacturerInput {
  name: string;
  country?: string;
  foundedYear?: number;
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
}

interface YachtModelInput {
  manufacturer: string; // resolved by name
  modelName: string;
  year: number;
  lengthOverall?: number;
  beam?: number;
  draft?: number;
  displacement?: number;
  ballast?: number;
  sailAreaMain?: number;
  rigType?: string;
  keelType?: string;
  hullMaterial?: string;
  cabins?: number;
  berths?: number;
  heads?: number;
  maxOccupancy?: number;
  engineHp?: number;
  engineType?: string;
  fuelCapacity?: number;
  waterCapacity?: number;
  designNotes?: string;
  description?: string;
}

interface SeedData {
  manufacturers?: ManufacturerInput[];
  yachtModels?: YachtModelInput[];
}

// ─── Slug helper ──────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── CSV Parser (simple) ──────────────────────────────────────────────────

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

// ─── Loaders ───────────────────────────────────────────────────────────────

function loadFromFile(filePath: string): SeedData[] {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, "utf-8");

  if (ext === ".json") {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  if (ext === ".csv") {
    const rows = parseCSV(content);
    // Convert CSV rows to manufacturer/yacht format
    const manufacturers: ManufacturerInput[] = [];
    const yachtModels: YachtModelInput[] = [];

    for (const row of rows) {
      const mfrName = row.manufacturer || row.manufacturer_name;
      if (mfrName) {
        // It's a yacht row
        yachtModels.push({
          manufacturer: mfrName,
          modelName: row.modelName || row.model_name || "",
          year: parseInt(row.year) || new Date().getFullYear(),
          lengthOverall: parseFloat(row.lengthOverall || row.length_overall) || undefined,
          beam: parseFloat(row.beam) || undefined,
          draft: parseFloat(row.draft) || undefined,
          displacement: parseFloat(row.displacement) || undefined,
          ballast: parseFloat(row.ballast) || undefined,
          sailAreaMain: parseFloat(row.sailAreaMain || row.sail_area_main) || undefined,
          rigType: row.rigType || row.rig_type || undefined,
          keelType: row.keelType || row.keel_type || undefined,
          hullMaterial: row.hullMaterial || row.hull_material || undefined,
          cabins: parseInt(row.cabins) || undefined,
          berths: parseInt(row.berths) || undefined,
          heads: parseInt(row.heads) || undefined,
          maxOccupancy: parseInt(row.maxOccupancy) || undefined,
          engineHp: parseFloat(row.engineHp || row.engine_hp) || undefined,
          engineType: row.engineType || row.engine_type || undefined,
          fuelCapacity: parseFloat(row.fuelCapacity || row.fuel_capacity) || undefined,
          waterCapacity: parseFloat(row.waterCapacity || row.water_capacity) || undefined,
          designNotes: row.designNotes || row.design_notes || undefined,
          description: row.description || undefined,
        });
      }
    }

    return [{ manufacturers, yachtModels }];
  }

  throw new Error(`Unsupported file format: ${ext}. Use .json or .csv`);
}

// ─── Seed Logic ────────────────────────────────────────────────────────────

async function importManufacturers(
  inputs: ManufacturerInput[],
  onConflict: "skip" | "upsert" = "skip"
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const validation = createManufacturerSchema.safeParse(input);
    if (!validation.success) {
      errors.push(`Row ${i + 1}: ${validation.error.issues.map((e) => e.message).join(", ")}`);
      continue;
    }

    const data = validation.data;

    // Check if exists
    const existing = await db
      .select({ id: manufacturers.id })
      .from(manufacturers)
      .where(eq(manufacturers.name, data.name))
      .limit(1);

    if (existing.length > 0) {
      if (onConflict === "upsert") {
        await db
          .update(manufacturers)
          .set({
            country: data.country ?? null,
            foundedYear: data.foundedYear ?? null,
            websiteUrl: data.websiteUrl ?? null,
            description: data.description ?? null,
          })
          .where(eq(manufacturers.id, existing[0].id));
        console.log(`  ↻ Updated: ${data.name}`);
        inserted++;
      } else {
        console.log(`  ⊘ Skipped (exists): ${data.name}`);
        skipped++;
      }
    } else {
      await db.insert(manufacturers).values({
        name: data.name,
        country: data.country ?? null,
        foundedYear: data.foundedYear ?? null,
        websiteUrl: data.websiteUrl ?? null,
        logoUrl: data.logoUrl ?? null,
        description: data.description ?? null,
      });
      console.log(`  ✓ Inserted: ${data.name}`);
      inserted++;
    }
  }

  return { inserted, skipped, errors };
}

async function importYachtModels(
  inputs: YachtModelInput[],
  onConflict: "skip" | "upsert" = "skip"
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Load manufacturer lookup
  const allManufacturers = await db.select().from(manufacturers);
  const mfrByName = new Map(allManufacturers.map((m) => [m.name.toLowerCase(), m]));

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];

    // Resolve manufacturer
    const mfr = mfrByName.get(input.manufacturer.toLowerCase());
    if (!mfr) {
      errors.push(`Row ${i + 1}: Unknown manufacturer "${input.manufacturer}"`);
      continue;
    }

    const slug = slugify(`${input.manufacturer}-${input.modelName}`);
    const year = input.year || new Date().getFullYear();

    // Validate
    const validation = createYachtModelSchema.safeParse({
      ...input,
      manufacturerId: mfr.id,
      year,
    });
    if (!validation.success) {
      errors.push(`Row ${i + 1} (${input.modelName}): ${validation.error.issues.map((e) => e.message).join(", ")}`);
      continue;
    }

    // Check if exists by slug
    const existing = await db
      .select({ id: yachtModels.id })
      .from(yachtModels)
      .where(eq(yachtModels.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      if (onConflict === "upsert") {
        await db
          .update(yachtModels)
          .set({
            modelName: input.modelName,
            year,
            lengthOverall: input.lengthOverall?.toString() ?? null,
            beam: input.beam?.toString() ?? null,
            draft: input.draft?.toString() ?? null,
            displacement: input.displacement?.toString() ?? null,
            ballast: input.ballast?.toString() ?? null,
            sailAreaMain: input.sailAreaMain?.toString() ?? null,
            rigType: input.rigType ?? null,
            keelType: input.keelType ?? null,
            hullMaterial: input.hullMaterial ?? null,
            cabins: input.cabins ?? null,
            berths: input.berths ?? null,
            heads: input.heads ?? null,
            maxOccupancy: input.maxOccupancy ?? null,
            engineHp: input.engineHp?.toString() ?? null,
            engineType: input.engineType ?? null,
            fuelCapacity: input.fuelCapacity?.toString() ?? null,
            waterCapacity: input.waterCapacity?.toString() ?? null,
            description: input.description ?? null,
            updatedAt: new Date(),
          })
          .where(eq(yachtModels.id, existing[0].id));
        console.log(`  ↻ Updated: ${input.modelName}`);
        inserted++;
      } else {
        console.log(`  ⊘ Skipped (exists): ${input.modelName}`);
        skipped++;
      }
    } else {
      await db.insert(yachtModels).values({
        manufacturerId: mfr.id,
        modelName: input.modelName,
        year,
        slug,
        lengthOverall: input.lengthOverall?.toString() ?? null,
        beam: input.beam?.toString() ?? null,
        draft: input.draft?.toString() ?? null,
        displacement: input.displacement?.toString() ?? null,
        ballast: input.ballast?.toString() ?? null,
        sailAreaMain: input.sailAreaMain?.toString() ?? null,
        rigType: input.rigType ?? null,
        keelType: input.keelType ?? null,
        hullMaterial: input.hullMaterial ?? null,
        cabins: input.cabins ?? null,
        berths: input.berths ?? null,
        heads: input.heads ?? null,
        maxOccupancy: input.maxOccupancy ?? null,
        engineHp: input.engineHp?.toString() ?? null,
        engineType: input.engineType ?? null,
        fuelCapacity: input.fuelCapacity?.toString() ?? null,
        waterCapacity: input.waterCapacity?.toString() ?? null,
        designNotes: input.designNotes ?? null,
        description: input.description ?? null,
      });
      console.log(`  ✓ Inserted: ${input.modelName}`);
      inserted++;
    }
  }

  return { inserted, skipped, errors };
}

// ─── Default Sample Data ──────────────────────────────────────────────────

const sampleSpecCategories = [
  { name: "Ballast", unit: "kg", dataType: "numeric" as const, categoryGroup: "Construction", isFilterable: true, description: "Weight of ballast" },
  { name: "Sail Area Main", unit: "m²", dataType: "numeric" as const, categoryGroup: "Rigging", isFilterable: true, description: "Area of main sail" },
  { name: "Sail Area Jib", unit: "m²", dataType: "numeric" as const, categoryGroup: "Rigging", isFilterable: true, description: "Area of jib/genoa" },
  { name: "Engine Type", unit: null, dataType: "text" as const, categoryGroup: "Technical", isFilterable: true, description: "Type of engine" },
  { name: "Fuel Capacity", unit: "L", dataType: "numeric" as const, categoryGroup: "Technical", isFilterable: true, description: "Fuel tank capacity" },
];

async function seedDefault() {
  console.log("🌱 Seeding default sample data...");

  // Insert spec categories (idempotent)
  console.log("📊 Seeding spec categories...");
  for (const cat of sampleSpecCategories) {
    const existing = await db
      .select({ id: specCategories.id })
      .from(specCategories)
      .where(eq(specCategories.name, cat.name))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(specCategories).values(cat);
      console.log(`  ✓ ${cat.name}`);
    } else {
      console.log(`  ⊘ ${cat.name} (exists)`);
    }
  }

  // Load and import sample data
  const samplePath = path.join(__dirname, "..", "data", "sample-yachts.json");
  if (fs.existsSync(samplePath)) {
    console.log("\n📂 Loading sample data from data/sample-yachts.json...");
    const datasets = loadFromFile(samplePath);
    for (const dataset of datasets) {
      if (dataset.manufacturers?.length) {
        console.log(`\n🏭 Importing ${dataset.manufacturers.length} manufacturers...`);
        const mfrResult = await importManufacturers(dataset.manufacturers);
        console.log(`  → ${mfrResult.inserted} inserted, ${mfrResult.skipped} skipped`);
        if (mfrResult.errors.length) console.log(`  ⚠ Errors: ${mfrResult.errors.join("; ")}`);
      }
      if (dataset.yachtModels?.length) {
        console.log(`\n⛵ Importing ${dataset.yachtModels.length} yacht models...`);
        const yachtResult = await importYachtModels(dataset.yachtModels);
        console.log(`  → ${yachtResult.inserted} inserted, ${yachtResult.skipped} skipped`);
        if (yachtResult.errors.length) console.log(`  ⚠ Errors: ${yachtResult.errors.join("; ")}`);
      }
    }
  } else {
    console.log("⚠ No sample data file found. Use --input to specify a data file.");
  }

  console.log("\n🎉 Seeding complete!");
}

// ─── CLI Entry ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const upsertIdx = args.indexOf("--upsert");
  const onConflict = upsertIdx !== -1 ? "upsert" : "skip";

  if (inputIdx !== -1 && args[inputIdx + 1]) {
    const inputPath = args[inputIdx + 1];
    console.log(`📂 Loading data from: ${inputPath}`);
    console.log(`   Conflict strategy: ${onConflict}`);

    const datasets = loadFromFile(inputPath);
    for (const dataset of datasets) {
      if (dataset.manufacturers?.length) {
        console.log(`\n🏭 Importing ${dataset.manufacturers.length} manufacturers...`);
        const result = await importManufacturers(dataset.manufacturers, onConflict);
        console.log(`  → ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`);
        if (result.errors.length) {
          console.log("  Errors:");
          result.errors.forEach((e) => console.log(`    - ${e}`));
        }
      }
      if (dataset.yachtModels?.length) {
        console.log(`\n⛵ Importing ${dataset.yachtModels.length} yacht models...`);
        const result = await importYachtModels(dataset.yachtModels, onConflict);
        console.log(`  → ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`);
        if (result.errors.length) {
          console.log("  Errors:");
          result.errors.forEach((e) => console.log(`    - ${e}`));
        }
      }
    }
    console.log("\n🎉 Import complete!");
  } else {
    await seedDefault();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
