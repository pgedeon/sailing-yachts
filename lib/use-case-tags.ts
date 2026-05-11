/**
 * Use-case tag assignment for sailing yachts.
 *
 * Tags are assigned purely from spec heuristics (no human curation needed).
 * Each yacht can have zero or more tags. Tags are computed at runtime from
 * the raw spec data so no DB migration is required.
 *
 * Tag IDs are stable strings used for filtering & URLs.
 * Display labels come from i18n messages (Yachts.useCaseTags.*).
 */

// ─── Tag definitions ─────────────────────────────────────────────────

export const USE_CASE_TAG_IDS = [
  'bluewater-cruiser',
  'weekend-sailor',
  'racing',
  'liveaboard',
  'family-cruiser',
  'light-wind-performer',
] as const;

export type UseCaseTagId = (typeof USE_CASE_TAG_IDS)[number];

export interface UseCaseTagMeta {
  id: UseCaseTagId;
  color: string;        // Tailwind bg class
  textColor: string;    // Tailwind text class
  borderColor: string;  // Tailwind border class
}

export const USE_CASE_TAG_META: Record<UseCaseTagId, UseCaseTagMeta> = {
  'bluewater-cruiser': {
    id: 'bluewater-cruiser',
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
  },
  'weekend-sailor': {
    id: 'weekend-sailor',
    color: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
  },
  racing: {
    id: 'racing',
    color: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
  },
  liveaboard: {
    id: 'liveaboard',
    color: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
  },
  'family-cruiser': {
    id: 'family-cruiser',
    color: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
  },
  'light-wind-performer': {
    id: 'light-wind-performer',
    color: 'bg-cyan-100',
    textColor: 'text-cyan-800',
    borderColor: 'border-cyan-200',
  },
};

// ─── Input type (subset of yacht spec fields) ────────────────────────

export interface YachtSpecForTags {
  lengthOverall: number | null;   // meters
  beam: number | null;            // meters
  draft: number | null;           // meters
  displacement: number | null;    // kg
  ballast: number | null;         // kg
  sailAreaMain: number | null;    // m²
  cabins: number | null;
  berths: number | null;
  rigType: string | null;
  keelType: string | null;
}

// ─── Thresholds (tweakable) ──────────────────────────────────────────

const THRESHOLDS = {
  // Bluewater: heavy, long, deep keel
  bluewater: {
    minLOA: 10.5,          // ~35ft
    minDisplacement: 5000, // 5 tonnes
    minBallastRatio: 0.30, // 30% ballast ratio
  },
  // Racing: light, high SA/D, fin keel
  racing: {
    maxDLRatio: 200,       // D/L ratio (low = light)
    minSADRatio: 18,       // SA/D ratio (high = powered up)
  },
  // Liveaboard: big, many cabins/berths
  liveaboard: {
    minLOA: 11,            // ~36ft
    minCabins: 3,
  },
  // Family cruiser: moderate size, multiple cabins
  family: {
    minLOA: 9,             // ~30ft
    maxLOA: 14,            // ~46ft
    minCabins: 2,
  },
  // Weekend sailor: small, simple
  weekend: {
    maxLOA: 10,            // ~33ft
  },
  // Light wind performer: high SA/D, light
  lightWind: {
    minSADRatio: 17,
    maxDisplacement: 6000,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────

function displacementLengthRatio(displacementKg: number, loaM: number): number | null {
  if (loaM <= 0) return null;
  const dispLongTons = displacementKg / 1018;
  const lwlFt = loaM / 0.3054; // approximate LWL ~ LOA for this heuristic
  const denom = Math.pow(lwlFt / 100, 3);
  if (denom === 0) return null;
  return dispLongTons / denom;
}

function sailAreaDisplacementRatio(sailAreaM2: number, displacementKg: number): number | null {
  if (displacementKg <= 0) return null;
  const dispLongTons = displacementKg / 1018;
  return sailAreaM2 / Math.pow(dispLongTons, 2 / 3);
}

function ballastRatio(ballastKg: number, displacementKg: number): number | null {
  if (displacementKg <= 0) return null;
  return ballastKg / displacementKg;
}

// ─── Tag assignment ──────────────────────────────────────────────────

/**
 * Assign use-case tags to a yacht based on its specs.
 *
 * Tags are intentionally overlapping — a yacht can be both a
 * "bluewater-cruiser" and a "liveaboard". Order is deterministic
 * (matches USE_CASE_TAG_IDS) so tests are stable.
 */
export function assignUseCaseTags(spec: YachtSpecForTags): UseCaseTagId[] {
  const tags: UseCaseTagId[] = [];

  const loa = spec.lengthOverall;
  const disp = spec.displacement;
  const ballast = spec.ballast;
  const sailArea = spec.sailAreaMain;
  const cabins = spec.cabins;

  // ── Bluewater Cruiser ──
  // Heavier displacement, longer hull, high ballast ratio for stability
  if (loa != null && disp != null) {
    const meetsLOA = loa >= THRESHOLDS.bluewater.minLOA;
    const meetsDisp = disp >= THRESHOLDS.bluewater.minDisplacement;
    const br = ballast != null && disp > 0 ? ballastRatio(ballast, disp) : null;
    const meetsBallast = br != null ? br >= THRESHOLDS.bluewater.minBallastRatio : false;
    // Need at least LOA + displacement, plus either ballast data or deep keel hint
    if (meetsLOA && meetsDisp && (meetsBallast || (spec.keelType && /fin|long|full/i.test(spec.keelType)))) {
      tags.push('bluewater-cruiser');
    }
  }

  // ── Weekend Sailor ──
  // Compact yachts, easy to handle short-handed
  if (loa != null && loa <= THRESHOLDS.weekend.maxLOA) {
    // Don't tag if it's also bluewater (those are serious cruisers)
    if (!tags.includes('bluewater-cruiser')) {
      tags.push('weekend-sailor');
    }
  }

  // ── Racing ──
  // Light for its length (low D/L) and high sail area (high SA/D)
  if (disp != null && loa != null && sailArea != null) {
    const dl = displacementLengthRatio(disp, loa);
    const sad = sailAreaDisplacementRatio(sailArea, disp);
    if (dl != null && sad != null && dl <= THRESHOLDS.racing.maxDLRatio && sad >= THRESHOLDS.racing.minSADRatio) {
      tags.push('racing');
    }
  }

  // ── Liveaboard ──
  // Large with multiple cabins — meant for extended living aboard
  if (loa != null && cabins != null) {
    if (loa >= THRESHOLDS.liveaboard.minLOA && cabins >= THRESHOLDS.liveaboard.minCabins) {
      tags.push('liveaboard');
    }
  }

  // ── Family Cruiser ──
  // Moderate size with at least 2 cabins
  if (loa != null && cabins != null) {
    if (
      loa >= THRESHOLDS.family.minLOA &&
      loa <= THRESHOLDS.family.maxLOA &&
      cabins >= THRESHOLDS.family.minCabins
    ) {
      tags.push('family-cruiser');
    }
  }

  // ── Light Wind Performer ──
  // High sail area relative to weight — performs well in light air
  if (sailArea != null && disp != null) {
    const sad = sailAreaDisplacementRatio(sailArea, disp);
    if (sad != null && sad >= THRESHOLDS.lightWind.minSADRatio && disp <= THRESHOLDS.lightWind.maxDisplacement) {
      tags.push('light-wind-performer');
    }
  }

  return tags;
}

/**
 * Get the list of all available tag IDs for filter UI.
 */
export function getAllTagIds(): readonly UseCaseTagId[] {
  return USE_CASE_TAG_IDS;
}
