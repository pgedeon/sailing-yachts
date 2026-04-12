/**
 * Price Data Service (P8.1)
 *
 * Manages yacht pricing data: CRUD, CSV import, validation, and snapshots.
 */

import { pool } from "@/lib/db";
import { buildSafeQuery } from "@/lib/build-safe";

// --- Types ---

export interface YachtPrice {
  id: number;
  yachtModelId: number;
  priceMin: number;
  priceMax: number;
  currency: string;
  condition: "new" | "used" | "broker" | "charter";
  year: number | null;
  source: string;
  sourceType: "manual" | "csv_import" | "api_feed" | "partner" | "scraper";
  sourceUrl: string | null;
  confidenceScore: number;
  notes: string | null;
  effectiveDate: Date;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceSnapshot {
  id: number;
  yachtModelId: number;
  priceMin: number;
  priceMax: number;
  currency: string;
  condition: string;
  sourceType: string;
  confidenceScore: number;
  snapshotDate: Date;
  snapshotReason: string;
  recordCount: number;
  createdAt: Date;
}

export interface PriceSummary {
  yachtModelId: number;
  modelName: string;
  manufacturerName: string;
  slug: string;
  newPriceMin: number | null;
  newPriceMax: number | null;
  usedPriceMin: number | null;
  usedPriceMax: number | null;
  currency: string;
  totalSources: number;
  avgConfidence: number;
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// --- Validation ---

const VALID_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "CHF", "SEK", "NOK", "DKK", "NZD"];
const VALID_CONDITIONS = ["new", "used", "broker", "charter"];
const VALID_SOURCE_TYPES = ["manual", "csv_import", "api_feed", "partner", "scraper"];

export interface ValidationError {
  field: string;
  message: string;
}

export function validatePriceData(data: Partial<YachtPrice>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.yachtModelId || data.yachtModelId <= 0) {
    errors.push({ field: "yachtModelId", message: "Valid yacht model ID is required" });
  }

  if (data.priceMin == null || data.priceMin < 0) {
    errors.push({ field: "priceMin", message: "Minimum price must be a non-negative number" });
  }

  if (data.priceMax == null || data.priceMax < 0) {
    errors.push({ field: "priceMax", message: "Maximum price must be a non-negative number" });
  }

  if (data.priceMin != null && data.priceMax != null && data.priceMin > data.priceMax) {
    errors.push({ field: "priceMin", message: "Minimum price cannot exceed maximum price" });
  }

  if (data.currency && !VALID_CURRENCIES.includes(data.currency)) {
    errors.push({ field: "currency", message: `Currency must be one of: ${VALID_CURRENCIES.join(", ")}` });
  }

  if (data.condition && !VALID_CONDITIONS.includes(data.condition)) {
    errors.push({ field: "condition", message: `Condition must be one of: ${VALID_CONDITIONS.join(", ")}` });
  }

  if (data.sourceType && !VALID_SOURCE_TYPES.includes(data.sourceType)) {
    errors.push({ field: "sourceType", message: `Source type must be one of: ${VALID_SOURCE_TYPES.join(", ")}` });
  }

  if (data.confidenceScore != null && (data.confidenceScore < 0 || data.confidenceScore > 100)) {
    errors.push({ field: "confidenceScore", message: "Confidence score must be between 0 and 100" });
  }

  if (!data.source || data.source.trim().length === 0) {
    errors.push({ field: "source", message: "Source is required" });
  }

  return errors;
}

// --- CRUD Operations ---

export async function createPrice(data: {
  yachtModelId: number;
  priceMin: number;
  priceMax: number;
  currency?: string;
  condition?: string;
  year?: number;
  source: string;
  sourceType?: string;
  sourceUrl?: string;
  confidenceScore?: number;
  notes?: string;
  effectiveDate?: string;
  expiresAt?: string;
}): Promise<YachtPrice | null> {
  const errors = validatePriceData(data as Partial<YachtPrice>);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.map((e) => e.message).join("; ")}`);
  }

  // Create snapshot before inserting new price
  await createSnapshot(data.yachtModelId, data.condition || "new", "new_listing");

  return buildSafeQuery(async () => {
    const result = await pool.query(
      `INSERT INTO yacht_prices
       (yacht_model_id, price_min, price_max, currency, condition, year, source, source_type, source_url, confidence_score, notes, effective_date, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (yacht_model_id, condition, source, effective_date)
       DO UPDATE SET price_min = EXCLUDED.price_min, price_max = EXCLUDED.price_max, confidence_score = EXCLUDED.confidence_score, updated_at = NOW(), is_active = TRUE
       RETURNING *`,
      [
        data.yachtModelId,
        data.priceMin,
        data.priceMax,
        data.currency || "USD",
        data.condition || "new",
        data.year || null,
        data.source,
        data.sourceType || "manual",
        data.sourceUrl || null,
        data.confidenceScore || 50,
        data.notes || null,
        data.effectiveDate || new Date().toISOString().split("T")[0],
        data.expiresAt || null,
      ]
    );
    return result.rows.length > 0 ? mapRowToPrice(result.rows[0]) : null;
  }, null);
}

export async function getPrices(filters?: {
  yachtModelId?: number;
  condition?: string;
  sourceType?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ prices: YachtPrice[]; total: number }> {
  return buildSafeQuery(async () => {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (filters?.yachtModelId) {
      conditions.push(`yp.yacht_model_id = $${paramIdx}`);
      values.push(filters.yachtModelId);
      paramIdx++;
    }
    if (filters?.condition) {
      conditions.push(`yp.condition = $${paramIdx}`);
      values.push(filters.condition);
      paramIdx++;
    }
    if (filters?.sourceType) {
      conditions.push(`yp.source_type = $${paramIdx}`);
      values.push(filters.sourceType);
      paramIdx++;
    }
    if (filters?.isActive !== undefined) {
      conditions.push(`yp.is_active = $${paramIdx}`);
      values.push(filters.isActive);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM yacht_prices yp ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const result = await pool.query(
      `SELECT yp.*, ym.model_name, m.name as manufacturer_name, ym.slug
       FROM yacht_prices yp
       JOIN yacht_models ym ON yp.yacht_model_id = ym.id
       LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
       ${where}
       ORDER BY yp.effective_date DESC, yp.confidence_score DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...values, limit, offset]
    );

    return { prices: result.rows.map(mapRowToPrice), total };
  }, { prices: [], total: 0 });
}

export async function getPriceById(id: number): Promise<YachtPrice | null> {
  return buildSafeQuery(async () => {
    const result = await pool.query(`SELECT * FROM yacht_prices WHERE id = $1`, [id]);
    return result.rows.length > 0 ? mapRowToPrice(result.rows[0]) : null;
  }, null);
}

export async function updatePrice(
  id: number,
  data: Partial<Pick<YachtPrice, "priceMin" | "priceMax" | "currency" | "confidenceScore" | "notes" | "isActive" | "source" | "sourceUrl">>
): Promise<YachtPrice | null> {
  return buildSafeQuery(async () => {
    const sets: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (data.priceMin !== undefined) { sets.push(`price_min = $${paramIdx}`); values.push(data.priceMin); paramIdx++; }
    if (data.priceMax !== undefined) { sets.push(`price_max = $${paramIdx}`); values.push(data.priceMax); paramIdx++; }
    if (data.currency !== undefined) { sets.push(`currency = $${paramIdx}`); values.push(data.currency); paramIdx++; }
    if (data.confidenceScore !== undefined) { sets.push(`confidence_score = $${paramIdx}`); values.push(data.confidenceScore); paramIdx++; }
    if (data.notes !== undefined) { sets.push(`notes = $${paramIdx}`); values.push(data.notes); paramIdx++; }
    if (data.isActive !== undefined) { sets.push(`is_active = $${paramIdx}`); values.push(data.isActive); paramIdx++; }
    if (data.source !== undefined) { sets.push(`source = $${paramIdx}`); values.push(data.source); paramIdx++; }
    if (data.sourceUrl !== undefined) { sets.push(`source_url = $${paramIdx}`); values.push(data.sourceUrl); paramIdx++; }

    if (sets.length === 0) return null;

    sets.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE yacht_prices SET ${sets.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    return result.rows.length > 0 ? mapRowToPrice(result.rows[0]) : null;
  }, null);
}

export async function deletePrice(id: number): Promise<boolean> {
  return buildSafeQuery(async () => {
    const result = await pool.query(`DELETE FROM yacht_prices WHERE id = $1 RETURNING id`, [id]);
    return result.rows.length > 0;
  }, false);
}

// --- Price Summary for yacht pages ---

export async function getPriceSummary(yachtModelId: number): Promise<PriceSummary | null> {
  return buildSafeQuery(async () => {
    const yachtResult = await pool.query(
      `SELECT ym.id, ym.model_name, ym.slug, m.name as manufacturer_name
       FROM yacht_models ym
       LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
       WHERE ym.id = $1`,
      [yachtModelId]
    );
    if (yachtResult.rows.length === 0) return null;

    const yacht = yachtResult.rows[0];

    const priceResult = await pool.query(
      `SELECT condition,
              MIN(price_min) as price_min,
              MAX(price_max) as price_max,
              currency,
              COUNT(DISTINCT source) as total_sources,
              ROUND(AVG(confidence_score)) as avg_confidence
       FROM yacht_prices
       WHERE yacht_model_id = $1 AND is_active = TRUE
       GROUP BY condition, currency`,
      [yachtModelId]
    );

    const summary: PriceSummary = {
      yachtModelId: yacht.id,
      modelName: yacht.model_name,
      manufacturerName: yacht.manufacturer_name,
      slug: yacht.slug,
      newPriceMin: null,
      newPriceMax: null,
      usedPriceMin: null,
      usedPriceMax: null,
      currency: "USD",
      totalSources: 0,
      avgConfidence: 0,
    };

    for (const row of priceResult.rows) {
      const min = parseFloat(row.price_min);
      const max = parseFloat(row.price_max);
      if (row.condition === "new") {
        summary.newPriceMin = min;
        summary.newPriceMax = max;
      } else if (row.condition === "used") {
        summary.usedPriceMin = min;
        summary.usedPriceMax = max;
      }
      summary.currency = row.currency || "USD";
      summary.totalSources += parseInt(row.total_sources, 10);
      summary.avgConfidence = Math.max(summary.avgConfidence, parseFloat(row.avg_confidence));
    }

    return summary;
  }, null);
}

// --- CSV Import ---

export async function importPricesFromCsv(rows: Array<Record<string, string>>): Promise<CsvImportResult> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const yachtModelId = parseInt(row.yacht_model_id || row.id || "0", 10);
      const priceMin = parseFloat(row.price_min || row.price || "0");
      const priceMax = parseFloat(row.price_max || row.price || "0");

      if (!yachtModelId || yachtModelId <= 0) {
        skipped++;
        errors.push(`Row ${i + 1}: Invalid yacht model ID`);
        continue;
      }

      if (priceMin <= 0 && priceMax <= 0) {
        skipped++;
        errors.push(`Row ${i + 1}: Invalid price values`);
        continue;
      }

      const data = {
        yachtModelId,
        priceMin: Math.min(priceMin || priceMax, priceMax || priceMin),
        priceMax: Math.max(priceMin || priceMax, priceMax || priceMin),
        currency: (row.currency || "USD").toUpperCase(),
        condition: VALID_CONDITIONS.includes(row.condition) ? row.condition : "new",
        year: row.year ? parseInt(row.year, 10) : undefined,
        source: row.source || "CSV Import",
        sourceType: "csv_import" as const,
        sourceUrl: row.source_url || undefined,
        confidenceScore: row.confidence_score ? parseInt(row.confidence_score, 10) : 50,
        notes: row.notes || undefined,
      };

      const validationErrors = validatePriceData(data as Partial<YachtPrice>);
      if (validationErrors.length > 0) {
        skipped++;
        errors.push(`Row ${i + 1}: ${validationErrors.map((e) => e.message).join(", ")}`);
        continue;
      }

      await createPrice(data);
      imported++;
    } catch (error: any) {
      skipped++;
      errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  return { imported, skipped, errors };
}

// --- Snapshots ---

export async function createSnapshot(
  yachtModelId: number,
  condition: string,
  reason: string
): Promise<void> {
  try {
    // Get current aggregate price data for this yacht
    const currentPrices = await pool.query(
      `SELECT MIN(price_min) as price_min, MAX(price_max) as price_max,
              currency, condition, source_type, ROUND(AVG(confidence_score)) as avg_confidence, COUNT(*) as record_count
       FROM yacht_prices
       WHERE yacht_model_id = $1 AND is_active = TRUE AND condition = $2
       GROUP BY currency, condition, source_type`,
      [yachtModelId, condition]
    );

    for (const row of currentPrices.rows) {
      await pool.query(
        `INSERT INTO price_snapshots
         (yacht_model_id, price_min, price_max, currency, condition, source_type, confidence_score, snapshot_reason, record_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          yachtModelId,
          row.price_min,
          row.price_max,
          row.currency,
          row.condition,
          row.source_type,
          row.avg_confidence,
          reason,
          row.record_count,
        ]
      );
    }
  } catch (error) {
    console.error("Error creating price snapshot:", error);
  }
}

export async function getPriceHistory(
  yachtModelId: number,
  condition?: string,
  limit?: number
): Promise<PriceSnapshot[]> {
  return buildSafeQuery(async () => {
    const conditions = ["yacht_model_id = $1"];
    const values: any[] = [yachtModelId];
    let paramIdx = 2;

    if (condition) {
      conditions.push(`condition = $${paramIdx}`);
      values.push(condition);
      paramIdx++;
    }

    const result = await pool.query(
      `SELECT * FROM price_snapshots WHERE ${conditions.join(" AND ")}
       ORDER BY snapshot_date DESC
       LIMIT $${paramIdx}`,
      [...values, limit || 30]
    );

    return result.rows.map(mapRowToSnapshot);
  }, []);
}

// --- Helper ---

function mapRowToPrice(row: any): YachtPrice {
  return {
    id: row.id,
    yachtModelId: row.yacht_model_id,
    priceMin: parseFloat(row.price_min),
    priceMax: parseFloat(row.price_max),
    currency: row.currency,
    condition: row.condition,
    year: row.year,
    source: row.source,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    confidenceScore: row.confidence_score,
    notes: row.notes,
    effectiveDate: row.effective_date,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToSnapshot(row: any): PriceSnapshot {
  return {
    id: row.id,
    yachtModelId: row.yacht_model_id,
    priceMin: parseFloat(row.price_min),
    priceMax: parseFloat(row.price_max),
    currency: row.currency,
    condition: row.condition,
    sourceType: row.source_type,
    confidenceScore: row.confidence_score,
    snapshotDate: row.snapshot_date,
    snapshotReason: row.snapshot_reason,
    recordCount: row.record_count,
    createdAt: row.created_at,
  };
}
