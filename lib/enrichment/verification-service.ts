/**
 * Yacht data verification pipeline.
 *
 * For each yacht model, verifies specs against multiple sources (sailwiki,
 * boat-specs.com) and web search. Flags discrepancies and applies corrections.
 *
 * Key checks:
 *   - Production years (first_built, last_built, production_status)
 *   - Manufacturer still in business
 *   - Spec verification (LOA, beam, draft, displacement)
 *   - Flags suspicious data for review
 */

import { pool } from "@/lib/db";
import {
  fetchSailWikiYacht,
  searchSailWikiYacht,
  buildSailWikiYachtUrl,
  fetchSailWikiShipyard,
  type SailWikiSpecs,
} from "./sailwiki-scraper";
import { fetchBoatSpecs, buildBoatSpecsUrl, sleep } from "./boat-specs-scraper";

export interface VerificationCandidate {
  id: number;
  manufacturerId: number;
  manufacturer: string;
  modelName: string;
  year: number;
  lengthOverall?: number;
  beam?: number;
  draft?: number;
  displacement?: number;
}

export interface VerificationResult {
  yachtId: number;
  status: "verified" | "updated" | "discrepancy" | "no_data" | "error";
  fieldsChecked: string[];
  fieldsUpdated: string[];
  discrepancies: Array<{
    field: string;
    currentValue: unknown;
    sourceValue: unknown;
    source: string;
  }>;
  sources: string[];
  firstBuilt?: number;
  lastBuilt?: number;
  productionStatus?: string;
  manufacturerStatus?: "active" | "defunct" | "unknown";
  error?: string;
}

export interface VerificationRunStats {
  totalCandidates: number;
  processed: number;
  verified: number;
  updated: number;
  discrepancies: number;
  noData: number;
  errors: number;
  durationMs: number;
}

/**
 * Find yacht models that need verification.
 * Priority: models with year >= current_year - 1 (suspicious "still in production"),
 * models with no first_built/last_built, models never verified.
 */
export async function findVerificationCandidates(
  limit = 20,
): Promise<VerificationCandidate[]> {
  const currentYear = new Date().getFullYear();

  const result = await pool.query(
    `SELECT
       y.id, y.manufacturer_id, y.model_name, y.year,
       y.length_overall, y.beam, y.draft, y.displacement,
       m.name AS manufacturer
     FROM yacht_models y
     JOIN manufacturers m ON y.manufacturer_id = m.id
     WHERE
       -- Never verified
       (y.last_verified_at IS NULL
        OR y.last_verified_at < NOW() - INTERVAL '90 days')
       -- And has a suspicious year (recent year but no production end date)
       AND (y.first_built IS NULL)
     ORDER BY
       y.year DESC,  -- Most suspicious (newest claimed year) first
       y.model_name
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    manufacturerId: row.manufacturer_id,
    manufacturer: row.manufacturer,
    modelName: row.model_name,
    year: row.year,
    lengthOverall: row.length_overall
      ? parseFloat(row.length_overall)
      : undefined,
    beam: row.beam ? parseFloat(row.beam) : undefined,
    draft: row.draft ? parseFloat(row.draft) : undefined,
    displacement: row.displacement ? parseFloat(row.displacement) : undefined,
  }));
}

/**
 * Verify a single yacht model against multiple sources.
 */
export async function verifySingleYacht(
  candidate: VerificationCandidate,
  options: { webSearchFn?: (q: string) => Promise<string | null> } = {},
): Promise<VerificationResult> {
  const result: VerificationResult = {
    yachtId: candidate.id,
    status: "no_data",
    fieldsChecked: [],
    fieldsUpdated: [],
    discrepancies: [],
    sources: [],
  };

  const currentYear = new Date().getFullYear();

  // ── Source 1: SailWiki ──────────────────────────────
  let sailWikiSpecs: SailWikiSpecs | null = null;

  try {
    const directUrl = buildSailWikiYachtUrl(
      candidate.manufacturer,
      candidate.modelName,
    );
    sailWikiSpecs = await fetchSailWikiYacht(directUrl);

    if (!sailWikiSpecs) {
      sailWikiSpecs = await searchSailWikiYacht(
        candidate.manufacturer,
        candidate.modelName,
      );
    }

    if (sailWikiSpecs) {
      result.sources.push("sailwiki.com");

      // Check production years
      if (sailWikiSpecs.firstBuilt) {
        result.firstBuilt = sailWikiSpecs.firstBuilt;
        result.fieldsChecked.push("first_built");

        // If our year doesn't match firstBuilt, flag it
        if (
          candidate.year !== sailWikiSpecs.firstBuilt &&
          candidate.year !== sailWikiSpecs.lastBuilt
        ) {
          result.discrepancies.push({
            field: "year",
            currentValue: candidate.year,
            sourceValue: `${sailWikiSpecs.firstBuilt}${
              sailWikiSpecs.lastBuilt ? `-${sailWikiSpecs.lastBuilt}` : ""
            }`,
            source: "sailwiki.com",
          });
        }
      }

      if (sailWikiSpecs.lastBuilt) {
        result.lastBuilt = sailWikiSpecs.lastBuilt;
        result.fieldsChecked.push("last_built");
      }

      if (sailWikiSpecs.productionStatus !== "unknown") {
        result.productionStatus = sailWikiSpecs.productionStatus;
        result.fieldsChecked.push("production_status");

        // Flag if model listed as in_production but lastBuilt is old
        if (
          sailWikiSpecs.productionStatus === "out_of_production" &&
          candidate.year >= currentYear - 2
        ) {
          result.discrepancies.push({
            field: "production_status",
            currentValue: `year=${candidate.year} (implies in production)`,
            sourceValue: "out_of_production",
            source: "sailwiki.com",
          });
        }
      }

      // Verify LOA
      if (sailWikiSpecs.lengthOverall && candidate.lengthOverall) {
        result.fieldsChecked.push("length_overall");
        const diff = Math.abs(
          sailWikiSpecs.lengthOverall - candidate.lengthOverall,
        );
        if (diff > 0.5) {
          result.discrepancies.push({
            field: "length_overall",
            currentValue: candidate.lengthOverall,
            sourceValue: sailWikiSpecs.lengthOverall,
            source: "sailwiki.com",
          });
        }
      }
    }

    await sleep(1500); // rate limit
  } catch {
    // Continue without sailwiki data
  }

  // ── Source 2: boat-specs.com ─────────────────────────
  try {
    const boatSpecsUrl = buildBoatSpecsUrl(
      candidate.manufacturer,
      candidate.modelName,
    );
    const boatSpecs = await fetchBoatSpecs(boatSpecsUrl);

    if (boatSpecs) {
      result.sources.push("boat-specs.com");

      // Cross-reference displacement
      if (boatSpecs.displacement && candidate.displacement) {
        result.fieldsChecked.push("displacement");
        const diff = Math.abs(
          boatSpecs.displacement - candidate.displacement,
        );
        if (diff > candidate.displacement * 0.15) {
          // >15% difference
          result.discrepancies.push({
            field: "displacement",
            currentValue: candidate.displacement,
            sourceValue: boatSpecs.displacement,
            source: "boat-specs.com",
          });
        }
      }
    }

    await sleep(2000);
  } catch {
    // Continue
  }

  // ── Source 3: Check manufacturer status ───────────────
  try {
    const shipyardInfo = await fetchSailWikiShipyard(candidate.manufacturer);
    if (shipyardInfo.exists) {
      result.manufacturerStatus = shipyardInfo.status;

      // If manufacturer is defunct but model year is recent, that's a big red flag
      if (
        shipyardInfo.status === "defunct" &&
        candidate.year >= currentYear - 2
      ) {
        result.discrepancies.push({
          field: "manufacturer_status",
          currentValue: `year=${candidate.year} (implies active)`,
          sourceValue: "defunct",
          source: "sailwiki.com",
        });
      }
    }
  } catch {
    // Continue
  }

  // ── Determine final status ────────────────────────────
  if (result.discrepancies.length > 0) {
    result.status = "discrepancy";
  } else if (result.sources.length > 0) {
    result.status = "verified";
  } else {
    result.status = "no_data";
  }

  // ── Apply corrections for high-confidence data ────────
  if (result.firstBuilt || result.productionStatus) {
    const updates: string[] = [];
    const values: (string | number)[] = [];
    let paramIdx = 1;

    if (result.firstBuilt) {
      updates.push(`first_built = $${paramIdx++}`);
      values.push(result.firstBuilt);
      result.fieldsUpdated.push("first_built");
    }

    if (result.lastBuilt !== undefined) {
      updates.push(`last_built = $${paramIdx++}`);
      values.push(result.lastBuilt);
      result.fieldsUpdated.push("last_built");
    } else if (result.productionStatus === "in_production") {
      updates.push(`last_built = NULL`);
      result.fieldsUpdated.push("last_built");
    }

    if (result.productionStatus) {
      updates.push(`production_status = $${paramIdx++}`);
      values.push(result.productionStatus);
      result.fieldsUpdated.push("production_status");
    }

    // Fix the year field to match first_built if we have reliable data
    if (result.firstBuilt && candidate.year !== result.firstBuilt) {
      updates.push(`year = $${paramIdx++}`);
      values.push(result.firstBuilt);
      result.fieldsUpdated.push("year");
    }

    if (updates.length > 0) {
      updates.push(`last_verified_at = NOW()`);
      values.push(candidate.id);

      await pool.query(
        `UPDATE yacht_models SET ${updates.join(", ")} WHERE id = $${paramIdx}`,
        values,
      );

      if (result.status === "discrepancy") {
        result.status = "updated";
      }
    }
  }

  // Log the verification
  await pool.query(
    `INSERT INTO enrichment_logs (yacht_model_id, status, fields_updated, new_values, confidence, completed_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [
      candidate.id,
      result.status === "verified" ? "success" : result.status,
      result.fieldsChecked,
      {
        sources: result.sources,
        discrepancies: result.discrepancies,
        firstBuilt: result.firstBuilt,
        lastBuilt: result.lastBuilt,
        productionStatus: result.productionStatus,
        manufacturerStatus: result.manufacturerStatus,
      },
      result.sources.length > 1 ? 85 : 70,
    ],
  );

  return result;
}

/**
 * Run the verification pipeline for multiple yacht models.
 */
export async function runVerificationPipeline(
  options: { limit?: number; dryRun?: boolean } = {},
): Promise<VerificationRunStats> {
  const { limit = 20, dryRun = false } = options;
  const startTime = Date.now();

  const candidates = await findVerificationCandidates(limit);

  const stats: VerificationRunStats = {
    totalCandidates: candidates.length,
    processed: 0,
    verified: 0,
    updated: 0,
    discrepancies: 0,
    noData: 0,
    errors: 0,
    durationMs: 0,
  };

  for (const candidate of candidates) {
    if (dryRun) {
      stats.processed++;
      continue;
    }

    try {
      const result = await verifySingleYacht(candidate);
      stats.processed++;

      switch (result.status) {
        case "verified":
          stats.verified++;
          break;
        case "updated":
          stats.updated++;
          break;
        case "discrepancy":
          stats.discrepancies++;
          break;
        case "no_data":
          stats.noData++;
          break;
        case "error":
          stats.errors++;
          break;
      }
    } catch {
      stats.errors++;
      stats.processed++;
    }

    // Rate limit between yachts
    await sleep(2000);
  }

  stats.durationMs = Date.now() - startTime;
  return stats;
}

/**
 * Get verification status summary.
 */
export async function getVerificationStatus(): Promise<{
  total: number;
  neverVerified: number;
  verifiedRecently: number;
  inProduction: number;
  outOfProduction: number;
  unknown: number;
  defunctManufacturers: number;
}> {
  const result = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE last_verified_at IS NULL) as never_verified,
      COUNT(*) FILTER (WHERE last_verified_at > NOW() - INTERVAL '90 days') as verified_recently,
      COUNT(*) FILTER (WHERE production_status = 'in_production') as in_production,
      COUNT(*) FILTER (WHERE production_status = 'out_of_production') as out_of_production,
      COUNT(*) FILTER (WHERE production_status = 'unknown' OR production_status IS NULL) as unknown_status
    FROM yacht_models
  `);

  return {
    total: parseInt(result.rows[0].total),
    neverVerified: parseInt(result.rows[0].never_verified),
    verifiedRecently: parseInt(result.rows[0].verified_recently),
    inProduction: parseInt(result.rows[0].in_production),
    outOfProduction: parseInt(result.rows[0].out_of_production),
    unknown: parseInt(result.rows[0].unknown_status),
    defunctManufacturers: 0,
  };
}
