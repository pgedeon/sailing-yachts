/**
 * P24.5 — Competitive Positioning Matrix Service
 *
 * Auto-generates competitive positioning analysis for each manufacturer.
 * Market segment coverage visualization. Price positioning charts.
 *
 * Analyzes:
 *   - Fleet size and model range breadth
 *   - Size segment coverage (under-30ft, 30-35ft, ..., over-50ft)
 *   - Price positioning (budget, mid-range, premium, luxury)
 *   - Feature density (average spec completeness per manufacturer)
 *   - Market positioning quadrant (breadth vs. depth)
 */

import { pool } from "./db";

// ─── Types ──────────────────────────────────────────────────────

export type SizeSegment =
  | "under-30ft"
  | "30-35ft"
  | "35-40ft"
  | "40-45ft"
  | "45-50ft"
  | "over-50ft";

export type PriceTier = "budget" | "mid-range" | "premium" | "luxury" | "unknown";

export interface ManufacturerPosition {
  manufacturerId: number;
  manufacturerName: string;
  country: string | null;
  logoUrl: string | null;
  fleetSize: number;
  avgLength: number;
  minLength: number;
  maxLength: number;
  sizeSegments: Record<SizeSegment, number>;
  priceTier: PriceTier;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  avgCompleteness: number;
  featureDensity: number; // average specs per model
  positioningScore: number; // 0-100 composite score
  breadthScore: number; // how many size segments covered (0-100)
  depthScore: number; // how many models per segment (0-100)
}

export interface SegmentCoverage {
  segment: SizeSegment;
  label: string;
  rangeLabel: string;
  manufacturerCount: number;
  yachtCount: number;
  manufacturers: { name: string; count: number }[];
}

export interface PricePositioning {
  tier: PriceTier;
  label: string;
  rangeLabel: string;
  manufacturerCount: number;
  avgFleetSize: number;
}

export interface PositioningQuadrant {
  manufacturerId: number;
  manufacturerName: string;
  breadthScore: number;
  depthScore: number;
  quadrant: "specialist" | "generalist" | "niche" | "dominant";
}

export interface CompetitiveMatrix {
  manufacturers: ManufacturerPosition[];
  segmentCoverage: SegmentCoverage[];
  pricePositioning: PricePositioning[];
  quadrants: PositioningQuadrant[];
  totalManufacturers: number;
  totalYachts: number;
  mostDiverse: string | null;
  largestFleet: string | null;
  premiumLeader: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────

const SIZE_SEGMENTS: { key: SizeSegment; label: string; range: string; min: number; max: number }[] = [
  { key: "under-30ft", label: "Under 30ft", range: "< 9.14m", min: 0, max: 30 },
  { key: "30-35ft", label: "30–35ft", range: "9.14–10.67m", min: 30, max: 35 },
  { key: "35-40ft", label: "35–40ft", range: "10.67–12.19m", min: 35, max: 40 },
  { key: "40-45ft", label: "40–45ft", range: "12.19–13.72m", min: 40, max: 45 },
  { key: "45-50ft", label: "45–50ft", range: "13.72–15.24m", min: 45, max: 50 },
  { key: "over-50ft", label: "Over 50ft", range: "> 15.24m", min: 50, max: 999 },
];

const PRICE_TIERS: { key: PriceTier; label: string; range: string; min: number; max: number }[] = [
  { key: "budget", label: "Budget", range: "< €80k", min: 0, max: 80000 },
  { key: "mid-range", label: "Mid-Range", range: "€80k–€200k", min: 80000, max: 200000 },
  { key: "premium", label: "Premium", range: "€200k–€500k", min: 200000, max: 500000 },
  { key: "luxury", label: "Luxury", range: "> €500k", min: 500000, max: Infinity },
];

// ─── Helper Functions ──────────────────────────────────────────────

export function classifySizeSegment(lengthFt: number): SizeSegment {
  for (const seg of SIZE_SEGMENTS) {
    if (lengthFt >= seg.min && lengthFt < seg.max) return seg.key;
  }
  return "over-50ft";
}

export function classifyPriceTier(avgPrice: number | null): PriceTier {
  if (avgPrice === null) return "unknown";
  for (const tier of PRICE_TIERS) {
    if (avgPrice >= tier.min && avgPrice < tier.max) return tier.key;
  }
  return "unknown";
}

export function computeBreadthScore(segments: Record<SizeSegment, number>): number {
  const covered = Object.values(segments).filter((c) => c > 0).length;
  return Math.round((covered / SIZE_SEGMENTS.length) * 100);
}

export function computeDepthScore(segments: Record<SizeSegment, number>, fleetSize: number): number {
  if (fleetSize === 0) return 0;
  const maxPerSegment = Math.max(...Object.values(segments));
  // Score based on average depth across covered segments
  const covered = Object.values(segments).filter((c) => c > 0);
  const avgDepth = covered.length > 0 ? covered.reduce((a, b) => a + b, 0) / covered.length : 0;
  // Normalize: 5+ models per segment = 100
  return Math.min(Math.round((avgDepth / 5) * 100), 100);
}

export function classifyQuadrant(breadthScore: number, depthScore: number): PositioningQuadrant["quadrant"] {
  const breadthMedian = 50;
  const depthMedian = 40;
  if (breadthScore >= breadthMedian && depthScore >= depthMedian) return "dominant";
  if (breadthScore >= breadthMedian && depthScore < depthMedian) return "generalist";
  if (breadthScore < breadthMedian && depthScore >= depthMedian) return "specialist";
  return "niche";
}

// ─── Query Functions ──────────────────────────────────────────────

/**
 * Get manufacturer positioning data with fleet analysis.
 */
export async function getManufacturerPositions(): Promise<ManufacturerPosition[]> {
  const result = await pool.query(`
    SELECT
      m.id as manufacturer_id,
      m.name as manufacturer_name,
      m.country,
      m.logo_url,
      COUNT(ym.id) as fleet_size,
      COALESCE(AVG(COALESCE(CAST(ym.length_overall AS numeric), 0)), 0) as avg_length,
      COALESCE(MIN(CAST(ym.length_overall AS numeric)), 0) as min_length,
      COALESCE(MAX(CAST(ym.length_overall AS numeric)), 0) as max_length,
      COALESCE(AVG(CAST(ym.completeness_score AS numeric)), 0) as avg_completeness
    FROM manufacturers m
    LEFT JOIN yacht_models ym ON ym.manufacturer_id = m.id
    GROUP BY m.id, m.name, m.country, m.logo_url
    HAVING COUNT(ym.id) > 0
    ORDER BY fleet_size DESC
  `);

  // Get price data per manufacturer
  const priceResult = await pool.query(`
    SELECT
      ym.manufacturer_id,
      AVG((CAST(p.price_min AS numeric) + CAST(p.price_max AS numeric)) / 2) as avg_price,
      MIN(CAST(p.price_min AS numeric)) as min_price,
      MAX(CAST(p.price_max AS numeric)) as max_price
    FROM yacht_models ym
    JOIN yacht_prices p ON p.yacht_model_id = ym.id
    GROUP BY ym.manufacturer_id
  `);

  const priceMap = new Map<number, { avg: number; min: number; max: number }>();
  for (const row of priceResult.rows) {
    priceMap.set(row.manufacturer_id, {
      avg: parseFloat(row.avg_price),
      min: parseFloat(row.min_price),
      max: parseFloat(row.max_price),
    });
  }

  // Get size segment distribution per manufacturer
  const segmentResult = await pool.query(`
    SELECT
      ym.manufacturer_id,
      CASE
        WHEN CAST(ym.length_overall AS numeric) < 30 THEN 'under-30ft'
        WHEN CAST(ym.length_overall AS numeric) >= 30 AND CAST(ym.length_overall AS numeric) < 35 THEN '30-35ft'
        WHEN CAST(ym.length_overall AS numeric) >= 35 AND CAST(ym.length_overall AS numeric) < 40 THEN '35-40ft'
        WHEN CAST(ym.length_overall AS numeric) >= 40 AND CAST(ym.length_overall AS numeric) < 45 THEN '40-45ft'
        WHEN CAST(ym.length_overall AS numeric) >= 45 AND CAST(ym.length_overall AS numeric) < 50 THEN '45-50ft'
        ELSE 'over-50ft'
      END as segment,
      COUNT(*) as count
    FROM yacht_models ym
    WHERE ym.length_overall IS NOT NULL
    GROUP BY ym.manufacturer_id, segment
  `);

  const segmentMap = new Map<number, Record<SizeSegment, number>>();
  for (const row of segmentResult.rows) {
    if (!segmentMap.has(row.manufacturer_id)) {
      segmentMap.set(row.manufacturer_id, {
        "under-30ft": 0, "30-35ft": 0, "35-40ft": 0,
        "40-45ft": 0, "45-50ft": 0, "over-50ft": 0,
      });
    }
    segmentMap.get(row.manufacturer_id)![row.segment as SizeSegment] = parseInt(row.count, 10);
  }

  // Get feature density (average non-null specs per model)
  const featureResult = await pool.query(`
    SELECT
      ym.manufacturer_id,
      AVG(
        (CASE WHEN ym.length_overall IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.beam IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.draft IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.displacement IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.ballast IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.sail_area_main IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.rig_type IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.keel_type IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.hull_material IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.cabins IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.berths IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.heads IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.engine_hp IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.engine_type IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.fuel_capacity IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ym.water_capacity IS NOT NULL THEN 1 ELSE 0 END)
      ) as feature_density
    FROM yacht_models ym
    GROUP BY ym.manufacturer_id
  `);

  const featureMap = new Map<number, number>();
  for (const row of featureResult.rows) {
    featureMap.set(row.manufacturer_id, parseFloat(row.feature_density || "0"));
  }

  return result.rows.map((row) => {
    const fleetSize = parseInt(row.fleet_size, 10);
    const segments = segmentMap.get(row.manufacturer_id) || {
      "under-30ft": 0, "30-35ft": 0, "35-40ft": 0,
      "40-45ft": 0, "45-50ft": 0, "over-50ft": 0,
    };
    const priceData = priceMap.get(row.manufacturer_id);
    const avgPrice = priceData?.avg ?? null;
    const avgCompleteness = parseFloat(row.avg_completeness) || 0;
    const featureDensity = featureMap.get(row.manufacturer_id) || 0;
    const breadthScore = computeBreadthScore(segments);
    const depthScore = computeDepthScore(segments, fleetSize);

    // Composite positioning score: weighted average
    const positioningScore = Math.round(
      breadthScore * 0.3 +
      depthScore * 0.3 +
      Math.min(fleetSize, 50) / 50 * 100 * 0.2 +
      avgCompleteness * 0.1 +
      Math.min(featureDensity / 16, 1) * 100 * 0.1
    );

    return {
      manufacturerId: row.manufacturer_id,
      manufacturerName: row.manufacturer_name,
      country: row.country,
      logoUrl: row.logo_url,
      fleetSize,
      avgLength: Math.round(parseFloat(row.avg_length) * 10) / 10,
      minLength: Math.round(parseFloat(row.min_length) * 10) / 10,
      maxLength: Math.round(parseFloat(row.max_length) * 10) / 10,
      sizeSegments: segments,
      priceTier: classifyPriceTier(avgPrice),
      avgPrice: avgPrice !== null ? Math.round(avgPrice) : null,
      minPrice: priceData?.min ? Math.round(priceData.min) : null,
      maxPrice: priceData?.max ? Math.round(priceData.max) : null,
      avgCompleteness: Math.round(avgCompleteness),
      featureDensity: Math.round(featureDensity * 10) / 10,
      positioningScore,
      breadthScore,
      depthScore,
    };
  });
}

/**
 * Get segment coverage across all manufacturers.
 */
export async function getSegmentCoverage(): Promise<SegmentCoverage[]> {
  const positions = await getManufacturerPositions();

  return SIZE_SEGMENTS.map((seg) => {
    const manufacturerData: { name: string; count: number }[] = [];
    let yachtCount = 0;

    for (const pos of positions) {
      const count = pos.sizeSegments[seg.key];
      if (count > 0) {
        manufacturerData.push({ name: pos.manufacturerName, count });
        yachtCount += count;
      }
    }

    // Sort by count descending
    manufacturerData.sort((a, b) => b.count - a.count);

    return {
      segment: seg.key,
      label: seg.label,
      rangeLabel: seg.range,
      manufacturerCount: manufacturerData.length,
      yachtCount,
      manufacturers: manufacturerData,
    };
  });
}

/**
 * Get price positioning analysis.
 */
export async function getPricePositioning(): Promise<PricePositioning[]> {
  const positions = await getManufacturerPositions();

  return PRICE_TIERS.map((tier) => {
    const inTier = positions.filter((p) => p.priceTier === tier.key);
    return {
      tier: tier.key,
      label: tier.label,
      rangeLabel: tier.range,
      manufacturerCount: inTier.length,
      avgFleetSize: inTier.length > 0
        ? Math.round(inTier.reduce((sum, p) => sum + p.fleetSize, 0) / inTier.length)
        : 0,
    };
  }).concat([
    {
      tier: "unknown" as PriceTier,
      label: "No Price Data",
      rangeLabel: "—",
      manufacturerCount: positions.filter((p) => p.priceTier === "unknown").length,
      avgFleetSize: positions.filter((p) => p.priceTier === "unknown").length > 0
        ? Math.round(
            positions
              .filter((p) => p.priceTier === "unknown")
              .reduce((sum, p) => sum + p.fleetSize, 0) /
            positions.filter((p) => p.priceTier === "unknown").length
          )
        : 0,
    },
  ]);
}

/**
 * Get positioning quadrant analysis.
 */
export async function getPositioningQuadrants(): Promise<PositioningQuadrant[]> {
  const positions = await getManufacturerPositions();

  return positions.map((pos) => ({
    manufacturerId: pos.manufacturerId,
    manufacturerName: pos.manufacturerName,
    breadthScore: pos.breadthScore,
    depthScore: pos.depthScore,
    quadrant: classifyQuadrant(pos.breadthScore, pos.depthScore),
  }));
}

/**
 * Get full competitive matrix for admin dashboard.
 */
export async function getCompetitiveMatrix(): Promise<CompetitiveMatrix> {
  const [manufacturers, segmentCoverage, pricePositioning, quadrants] = await Promise.all([
    getManufacturerPositions(),
    getSegmentCoverage(),
    getPricePositioning(),
    getPositioningQuadrants(),
  ]);

  const totalYachts = manufacturers.reduce((sum, m) => sum + m.fleetSize, 0);

  // Find highlights
  const mostDiverse = manufacturers.length > 0
    ? [...manufacturers].sort((a, b) => b.breadthScore - a.breadthScore)[0]?.manufacturerName || null
    : null;
  const largestFleet = manufacturers.length > 0
    ? [...manufacturers].sort((a, b) => b.fleetSize - a.fleetSize)[0]?.manufacturerName || null
    : null;
  const premiumLeader = manufacturers.filter((m) => m.avgPrice !== null).length > 0
    ? [...manufacturers].filter((m) => m.avgPrice !== null).sort((a, b) => (b.avgPrice || 0) - (a.avgPrice || 0))[0]?.manufacturerName || null
    : null;

  return {
    manufacturers,
    segmentCoverage,
    pricePositioning,
    quadrants,
    totalManufacturers: manufacturers.length,
    totalYachts,
    mostDiverse,
    largestFleet,
    premiumLeader,
  };
}
