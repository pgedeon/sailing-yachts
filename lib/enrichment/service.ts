/**
 * P21.2: Data enrichment service
 *
 * Orchestrates the enrichment pipeline: identifies yachts with missing data,
 * fetches from external sources, normalizes, deduplicates, and applies updates.
 */

import { pool, ensureSchema } from '@/lib/db'
import {
  fetchBoatSpecs,
  searchBoatSpecs,
  buildBoatSpecsUrl,
  sleep,
  type ScrapedSpecs,
} from './boat-specs-scraper'

// Fields that can be enriched from external sources
const ENRICHABLE_FIELDS = [
  'beam',
  'draft',
  'displacement',
  'ballast',
  'sail_area_main',
  'engine_hp',
  'engine_type',
  'cabins',
  'berths',
  'heads',
  'hull_material',
  'keel_type',
  'rig_type',
  'fuel_capacity',
  'water_capacity',
] as const

type EnrichableField = (typeof ENRICHABLE_FIELDS)[number]

export interface EnrichmentCandidate {
  id: number
  manufacturerId: number
  modelName: string
  slug: string | null
  manufacturer: string
  missingFields: string[]
  missingCount: number
}

export interface EnrichmentResult {
  yachtId: number
  status: 'updated' | 'no_data' | 'error' | 'skipped'
  fieldsUpdated: string[]
  sourceUrl: string | null
  confidence: number
  error?: string
}

export interface EnrichmentRunStats {
  totalCandidates: number
  processed: number
  updated: number
  noData: number
  errors: number
  skipped: number
  durationMs: number
}

/**
 * Find yachts that are missing key specification fields
 */
export async function findEnrichmentCandidates(
  limit = 50
): Promise<EnrichmentCandidate[]> {
  const result = await pool.query(`
    SELECT
      y.id,
      y.manufacturer_id,
      y.model_name,
      y.slug,
      m.name AS manufacturer,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN y.draft IS NULL THEN 'draft' END,
        CASE WHEN y.ballast IS NULL THEN 'ballast' END,
        CASE WHEN y.sail_area_main IS NULL THEN 'sail_area_main' END,
        CASE WHEN y.engine_hp IS NULL THEN 'engine_hp' END,
        CASE WHEN y.cabins IS NULL THEN 'cabins' END,
        CASE WHEN y.berths IS NULL THEN 'berths' END,
        CASE WHEN y.heads IS NULL THEN 'heads' END,
        CASE WHEN y.keel_type IS NULL THEN 'keel_type' END,
        CASE WHEN y.fuel_capacity IS NULL THEN 'fuel_capacity' END,
        CASE WHEN y.water_capacity IS NULL THEN 'water_capacity' END
      ], NULL) AS missing_fields,
      (CASE WHEN y.draft IS NULL THEN 1 ELSE 0 END +
       CASE WHEN y.ballast IS NULL THEN 1 ELSE 0 END +
       CASE WHEN y.sail_area_main IS NULL THEN 1 ELSE 0 END +
       CASE WHEN y.engine_hp IS NULL THEN 1 ELSE 0 END +
       CASE WHEN y.cabins IS NULL THEN 1 ELSE 0 END +
       CASE WHEN y.berths IS NULL THEN 1 ELSE 0 END +
       CASE WHEN y.heads IS NULL THEN 1 ELSE 0 END) AS missing_count
    FROM yacht_models y
    JOIN manufacturers m ON y.manufacturer_id = m.id
    WHERE
      y.draft IS NULL OR y.ballast IS NULL OR y.sail_area_main IS NULL
      OR y.engine_hp IS NULL OR y.cabins IS NULL OR y.berths IS NULL
      OR y.heads IS NULL OR y.keel_type IS NULL
    ORDER BY missing_count DESC
    LIMIT $1
  `, [limit])

  return result.rows.map((row) => ({
    id: row.id,
    manufacturerId: row.manufacturer_id,
    modelName: row.model_name,
    slug: row.slug,
    manufacturer: row.manufacturer,
    missingFields: row.missing_fields || [],
    missingCount: parseInt(row.missing_count) || 0,
  }))
}

/**
 * Map scraped specs to database fields, only including fields that are missing
 */
function mapSpecsToUpdates(
  specs: ScrapedSpecs,
  missingFields: string[]
): Record<string, { value: unknown; confidence: number }> {
  const updates: Record<string, { value: unknown; confidence: number }> = {}

  const fieldMapping: Record<string, { scrapeKey: keyof ScrapedSpecs; confidence: number }> = {
    beam: { scrapeKey: 'beam', confidence: 90 },
    draft: { scrapeKey: 'draft', confidence: 85 },
    displacement: { scrapeKey: 'displacement', confidence: 90 },
    ballast: { scrapeKey: 'ballast', confidence: 85 },
    sail_area_main: { scrapeKey: 'mainsailArea', confidence: 80 },
    engine_hp: { scrapeKey: 'enginePower', confidence: 85 },
    engine_type: { scrapeKey: 'fuelType', confidence: 75 },
    cabins: { scrapeKey: 'cabins', confidence: 85 },
    berths: { scrapeKey: 'berths', confidence: 80 },
    heads: { scrapeKey: 'heads', confidence: 85 },
    keel_type: { scrapeKey: 'keelType', confidence: 70 },
    hull_material: { scrapeKey: 'construction', confidence: 60 },
    fuel_capacity: { scrapeKey: 'fuelTankCapacity', confidence: 85 },
    water_capacity: { scrapeKey: 'waterTankCapacity', confidence: 85 },
  }

  for (const field of missingFields) {
    const mapping = fieldMapping[field]
    if (!mapping) continue

    const value = specs[mapping.scrapeKey]
    if (value !== undefined && value !== null && value !== '') {
      updates[field] = { value, confidence: mapping.confidence }
    }
  }

  return updates
}

/**
 * Apply enrichment updates to a yacht record
 */
async function applyEnrichmentUpdates(
  yachtId: number,
  updates: Record<string, { value: unknown; confidence: number }>,
  sourceUrl: string,
  sourceId: number
): Promise<string[]> {
  if (Object.keys(updates).length === 0) return []

  const setClauses: string[] = []
  const values: unknown[] = []
  let paramIdx = 1

  for (const [field, { value }] of Object.entries(updates)) {
    setClauses.push(`${field} = $${paramIdx}`)
    values.push(typeof value === 'number' ? String(value) : value)
    paramIdx++
  }

  // Add source attribution
  setClauses.push(`source_url = $${paramIdx}`)
  values.push(sourceUrl)
  paramIdx++
  setClauses.push(`data_source = $${paramIdx}`)
  values.push('boat-specs.com')
  paramIdx++
  setClauses.push(`source_attribution = $${paramIdx}`)
  values.push('Data sourced from Boat-Specs.com')
  paramIdx++
  setClauses.push(`updated_at = NOW()`)

  // yachtId
  values.push(yachtId)

  const query = `UPDATE yacht_models SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`

  await pool.query(query, values)

  // Log the enrichment
  await pool.query(
    `INSERT INTO enrichment_logs (source_id, yacht_model_id, status, fields_updated, new_values, confidence, completed_at)
     VALUES ($1, $2, 'success', $3, $4, $5, NOW())`,
    [
      sourceId,
      yachtId,
      Object.keys(updates),
      Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, v.value])),
      Math.min(...Object.values(updates).map((v) => v.confidence)),
    ]
  )

  return Object.keys(updates)
}

/**
 * Enrich a single yacht from boat-specs.com
 */
export async function enrichSingle(
  candidate: EnrichmentCandidate,
  sourceId: number,
  fetchFn: typeof fetch = fetch
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    yachtId: candidate.id,
    status: 'no_data',
    fieldsUpdated: [],
    sourceUrl: null,
    confidence: 0,
  }

  try {
    // Try direct URL first
    const directUrl = buildBoatSpecsUrl(candidate.manufacturer, candidate.modelName)
    let specs = await fetchBoatSpecs(directUrl, fetchFn)

    // If direct URL fails, try search
    if (!specs) {
      const searchUrls = await searchBoatSpecs(
        candidate.manufacturer,
        candidate.modelName,
        fetchFn
      )

      for (const url of searchUrls.slice(0, 3)) {
        specs = await fetchBoatSpecs(url, fetchFn)
        if (specs) break
        await sleep(1000)
      }
    }

    if (!specs) {
      // Log no data found
      await pool.query(
        `INSERT INTO enrichment_logs (source_id, yacht_model_id, status, error_message, completed_at)
         VALUES ($1, $2, 'no_data', 'No matching data found', NOW())`,
        [sourceId, candidate.id]
      )
      result.status = 'no_data'
      return result
    }

    result.sourceUrl = specs.sourceUrl

    // Map specs to updates for missing fields only
    const updates = mapSpecsToUpdates(specs, candidate.missingFields)

    if (Object.keys(updates).length === 0) {
      result.status = 'no_data'
      return result
    }

    // Apply updates
    const fieldsUpdated = await applyEnrichmentUpdates(
      candidate.id,
      updates,
      specs.sourceUrl,
      sourceId
    )

    result.status = 'updated'
    result.fieldsUpdated = fieldsUpdated
    result.confidence = Math.min(...Object.values(updates).map((v) => v.confidence))

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await pool.query(
      `INSERT INTO enrichment_logs (source_id, yacht_model_id, status, error_message, completed_at)
       VALUES ($1, $2, 'error', $3, NOW())`,
      [sourceId, candidate.id, errorMessage]
    )

    result.status = 'error'
    result.error = errorMessage
    return result
  }
}

/**
 * Run the full enrichment pipeline
 */
export async function runEnrichmentPipeline(
  options: { limit?: number; rateLimitMs?: number; dryRun?: boolean } = {}
): Promise<EnrichmentRunStats> {
  const { limit = 50, rateLimitMs = 3000, dryRun = false } = options
  const startTime = Date.now()

  const candidates = await findEnrichmentCandidates(limit)
  const stats: EnrichmentRunStats = {
    totalCandidates: candidates.length,
    processed: 0,
    updated: 0,
    noData: 0,
    errors: 0,
    skipped: 0,
    durationMs: 0,
  }

  if (candidates.length === 0) {
    stats.durationMs = Date.now() - startTime
    return stats
  }

  // Get source ID
  const sourceResult = await pool.query(
    `SELECT id FROM enrichment_sources WHERE name = 'boat-specs.com' LIMIT 1`
  )
  const sourceId = sourceResult.rows[0]?.id
  if (!sourceId) {
    throw new Error('Enrichment source not configured')
  }

  // Update source last_run_at
  await pool.query(
    `UPDATE enrichment_sources SET last_run_at = NOW() WHERE id = $1`,
    [sourceId]
  )

  for (const candidate of candidates) {
    if (dryRun) {
      stats.skipped++
      stats.processed++
      continue
    }

    const result = await enrichSingle(candidate, sourceId)
    stats.processed++

    switch (result.status) {
      case 'updated':
        stats.updated++
        break
      case 'no_data':
        stats.noData++
        break
      case 'error':
        stats.errors++
        break
      case 'skipped':
        stats.skipped++
        break
    }

    // Rate limiting
    await sleep(rateLimitMs)
  }

  // Update source stats
  await pool.query(
    `UPDATE enrichment_sources
     SET total_fetched = total_fetched + $1,
         total_updated = total_updated + $2,
         total_errors = total_errors + $3
     WHERE id = $4`,
    [stats.processed, stats.updated, stats.errors, sourceId]
  )

  stats.durationMs = Date.now() - startTime
  return stats
}

/**
 * Get enrichment status summary
 */
export async function getEnrichmentStatus(): Promise<{
  sources: Array<{
    id: number
    name: string
    enabled: boolean
    lastRunAt: string | null
    totalFetched: number
    totalUpdated: number
    totalErrors: number
  }>
  candidatesCount: number
  recentLogs: Array<{
    id: number
    yachtModelId: number | null
    status: string
    fieldsUpdated: string[] | null
    errorMessage: string | null
    startedAt: string
    completedAt: string | null
  }>
  fieldCoverage: Record<string, { total: number; filled: number; percentage: number }>
}> {
  await ensureSchema()
  // Get sources
  const sourcesResult = await pool.query(
    `SELECT id, name, enabled, last_run_at, total_fetched, total_updated, total_errors
     FROM enrichment_sources ORDER BY name`
  )

  // Get candidates count
  const candidatesResult = await pool.query(`
    SELECT COUNT(*) as count FROM yacht_models
    WHERE draft IS NULL OR ballast IS NULL OR sail_area_main IS NULL
      OR engine_hp IS NULL OR cabins IS NULL OR berths IS NULL
      OR heads IS NULL OR keel_type IS NULL
  `)

  // Get recent logs
  const logsResult = await pool.query(`
    SELECT el.id, el.yacht_model_id, el.status, el.fields_updated, el.error_message,
           el.started_at, el.completed_at
    FROM enrichment_logs el
    ORDER BY el.started_at DESC
    LIMIT 50
  `)

  // Get field coverage
  const coverageResult = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(beam) as beam_filled,
      COUNT(draft) as draft_filled,
      COUNT(displacement) as displacement_filled,
      COUNT(ballast) as ballast_filled,
      COUNT(sail_area_main) as sail_area_filled,
      COUNT(engine_hp) as engine_hp_filled,
      COUNT(cabins) as cabins_filled,
      COUNT(berths) as berths_filled,
      COUNT(heads) as heads_filled,
      COUNT(keel_type) as keel_type_filled,
      COUNT(rig_type) as rig_type_filled,
      COUNT(fuel_capacity) as fuel_capacity_filled,
      COUNT(water_capacity) as water_capacity_filled
    FROM yacht_models
  `)

  const total = parseInt(coverageResult.rows[0].total)
  const fieldCoverage: Record<string, { total: number; filled: number; percentage: number }> = {}

  const fieldNames = [
    'beam', 'draft', 'displacement', 'ballast', 'sail_area_main',
    'engine_hp', 'cabins', 'berths', 'heads', 'keel_type', 'rig_type',
    'fuel_capacity', 'water_capacity',
  ]

  for (const field of fieldNames) {
    const filled = parseInt(coverageResult.rows[0][`${field}_filled`])
    fieldCoverage[field] = {
      total,
      filled,
      percentage: Math.round((filled / total) * 100),
    }
  }

  return {
    sources: sourcesResult.rows.map((r) => ({
      id: r.id,
      name: r.name,
      enabled: r.enabled,
      lastRunAt: r.last_run_at,
      totalFetched: parseInt(r.total_fetched) || 0,
      totalUpdated: parseInt(r.total_updated) || 0,
      totalErrors: parseInt(r.total_errors) || 0,
    })),
    candidatesCount: parseInt(candidatesResult.rows[0].count),
    recentLogs: logsResult.rows.map((r) => ({
      id: r.id,
      yachtModelId: r.yacht_model_id,
      status: r.status,
      fieldsUpdated: r.fields_updated,
      errorMessage: r.error_message,
      startedAt: r.started_at,
      completedAt: r.completed_at,
    })),
    fieldCoverage,
  }
}
