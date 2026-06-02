/**
 * P21.4: Price Aggregation Service
 *
 * Orchestrates price data aggregation from multiple providers.
 * Stores results in the yacht_prices table with proper attribution.
 */

import { pool } from '@/lib/db';
import { estimatePrices, PROVIDER_NAME as ESTIMATED_PROVIDER } from './estimated-provider';
import type {
  PriceCandidate,
  PriceProviderResult,
  PriceCondition,
  AggregationRun,
  AggregationStatus,
} from './types';

// --- Candidate Discovery ---

export async function findPriceCandidates(limit = 200): Promise<PriceCandidate[]> {
  const result = await pool.query(`
    SELECT
      ym.id,
      ym.slug,
      ym.model_name,
      ym.year,
      ym.length_overall,
      ym.displacement,
      ym.beam,
      ym.cabins,
      m.name as manufacturer_name,
      COALESCE(pc.price_count, 0) as existing_price_count
    FROM yacht_models ym
    JOIN manufacturers m ON ym.manufacturer_id = m.id
    LEFT JOIN (
      SELECT yacht_model_id, COUNT(*) as price_count
      FROM yacht_prices
      WHERE is_active = true
      GROUP BY yacht_model_id
    ) pc ON pc.yacht_model_id = ym.id
    WHERE ym.length_overall IS NOT NULL
      AND ym.year IS NOT NULL
    ORDER BY
      CASE WHEN pc.price_count IS NULL OR pc.price_count = 0 THEN 0 ELSE 1 END,
      ym.length_overall DESC
    LIMIT $1
  `, [limit]);

  return result.rows.map((row: any) => ({
    id: row.id,
    slug: row.slug,
    modelName: row.model_name,
    manufacturerName: row.manufacturer_name,
    year: row.year,
    lengthOverall: row.length_overall ? parseFloat(row.length_overall) : null,
    displacement: row.displacement ? parseFloat(row.displacement) : null,
    beam: row.beam ? parseFloat(row.beam) : null,
    cabins: row.cabins,
    existingPriceCount: parseInt(row.existing_price_count, 10),
  }));
}

// --- Price Storage ---

async function storePriceResult(result: PriceProviderResult): Promise<'created' | 'updated' | 'skipped'> {
  // Check for existing active price from same provider for this yacht+condition
  const existing = await pool.query(`
    SELECT id, price_min, price_max
    FROM yacht_prices
    WHERE yacht_model_id = $1
      AND condition = $2
      AND source = $3
      AND source_type = 'scraper'
      AND is_active = true
    ORDER BY effective_date DESC
    LIMIT 1
  `, [result.yachtModelId, result.condition, `Aggregated: ${result.provider}`]);

  const sourceName = `Aggregated: ${result.provider}`;

  if (existing.rows.length > 0) {
    const existingRow = existing.rows[0];
    const existingMin = parseFloat(existingRow.price_min);
    const existingMax = parseFloat(existingRow.price_max);

    // Update if price changed significantly (>20% difference)
    const minChange = Math.abs(existingMin - result.priceMin) / existingMin;
    const maxChange = Math.abs(existingMax - result.priceMax) / existingMax;

    if (minChange > 0.2 || maxChange > 0.2) {
      // Create snapshot of old price
      await pool.query(`
        INSERT INTO price_snapshots (yacht_model_id, price_min, price_max, currency, condition, source_type, confidence_score, snapshot_reason)
        VALUES ($1, $2, $3, $4, $5, 'scraper', 50, 'price_update')
      `, [result.yachtModelId, existingRow.price_min, existingRow.price_max, result.currency, result.condition]);

      // Update existing price
      await pool.query(`
        UPDATE yacht_prices
        SET price_min = $2, price_max = $3, confidence_score = $4, source_url = $5, updated_at = NOW()
        WHERE id = $1
      `, [existingRow.id, result.priceMin, result.priceMax, result.confidenceScore, result.sourceUrl]);

      return 'updated';
    }

    return 'skipped';
  }

  // Create new price record
  await pool.query(`
    INSERT INTO yacht_prices (yacht_model_id, price_min, price_max, currency, condition, year, source, source_type, source_url, confidence_score, notes, effective_date, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'scraper', $8, $9, $10, NOW(), true)
  `, [
    result.yachtModelId,
    result.priceMin,
    result.priceMax,
    result.currency,
    result.condition,
    result.year,
    sourceName,
    result.sourceUrl,
    result.confidenceScore,
    `Auto-estimated from specs. Provider: ${result.provider}`,
  ]);

  return 'created';
}

// --- Aggregation Pipeline ---

export async function runAggregationPipeline(options: {
  provider?: string;
  dryRun?: boolean;
  limit?: number;
  overwrite?: boolean;
}): Promise<AggregationRun> {
  const runId = `agg-${Date.now()}`;
  const run: AggregationRun = {
    id: runId,
    startedAt: new Date(),
    completedAt: null,
    status: 'running',
    provider: options.provider || 'all',
    candidatesTotal: 0,
    resultsFound: 0,
    pricesCreated: 0,
    pricesUpdated: 0,
    errors: [],
  };

  try {
    // Find candidates (prioritize yachts without prices)
    const candidates = await findPriceCandidates(options.limit || 200);
    run.candidatesTotal = candidates.length;

    if (candidates.length === 0) {
      run.status = 'completed';
      run.completedAt = new Date();
      return run;
    }

    // Run providers
    let allResults: PriceProviderResult[] = [];

    if (!options.provider || options.provider === ESTIMATED_PROVIDER) {
      allResults = estimatePrices(candidates);
    }

    run.resultsFound = allResults.length;

    if (options.dryRun) {
      run.status = 'completed';
      run.completedAt = new Date();
      return run;
    }

    // Store results
    for (const result of allResults) {
      try {
        const action = await storePriceResult(result);
        if (action === 'created') run.pricesCreated++;
        else if (action === 'updated') run.pricesUpdated++;
      } catch (err: any) {
        run.errors.push(`Failed to store price for ${result.yachtSlug}: ${err.message}`);
      }
    }

    run.status = 'completed';
  } catch (err: any) {
    run.status = 'failed';
    run.errors.push(`Pipeline error: ${err.message}`);
  }

  run.completedAt = new Date();
  return run;
}

// --- Status ---

export async function getAggregationStatus(): Promise<AggregationStatus> {
  const [totalYachts, yachtsWithPrices, byCondition, byCurrency, byProvider] = await Promise.all([
    pool.query(`SELECT COUNT(*) as count FROM yacht_models WHERE length_overall IS NOT NULL`),
    pool.query(`
      SELECT COUNT(DISTINCT yp.yacht_model_id) as count
      FROM yacht_prices yp
      JOIN yacht_models ym ON yp.yacht_model_id = ym.id
      WHERE yp.is_active = true
    `),
    pool.query(`
      SELECT condition, COUNT(*) as count
      FROM yacht_prices
      WHERE is_active = true
      GROUP BY condition
    `),
    pool.query(`
      SELECT currency, COUNT(*) as count
      FROM yacht_prices
      WHERE is_active = true
      GROUP BY currency
    `),
    pool.query(`
      SELECT source, COUNT(*) as count
      FROM yacht_prices
      WHERE is_active = true
      GROUP BY source
    `),
  ]);

  const total = parseInt(totalYachts.rows[0]?.count || '0', 10);
  const withPrices = parseInt(yachtsWithPrices.rows[0]?.count || '0', 10);

  return {
    totalYachts: total,
    yachtsWithPrices: withPrices,
    yachtsWithoutPrices: total - withPrices,
    coveragePercent: total > 0 ? Math.round((withPrices / total) * 100) : 0,
    byCondition: Object.fromEntries(
      byCondition.rows.map((r: any) => [r.condition, parseInt(r.count, 10)])
    ) as Record<PriceCondition, number>,
    byCurrency: Object.fromEntries(
      byCurrency.rows.map((r: any) => [r.currency, parseInt(r.count, 10)])
    ),
    byProvider: Object.fromEntries(
      byProvider.rows.map((r: any) => [r.source, parseInt(r.count, 10)])
    ),
    recentRuns: [], // In-memory for now; could persist to DB later
  };
}

// --- Price display helpers ---

export function formatPriceRange(min: number, max: number, currency: string = 'EUR'): string {
  const fmt = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return n.toString();
  };
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;
  return `${symbol}${fmt(min)} – ${fmt(max)}`;
}
