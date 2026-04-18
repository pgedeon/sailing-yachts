/**
 * Data Import Pipeline (P10.1)
 * 
 * Handles importing yacht data with duplicate detection, source tracking,
 * and completeness scoring.
 */

import { pool } from "./db";
import {
  findDuplicates,
  isExactDuplicate,
  normalizeModelName,
  type DuplicateMatch,
  type ExistingRecord,
} from "./duplicate-detection";

export interface YachtImportRecord {
  manufacturer: string;
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
  description?: string;
  designNotes?: string;
  sourceUrl?: string;
}

export interface ManufacturerImport {
  name: string;
  country?: string;
  foundedYear?: number;
  websiteUrl?: string;
  description?: string;
}

export interface ImportResult {
  jobId: number;
  added: number;
  duplicates: number;
  errors: number;
  duplicateDetails: Array<{
    record: YachtImportRecord;
    matches: DuplicateMatch[];
  }>;
  errorDetails: Array<{ record: YachtImportRecord; error: string }>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function calculateCompletenessScore(yacht: YachtImportRecord): number {
  let score = 0;
  if (yacht.lengthOverall != null) score += 10;
  if (yacht.beam != null) score += 10;
  if (yacht.draft != null) score += 10;
  if (yacht.displacement != null) score += 7;
  if (yacht.ballast != null) score += 5;
  if (yacht.sailAreaMain != null) score += 7;
  if (yacht.rigType) score += 4;
  if (yacht.keelType) score += 4;
  if (yacht.hullMaterial) score += 5;
  if (yacht.cabins != null) score += 5;
  if (yacht.berths != null) score += 5;
  if (yacht.heads != null) score += 5;
  if (yacht.engineHp != null) score += 5;
  if (yacht.engineType) score += 3;
  if (yacht.fuelCapacity != null) score += 4;
  if (yacht.waterCapacity != null) score += 3;
  if (yacht.description) score += 5;
  if (yacht.designNotes) score += 3;
  if (yacht.sourceUrl) score += 2;
  return score;
}

/**
 * Import yacht data with duplicate detection and source tracking.
 */
export async function importYachts(
  records: YachtImportRecord[],
  manufacturers: ManufacturerImport[],
  source: string,
  sourceConfidence = 70,
): Promise<ImportResult> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create import job
    const jobResult = await client.query(
      `INSERT INTO import_jobs (source, status, total_records, started_at)
       VALUES ($1, 'running', $2, NOW())
       RETURNING id`,
      [source, records.length],
    );
    const jobId = jobResult.rows[0].id;

    // 2. Upsert manufacturers
    const mfrCache: Record<string, number> = {};
    const allMfrs = await client.query("SELECT id, name FROM manufacturers");
    allMfrs.rows.forEach((r: { id: number; name: string }) => {
      mfrCache[r.name] = r.id;
    });

    for (const mfr of manufacturers) {
      if (!mfrCache[mfr.name]) {
        const res = await client.query(
          `INSERT INTO manufacturers (name, country, founded_year, website_url, description)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [mfr.name, mfr.country || null, mfr.foundedYear || null, mfr.websiteUrl || null, mfr.description || null],
        );
        mfrCache[mfr.name] = res.rows[0].id;
      }
    }

    // Refresh cache
    const refreshedMfrs = await client.query("SELECT id, name FROM manufacturers");
    refreshedMfrs.rows.forEach((r: { id: number; name: string }) => {
      mfrCache[r.name] = r.id;
    });

    // 3. Load existing records for dedup
    const existingResult = await client.query(
      `SELECT y.id, y.model_name, y.year, m.name as manufacturer
       FROM yacht_models y
       JOIN manufacturers m ON y.manufacturer_id = m.id`,
    );
    const existingRecords: ExistingRecord[] = existingResult.rows.map(
      (r: { id: number; model_name: string; year: number; manufacturer: string }) => ({
        id: r.id,
        modelName: r.model_name,
        manufacturer: r.manufacturer,
        year: r.year,
      }),
    );

    // 4. Process each record
    let added = 0;
    let duplicates = 0;
    let errors = 0;
    const duplicateDetails: ImportResult["duplicateDetails"] = [];
    const errorDetails: ImportResult["errorDetails"] = [];

    for (const record of records) {
      try {
        const mfrId = mfrCache[record.manufacturer];
        if (!mfrId) {
          errorDetails.push({ record, error: `Unknown manufacturer: ${record.manufacturer}` });
          errors++;
          continue;
        }

        // Check exact duplicate first
        const exactDup = isExactDuplicate(
          record.modelName,
          record.manufacturer,
          record.year,
          existingRecords,
        );

        if (exactDup) {
          duplicates++;
          duplicateDetails.push({
            record,
            matches: [{
              existingId: exactDup.id,
              existingModelName: exactDup.modelName,
              existingManufacturer: exactDup.manufacturer,
              existingYear: exactDup.year,
              confidence: "exact",
              score: 1,
              matchType: "full",
            }],
          });
          continue;
        }

        // Check fuzzy duplicates
        const dupes = findDuplicates(
          record.modelName,
          record.manufacturer,
          record.year,
          existingRecords,
        );

        // Only block on high-confidence duplicates
        const highConfDupe = dupes.find(d => d.confidence === "exact" || d.confidence === "high");
        if (highConfDupe) {
          duplicates++;
          duplicateDetails.push({ record, matches: dupes.slice(0, 3) });
          continue;
        }

        // Insert new record
        const slug = slugify(`${record.manufacturer}-${record.modelName}-${record.year}`);
        const completenessScore = calculateCompletenessScore(record);

        await client.query(
          `INSERT INTO yacht_models (
            manufacturer_id, model_name, year, slug,
            length_overall, beam, draft, displacement, ballast, sail_area_main,
            rig_type, keel_type, hull_material,
            cabins, berths, heads, max_occupancy,
            engine_hp, engine_type, fuel_capacity, water_capacity,
            description, design_notes, source_url,
            data_source, source_confidence, completeness_score,
            last_verified_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8, $9, $10,
            $11, $12, $13,
            $14, $15, $16, $17,
            $18, $19, $20, $21,
            $22, $23, $24,
            $25, $26, $27,
            NOW(), NOW(), NOW()
          )`,
          [
            mfrId, record.modelName, record.year, slug,
            record.lengthOverall ?? null, record.beam ?? null, record.draft ?? null,
            record.displacement ?? null, record.ballast ?? null, record.sailAreaMain ?? null,
            record.rigType ?? null, record.keelType ?? null, record.hullMaterial ?? null,
            record.cabins ?? null, record.berths ?? null, record.heads ?? null, record.maxOccupancy ?? null,
            record.engineHp ?? null, record.engineType ?? null,
            record.fuelCapacity ?? null, record.waterCapacity ?? null,
            record.description ?? null, record.designNotes ?? null, record.sourceUrl ?? null,
            source, sourceConfidence, completenessScore,
          ],
        );

        // Update existing records cache
        existingRecords.push({
          id: -1, // We don't need the actual ID for dedup
          modelName: record.modelName,
          manufacturer: record.manufacturer,
          year: record.year,
        });

        added++;
      } catch (err: any) {
        errorDetails.push({ record, error: err.message });
        errors++;
      }
    }

    // 5. Update import job
    await client.query(
      `UPDATE import_jobs
       SET status = 'completed', added = $1, duplicates = $2, errors = $3,
           error_details = $4, completed_at = NOW()
       WHERE id = $5`,
      [added, duplicates, errors, JSON.stringify(errorDetails.map(e => ({ modelName: e.record.modelName, manufacturer: e.record.manufacturer, year: e.record.year, error: e.error }))), jobId],
    );

    await client.query("COMMIT");

    return { jobId, added, duplicates, errors, duplicateDetails, errorDetails };
  } catch (err: any) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get the status of an import job.
 */
export async function getImportJob(jobId: number) {
  const result = await pool.query("SELECT * FROM import_jobs WHERE id = $1", [jobId]);
  return result.rows[0] || null;
}

/**
 * Get all import jobs, most recent first.
 */
export async function getImportJobs(limit = 20) {
  const result = await pool.query(
    "SELECT * FROM import_jobs ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
  return result.rows;
}
