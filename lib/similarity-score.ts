/**
 * Weighted similarity scoring for "Yachts like this" recommendations.
 *
 * Multi-factor similarity considering:
 *   - LOA proximity (±15%)        → 25 pts
 *   - Use-case tag overlap        → 20 pts
 *   - Rig & keel type match       → 20 pts
 *   - D/L ratio similarity        → 20 pts
 *   - Price tier match            → 15 pts
 *
 * Total max: 100 points.
 * Threshold: yachts scoring < 15 are excluded.
 */

import { assignUseCaseTags, type UseCaseTagId, type YachtSpecForTags } from './use-case-tags';

// ─── Types ───────────────────────────────────────────────────────────

export interface YachtForSimilarity {
  id: number;
  modelName: string;
  slug: string | null;
  manufacturer: string | null;
  year: number;
  lengthOverall: string | null;
  beam: string | null;
  draft: string | null;
  displacement: string | null;
  ballast: string | null;
  sailAreaMain: string | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | null;
  berths: number | null;
}

export interface MatchFactor {
  key: string;
  label: string;        // i18n key
  score: number;        // 0-max
  max: number;
  detail: string;       // Human-readable explanation
}

export interface SimilarityResult {
  yacht: YachtForSimilarity;
  score: number;        // 0-100
  factors: MatchFactor[];
  primaryImage: string | null;
}

// ─── Weights ─────────────────────────────────────────────────────────

const W = {
  loaProximity: 25,
  useCaseOverlap: 20,
  rigKeelMatch: 20,
  dlRatioSimilarity: 20,
  priceTierMatch: 15,
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────

function num(v: string | number | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function displacementLengthRatio(displacementKg: number, loaM: number): number | null {
  if (loaM <= 0) return null;
  const dispLongTons = displacementKg / 1018;
  const lwlFt = loaM / 0.3054; // approximate LWL ~ LOA
  const denom = Math.pow(lwlFt / 100, 3);
  if (denom === 0) return null;
  return dispLongTons / denom;
}

type PriceTier = 'small' | 'mid' | 'large' | 'premium';

function priceTier(loa: number | null, disp: number | null): PriceTier {
  if (loa == null) return 'mid';
  if (loa < 10) return 'small';
  if (loa < 13) return 'mid';
  if (loa < 16) return 'large';
  return 'premium';
}

function toTagSpec(y: YachtForSimilarity): YachtSpecForTags {
  return {
    lengthOverall: num(y.lengthOverall),
    beam: num(y.beam),
    draft: num(y.draft),
    displacement: num(y.displacement),
    ballast: num(y.ballast),
    sailAreaMain: num(y.sailAreaMain),
    cabins: y.cabins,
    berths: y.berths,
    rigType: y.rigType,
    keelType: y.keelType,
  };
}

// ─── Scoring functions ───────────────────────────────────────────────

function scoreLoaProximity(src: YachtForSimilarity, cand: YachtForSimilarity): MatchFactor {
  const srcLoa = num(src.lengthOverall);
  const candLoa = num(cand.lengthOverall);
  const max = W.loaProximity;

  if (srcLoa == null || candLoa == null) {
    return { key: 'loa', label: 'similarFactors.loa', score: 5, max, detail: 'LOA data unavailable' };
  }

  const diff = Math.abs(srcLoa - candLoa) / srcLoa;
  let score: number;
  let detail: string;

  if (diff <= 0.05) {
    score = max;
    detail = `Nearly identical length (${candLoa.toFixed(1)}m vs ${srcLoa.toFixed(1)}m)`;
  } else if (diff <= 0.10) {
    score = Math.round(max * 0.85);
    detail = `Very similar length (${candLoa.toFixed(1)}m vs ${srcLoa.toFixed(1)}m)`;
  } else if (diff <= 0.15) {
    score = Math.round(max * 0.65);
    detail = `Similar length (${candLoa.toFixed(1)}m vs ${srcLoa.toFixed(1)}m)`;
  } else if (diff <= 0.25) {
    score = Math.round(max * 0.35);
    detail = `Slightly different length (${candLoa.toFixed(1)}m vs ${srcLoa.toFixed(1)}m)`;
  } else if (diff <= 0.40) {
    score = Math.round(max * 0.15);
    detail = `Different size class (${candLoa.toFixed(1)}m vs ${srcLoa.toFixed(1)}m)`;
  } else {
    score = 0;
    detail = `Very different length (${candLoa.toFixed(1)}m vs ${srcLoa.toFixed(1)}m)`;
  }

  return { key: 'loa', label: 'similarFactors.loa', score, max, detail };
}

function scoreUseCaseOverlap(
  srcTags: UseCaseTagId[],
  candTags: UseCaseTagId[],
): MatchFactor {
  const max = W.useCaseOverlap;

  if (srcTags.length === 0 && candTags.length === 0) {
    return { key: 'useCase', label: 'similarFactors.useCase', score: 5, max, detail: 'No use-case tags assigned' };
  }

  const srcSet = new Set(srcTags);
  const candSet = new Set(candTags);
  const intersection = srcTags.filter(t => candSet.has(t));

  if (intersection.length === 0) {
    return {
      key: 'useCase',
      label: 'similarFactors.useCase',
      score: 0,
      max,
      detail: `No shared use-case tags`,
    };
  }

  // Jaccard-like: intersection / union
  const union = new Set([...srcTags, ...candTags]);
  const ratio = intersection.length / union.size;
  const score = Math.round(max * ratio);

  const tagNames = intersection.join(', ');
  return {
    key: 'useCase',
    label: 'similarFactors.useCase',
    score,
    max,
    detail: `${intersection.length} shared tag(s): ${tagNames}`,
  };
}

function scoreRigKeelMatch(src: YachtForSimilarity, cand: YachtForSimilarity): MatchFactor {
  const max = W.rigKeelMatch;
  let score = 0;
  const reasons: string[] = [];

  // Rig type match (10 pts)
  const srcRig = src.rigType?.toLowerCase() ?? '';
  const candRig = cand.rigType?.toLowerCase() ?? '';
  if (srcRig && candRig) {
    if (srcRig === candRig) {
      score += 10;
      reasons.push(`Same rig (${src.rigType})`);
    } else if (
      (srcRig.includes('sloop') && candRig.includes('cutter')) ||
      (srcRig.includes('cutter') && candRig.includes('sloop'))
    ) {
      score += 6;
      reasons.push(`Similar rig type`);
    } else {
      score += 1;
      reasons.push(`Different rig (${src.rigType} vs ${cand.rigType})`);
    }
  } else {
    score += 3;
  }

  // Keel type match (10 pts)
  const srcKeel = src.keelType?.toLowerCase() ?? '';
  const candKeel = cand.keelType?.toLowerCase() ?? '';
  if (srcKeel && candKeel) {
    if (srcKeel === candKeel) {
      score += 10;
      reasons.push(`Same keel (${src.keelType})`);
    } else if (
      (srcKeel.includes('fin') && candKeel.includes('fin')) ||
      (srcKeel.includes('long') && candKeel.includes('long')) ||
      (srcKeel.includes('lifting') && candKeel.includes('swing')) ||
      (srcKeel.includes('swing') && candKeel.includes('lifting'))
    ) {
      score += 7;
      reasons.push(`Similar keel type`);
    } else {
      score += 2;
    }
  } else {
    score += 3;
  }

  return {
    key: 'rigKeel',
    label: 'similarFactors.rigKeel',
    score: Math.min(max, score),
    max,
    detail: reasons.join('; '),
  };
}

function scoreDLRatio(src: YachtForSimilarity, cand: YachtForSimilarity): MatchFactor {
  const max = W.dlRatioSimilarity;
  const srcLoa = num(src.lengthOverall);
  const srcDisp = num(src.displacement);
  const candLoa = num(cand.lengthOverall);
  const candDisp = num(cand.displacement);

  if (srcLoa == null || srcDisp == null || candLoa == null || candDisp == null) {
    return { key: 'dlRatio', label: 'similarFactors.dlRatio', score: 3, max, detail: 'Insufficient data for D/L comparison' };
  }

  const srcDL = displacementLengthRatio(srcDisp, srcLoa);
  const candDL = displacementLengthRatio(candDisp, candLoa);

  if (srcDL == null || candDL == null || srcDL === 0) {
    return { key: 'dlRatio', label: 'similarFactors.dlRatio', score: 3, max, detail: 'Cannot compute D/L ratio' };
  }

  const diff = Math.abs(srcDL - candDL) / srcDL;

  let score: number;
  let detail: string;

  if (diff <= 0.1) {
    score = max;
    detail = `Very similar performance (D/L ${candDL.toFixed(0)} vs ${srcDL.toFixed(0)})`;
  } else if (diff <= 0.25) {
    score = Math.round(max * 0.75);
    detail = `Similar performance (D/L ${candDL.toFixed(0)} vs ${srcDL.toFixed(0)})`;
  } else if (diff <= 0.5) {
    score = Math.round(max * 0.45);
    detail = `Somewhat different performance (D/L ${candDL.toFixed(0)} vs ${srcDL.toFixed(0)})`;
  } else {
    score = Math.round(max * 0.1);
    detail = `Different performance character (D/L ${candDL.toFixed(0)} vs ${srcDL.toFixed(0)})`;
  }

  return { key: 'dlRatio', label: 'similarFactors.dlRatio', score, max, detail };
}

function scorePriceTier(src: YachtForSimilarity, cand: YachtForSimilarity): MatchFactor {
  const max = W.priceTierMatch;
  const srcTier = priceTier(num(src.lengthOverall), num(src.displacement));
  const candTier = priceTier(num(cand.lengthOverall), num(cand.displacement));

  // Define tier adjacency
  const tierOrder: PriceTier[] = ['small', 'mid', 'large', 'premium'];
  const srcIdx = tierOrder.indexOf(srcTier);
  const candIdx = tierOrder.indexOf(candTier);
  const gap = Math.abs(srcIdx - candIdx);

  let score: number;
  let detail: string;

  if (gap === 0) {
    score = max;
    detail = `Same price tier (${srcTier})`;
  } else if (gap === 1) {
    score = Math.round(max * 0.5);
    detail = `Adjacent price tier (${candTier} vs ${srcTier})`;
  } else {
    score = 0;
    detail = `Different price tier (${candTier} vs ${srcTier})`;
  }

  return { key: 'priceTier', label: 'similarFactors.priceTier', score, max, detail };
}

// ─── Main scoring function ───────────────────────────────────────────

const MIN_SCORE_THRESHOLD = 15;
const MAX_RESULTS = 6;

/**
 * Score a candidate yacht against a source yacht for similarity.
 * Returns 0-100 with factor breakdown.
 */
export function scoreSimilarity(
  source: YachtForSimilarity,
  candidate: YachtForSimilarity,
): { score: number; factors: MatchFactor[] } {
  const srcTags = assignUseCaseTags(toTagSpec(source));
  const candTags = assignUseCaseTags(toTagSpec(candidate));

  const loa = scoreLoaProximity(source, candidate);
  const useCase = scoreUseCaseOverlap(srcTags, candTags);
  const rigKeel = scoreRigKeelMatch(source, candidate);
  const dlRatio = scoreDLRatio(source, candidate);
  const priceTier = scorePriceTier(source, candidate);

  const factors = [loa, useCase, rigKeel, dlRatio, priceTier];
  const score = Math.min(100, factors.reduce((sum, f) => sum + f.score, 0));

  return { score, factors };
}

/**
 * Rank all candidate yachts by similarity to the source.
 * Returns sorted by score descending, limited to MAX_RESULTS,
 * excluding yachts below MIN_SCORE_THRESHOLD.
 */
export function rankSimilarYachts(
  source: YachtForSimilarity,
  candidates: YachtForSimilarity[],
): Array<{ yacht: YachtForSimilarity; score: number; factors: MatchFactor[] }> {
  return candidates
    .filter(c => c.id !== source.id)
    .map(candidate => {
      const { score, factors } = scoreSimilarity(source, candidate);
      return { yacht: candidate, score, factors };
    })
    .filter(r => r.score >= MIN_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);
}
