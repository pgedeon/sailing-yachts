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
 *
 * Note: length_overall is stored in METERS. Segments are in FEET.
 * Conversion factor: 1 meter = 3.28084 feet.
 */

import { asc, avg, count, eq, min, max, sql, sum, inArray, gte, lte, and } from "drizzle-orm";
import { db } from "./db-edge";
import { manufacturers, yachtModels, yachtPrices, images } from "../drizzle/schema";

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
  avgLength: number;   // feet
  minLength: number;   // feet
  maxLength: number;   // feet
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

const METERS_TO_FEET = 3.28084;

const SIZE_SEGMENTS: { key: SizeSegment; label: string; range: string; minFt: number; maxFt: number }[] = [
  { key: "under-30ft", label: "Under 30ft", range: "< 9.14m", minFt: 0, maxFt: 30 },
  { key: "30-35ft", label: "30–35ft", range: "9.14–10.67m", minFt: 30, maxFt: 35 },
  { key: "35-40ft", label: "35–40ft", range: "10.67–12.19m", minFt: 35, maxFt: 40 },
  { key: "40-45ft", label: "40–45ft", range: "12.19–13.72m", minFt: 40, maxFt: 45 },
  { key: "45-50ft", label: "45–50ft", range: "13.72–15.24m", minFt: 45, maxFt: 50 },
  { key: "over-50ft", label: "Over 50ft", range: "> 15.24m", minFt: 50, maxFt: Infinity },
];

const PRICE_TIERS: { key: PriceTier; label: string; range: string; min: number; max: number }[] = [
  { key: "budget", label: "Budget", range: "< €80k", min: 0, max: 80000 },
  { key: "mid-range", label: "Mid-Range", range: "€80k–€200k", min: 80000, max: 200000 },
  { key: "premium", label: "Premium", range: "€200k–€500k", min: 200000, max: 500000 },
  { key: "luxury", label: "Luxury", range: "> €500k", min: 500000, max: Infinity },
];

// ─── Helper Functions ──────────────────────────────────────────────

function metersToFt(m: number | null): number {
  if (m === null || m === undefined) return 0;
  return Math.round(m * METERS_TO_FEET * 10) / 10;
}

function parseNum(val: string | number | null): number {
  if (val === null || val === undefined) return 0;
  return typeof val === "number" ? val : parseFloat(val) || 0;
}

export function classifySizeSegment(lengthFt: number): SizeSegment {
  for (const seg of SIZE_SEGMENTS) {
    if (lengthFt >= seg.minFt && lengthFt < seg.maxFt) return seg.key;
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
  const covered = Object.values(segments).filter((c) => c > 0);
  const avgDepth = covered.length > 0 ? covered.reduce((a, b) => a + b, 0) / covered.length : 0;
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
 * Uses Drizzle ORM with OCI PostgreSQL.
 */
export async function getManufacturerPositions(): Promise<ManufacturerPosition[]> {
  // Fleet overview per manufacturer (only those with yachts)
  const fleetRows = await db
    .select({
      manufacturerId: manufacturers.id,
      manufacturerName: manufacturers.name,
      country: manufacturers.country,
      logoUrl: manufacturers.logoUrl,
      fleetSize: count(yachtModels.id),
      avgLengthM: avg(yachtModels.lengthOverall),
      minLengthM: min(yachtModels.lengthOverall),
      maxLengthM: max(yachtModels.lengthOverall),
      avgCompleteness: avg(yachtModels.completenessScore),
    })
    .from(manufacturers)
    .leftJoin(yachtModels, eq(yachtModels.manufacturerId, manufacturers.id))
    .groupBy(
      manufacturers.id,
      manufacturers.name,
      manufacturers.country,
      manufacturers.logoUrl,
    )
    .having(sql`count(${yachtModels.id}) > 0`)
    .orderBy(sql`count(${yachtModels.id}) desc`);

  // All yachts with their manufacturer (for segment + feature analysis)
  const allYachts = await db
    .select({
      id: yachtModels.id,
      manufacturerId: yachtModels.manufacturerId,
      lengthOverall: yachtModels.lengthOverall,
      beam: yachtModels.beam,
      draft: yachtModels.draft,
      displacement: yachtModels.displacement,
      ballast: yachtModels.ballast,
      sailAreaMain: yachtModels.sailAreaMain,
      rigType: yachtModels.rigType,
      keelType: yachtModels.keelType,
      hullMaterial: yachtModels.hullMaterial,
      cabins: yachtModels.cabins,
      berths: yachtModels.berths,
      heads: yachtModels.heads,
      engineHp: yachtModels.engineHp,
      engineType: yachtModels.engineType,
      fuelCapacity: yachtModels.fuelCapacity,
      waterCapacity: yachtModels.waterCapacity,
    })
    .from(yachtModels);

  // Price data per manufacturer
  const priceRows = await db
    .select({
      yachtModelId: yachtPrices.yachtModelId,
      priceMin: yachtPrices.priceMin,
      priceMax: yachtPrices.priceMax,
      isActive: yachtPrices.isActive,
    })
    .from(yachtPrices)
    .where(eq(yachtPrices.isActive, true));

  // Build price map keyed by yacht_model_id → average price
  const priceByYacht = new Map<number, number>();
  for (const row of priceRows) {
    const avg = (parseNum(row.priceMin) + parseNum(row.priceMax)) / 2;
    priceByYacht.set(row.yachtModelId, avg);
  }

  // Group yachts by manufacturer for segment + feature analysis
  const yachtsByMfr = new Map<number, typeof allYachts>();
  for (const y of allYachts) {
    if (!yachtsByMfr.has(y.manufacturerId)) yachtsByMfr.set(y.manufacturerId, []);
    yachtsByMfr.get(y.manufacturerId)!.push(y);
  }

  return fleetRows.map((row: typeof fleetRows[number]) => {
    const fleetSize = Number(row.fleetSize) || 0;
    const avgLengthFt = metersToFt(parseNum(row.avgLengthM));
    const minLengthFt = metersToFt(parseNum(row.minLengthM));
    const maxLengthFt = metersToFt(parseNum(row.maxLengthM));
    const avgCompleteness = parseNum(row.avgCompleteness);

    // Size segments in feet
    const yachts = yachtsByMfr.get(Number(row.manufacturerId)) || [];
    const segments: Record<SizeSegment, number> = {
      "under-30ft": 0, "30-35ft": 0, "35-40ft": 0,
      "40-45ft": 0, "45-50ft": 0, "over-50ft": 0,
    };
    let featureDensityTotal = 0;

    for (const y of yachts) {  // y is already typed from allYachts
      const lengthFt = metersToFt(parseNum(y.lengthOverall));
      const seg = classifySizeSegment(lengthFt);
      segments[seg]++;

      // Feature density: count non-null spec fields
      let fieldCount = 0;
      if (y.lengthOverall !== null) fieldCount++;
      if (y.beam !== null) fieldCount++;
      if (y.draft !== null) fieldCount++;
      if (y.displacement !== null) fieldCount++;
      if (y.ballast !== null) fieldCount++;
      if (y.sailAreaMain !== null) fieldCount++;
      if (y.rigType !== null) fieldCount++;
      if (y.keelType !== null) fieldCount++;
      if (y.hullMaterial !== null) fieldCount++;
      if (y.cabins !== null) fieldCount++;
      if (y.berths !== null) fieldCount++;
      if (y.heads !== null) fieldCount++;
      if (y.engineHp !== null) fieldCount++;
      if (y.engineType !== null) fieldCount++;
      if (y.fuelCapacity !== null) fieldCount++;
      if (y.waterCapacity !== null) fieldCount++;
      featureDensityTotal += fieldCount;
    }

    const featureDensity = fleetSize > 0 ? featureDensityTotal / fleetSize : 0;
    const breadthScore = computeBreadthScore(segments);
    const depthScore = computeDepthScore(segments, fleetSize);

    // Price data for this manufacturer
    const prices: number[] = yachts
      .map((y: typeof allYachts[number]) => priceByYacht.get(y.id))
      .filter((p: unknown): p is number => typeof p === "number");
    const avgPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : null;
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

    // Composite positioning score
    const positioningScore = Math.round(
      breadthScore * 0.3 +
      depthScore * 0.3 +
      Math.min(fleetSize, 50) / 50 * 100 * 0.2 +
      avgCompleteness * 0.1 +
      Math.min(featureDensity / 16, 1) * 100 * 0.1
    );

    return {
      manufacturerId: Number(row.manufacturerId),
      manufacturerName: String(row.manufacturerName),
      country: row.country,
      logoUrl: row.logoUrl,
      fleetSize,
      avgLength: Math.round(avgLengthFt * 10) / 10,
      minLength: Math.round(minLengthFt * 10) / 10,
      maxLength: Math.round(maxLengthFt * 10) / 10,
      sizeSegments: segments,
      priceTier: classifyPriceTier(avgPrice),
      avgPrice: avgPrice !== null ? Math.round(avgPrice) : null,
      minPrice: minPrice !== null ? Math.round(minPrice) : null,
      maxPrice: maxPrice !== null ? Math.round(maxPrice) : null,
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
  const [positions, segmentCoverage, pricePositioning, quadrants] = await Promise.all([
    getManufacturerPositions(),
    getSegmentCoverage(),
    getPricePositioning(),
    getPositioningQuadrants(),
  ]);

  const totalYachts = positions.reduce((sum, m) => sum + m.fleetSize, 0);

  const mostDiverse = positions.length > 0
    ? [...positions].sort((a, b) => b.breadthScore - a.breadthScore)[0]?.manufacturerName || null
    : null;
  const largestFleet = positions.length > 0
    ? [...positions].sort((a, b) => b.fleetSize - a.fleetSize)[0]?.manufacturerName || null
    : null;
  const premiumLeader = positions.filter((m) => m.avgPrice !== null).length > 0
    ? [...positions].filter((m) => m.avgPrice !== null).sort((a, b) => (b.avgPrice || 0) - (a.avgPrice || 0))[0]?.manufacturerName || null
    : null;

  return {
    manufacturers: positions,
    segmentCoverage,
    pricePositioning,
    quadrants,
    totalManufacturers: positions.length,
    totalYachts,
    mostDiverse,
    largestFleet,
    premiumLeader,
  };
}
