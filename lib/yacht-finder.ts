/**
 * Yacht Finder Wizard — scoring algorithm.
 *
 * The wizard collects user preferences across 5 dimensions and scores
 * each yacht against them. Scores are 0-100, weighted by dimension importance.
 */

// ─── Wizard answer types ─────────────────────────────────────────────

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type IntendedUse = 'coastal' | 'bluewater' | 'racing' | 'weekending';
export type CrewSize = 'solo' | 'couple' | 'small-group' | 'large-group';
export type BudgetTier = 'budget' | 'mid-range' | 'premium' | 'no-limit';
export type Priority = 'speed' | 'comfort' | 'safety' | 'value';
export type PrioritySet = Priority[];

export interface FinderAnswers {
  experience: ExperienceLevel;
  intendedUse: IntendedUse;
  crewSize: CrewSize;
  budget: BudgetTier;
  priorities: PrioritySet;
}

// ─── Yacht data needed for scoring ───────────────────────────────────

export interface YachtForScoring {
  id: number;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sailAreaMain: number | null;
  cabins: number | null;
  berths: number | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  useCaseTags: string[];
}

export interface ScoredYacht extends YachtForScoring {
  score: number;
  scoreBreakdown: ScoreBreakdown;
  manufacturer: string;
  modelName: string;
  slug: string | null;
  year: number | null;
}

export interface ScoreBreakdown {
  useMatch: number;      // 0-30 points
  sizeFit: number;       // 0-25 points
  experienceFit: number; // 0-20 points
  priorityMatch: number; // 0-25 points
}

// ─── Weights ─────────────────────────────────────────────────────────

const WEIGHTS = {
  useMatch: 30,
  sizeFit: 25,
  experienceFit: 20,
  priorityMatch: 25,
} as const;

// ─── Intended use → preferred tags mapping ───────────────────────────

const USE_TAG_MAP: Record<IntendedUse, string[]> = {
  bluewater: ['bluewater-cruiser'],
  racing: ['racing'],
  coastal: ['family-cruiser', 'weekend-sailor'],
  weekending: ['weekend-sailor', 'light-wind-performer'],
};

// ─── Crew size → ideal LOA & berths ──────────────────────────────────

const CREW_SIZE_SPEC: Record<CrewSize, { idealMinLOA: number; idealMaxLOA: number; minBerths: number }> = {
  solo: { idealMinLOA: 6, idealMaxLOA: 11, minBerths: 1 },
  couple: { idealMinLOA: 8, idealMaxLOA: 13, minBerths: 2 },
  'small-group': { idealMinLOA: 9, idealMaxLOA: 14, minBerths: 3 },
  'large-group': { idealMinLOA: 11, idealMaxLOA: 18, minBerths: 5 },
};

// ─── Budget tier → approximate price brackets ────────────────────────

// We use LOA as a proxy for price: budget seekers want smaller yachts
const BUDGET_LOA: Record<BudgetTier, { maxLOA: number }> = {
  budget: { maxLOA: 10 },
  'mid-range': { maxLOA: 13 },
  premium: { maxLOA: 16 },
  'no-limit': { maxLOA: 99 },
};

// ─── Scoring functions ───────────────────────────────────────────────

function scoreUseMatch(yacht: YachtForScoring, answers: FinderAnswers): number {
  const preferredTags = USE_TAG_MAP[answers.intendedUse];
  if (!preferredTags.length) return 15; // neutral

  const matchingTags = preferredTags.filter(tag => yacht.useCaseTags.includes(tag));
  const ratio = matchingTags.length / preferredTags.length;

  // Exact match = full points, partial = scaled, none = small base
  if (ratio >= 1) return WEIGHTS.useMatch;
  if (ratio > 0) return Math.round(WEIGHTS.useMatch * 0.6);
  return Math.round(WEIGHTS.useMatch * 0.15);
}

function scoreSizeFit(yacht: YachtForScoring, answers: FinderAnswers): number {
  const spec = CREW_SIZE_SPEC[answers.crewSize];
  const loa = yacht.lengthOverall;
  const berths = yacht.berths;

  if (loa == null) return 5;

  // LOA fit (0-15 points)
  let loaScore = 0;
  if (loa >= spec.idealMinLOA && loa <= spec.idealMaxLOA) {
    loaScore = 15; // perfect fit
  } else if (loa < spec.idealMinLOA) {
    const diff = spec.idealMinLOA - loa;
    loaScore = Math.max(0, 15 - diff * 3);
  } else {
    const diff = loa - spec.idealMaxLOA;
    loaScore = Math.max(0, 15 - diff * 2);
  }

  // Berth fit (0-10 points)
  let berthScore = 5; // neutral if unknown
  if (berths != null) {
    if (berths >= spec.minBerths) {
      berthScore = 10;
    } else {
      berthScore = Math.max(0, 10 - (spec.minBerths - berths) * 3);
    }
  }

  return Math.round(Math.min(WEIGHTS.sizeFit, loaScore + berthScore));
}

function scoreExperienceFit(yacht: YachtForScoring, answers: FinderAnswers): number {
  // Beginners: simpler rigs (sloop), smaller boats, fin/lifting keel
  // Advanced: any rig/keel, comfortable with larger boats
  const loa = yacht.lengthOverall;
  const rigType = yacht.rigType;
  const keelType = yacht.keelType;

  if (loa == null) return 10;

  let score = 0;

  switch (answers.experience) {
    case 'beginner':
      // Prefer sloop rig (simplest)
      if (rigType === 'Sloop') score += 8;
      else if (rigType === 'Cutter') score += 4;
      else score += 2;
      // Prefer smaller boats
      if (loa <= 10) score += 8;
      else if (loa <= 12) score += 4;
      else score += 1;
      // Prefer fin/lifting keel (easier handling)
      if (keelType && /fin|lifting|swing/i.test(keelType)) score += 4;
      else score += 1;
      break;

    case 'intermediate':
      // Comfortable with any rig
      score += 6;
      // Good range 8-14m
      if (loa >= 8 && loa <= 14) score += 10;
      else score += 4;
      // Any keel
      score += 4;
      break;

    case 'advanced':
      // Advanced sailors are comfortable with anything
      // Slight bonus for more complex setups
      if (rigType === 'Ketch' || rigType === 'Cutter') score += 8;
      else score += 6;
      if (loa >= 10) score += 10;
      else score += 6;
      if (keelType && /long|full/i.test(keelType)) score += 4;
      else score += 3;
      break;
  }

  return Math.round(Math.min(WEIGHTS.experienceFit, score));
}

function scorePriorityMatch(yacht: YachtForScoring, answers: FinderAnswers): number {
  if (answers.priorities.length === 0) return 12; // neutral

  const loa = yacht.lengthOverall;
  const disp = yacht.displacement;
  const ballast = yacht.ballast;
  const sailArea = yacht.sailAreaMain;

  let totalPoints = 0;
  const prioCount = answers.priorities.length;

  for (const priority of answers.priorities) {
    let points = 0;

    switch (priority) {
      case 'speed':
        // Light displacement + high sail area = speed
        if (disp != null && loa != null && disp > 0) {
          const dlRatio = disp / (1018 * Math.pow(loa / 30.48, 3));
          if (dlRatio <= 150) points = 5;
          else if (dlRatio <= 250) points = 3;
          else points = 1;
        } else {
          points = 2;
        }
        if (yacht.useCaseTags.includes('racing')) points += 3;
        break;

      case 'comfort':
        // More cabins/berths = more comfort
        const cabins = yacht.cabins ?? 0;
        if (cabins >= 3) points = 5;
        else if (cabins >= 2) points = 3;
        else points = 1;
        if (yacht.useCaseTags.includes('liveaboard')) points += 3;
        break;

      case 'safety':
        // High ballast ratio + heavy displacement = safety
        if (ballast != null && disp != null && disp > 0) {
          const br = ballast / disp;
          if (br >= 0.35) points = 5;
          else if (br >= 0.25) points = 3;
          else points = 1;
        } else {
          points = 2;
        }
        if (yacht.useCaseTags.includes('bluewater-cruiser')) points += 3;
        break;

      case 'value':
        // Smaller, simpler boats = better value
        if (loa != null) {
          if (loa <= 10) points = 5;
          else if (loa <= 12) points = 4;
          else if (loa <= 14) points = 2;
          else points = 1;
        } else {
          points = 2;
        }
        // Sloop rig = simpler = value
        if (yacht.rigType === 'Sloop') points += 2;
        break;
    }

    totalPoints += Math.min(8, points);
  }

  // Normalize: each priority can contribute up to 8 points, max total per prio = 25/count
  const maxPerPrio = WEIGHTS.priorityMatch / prioCount;
  const rawPerPrio = 8; // max possible per priority
  const normalized = (totalPoints / prioCount) / rawPerPrio * maxPerPrio;

  return Math.round(Math.min(WEIGHTS.priorityMatch, Math.max(0, normalized)));
}

// ─── Main scoring function ───────────────────────────────────────────

/**
 * Score a yacht against the wizard answers.
 * Returns 0-100 with a breakdown by dimension.
 */
export function scoreYacht(yacht: YachtForScoring, answers: FinderAnswers): { score: number; breakdown: ScoreBreakdown } {
  const useMatch = scoreUseMatch(yacht, answers);
  const sizeFit = scoreSizeFit(yacht, answers);
  const experienceFit = scoreExperienceFit(yacht, answers);
  const priorityMatch = scorePriorityMatch(yacht, answers);

  const score = useMatch + sizeFit + experienceFit + priorityMatch;

  return {
    score: Math.min(100, score),
    breakdown: { useMatch, sizeFit, experienceFit, priorityMatch },
  };
}

/**
 * Score and rank all yachts against wizard answers.
 * Returns sorted by score descending, with only yachts scoring >= 20.
 */
export function rankYachts(yachts: YachtForScoring[], answers: FinderAnswers): ScoredYacht[] {
  return yachts
    .map(yacht => {
      const { score, breakdown } = scoreYacht(yacht, answers);
      return {
        ...yacht,
        score,
        scoreBreakdown: breakdown,
      } as ScoredYacht;
    })
    .filter(y => y.score >= 20)
    .sort((a, b) => b.score - a.score);
}

// ─── Wizard step definitions ─────────────────────────────────────────

export const WIZARD_STEPS = [
  { id: 'experience', titleKey: 'finder.steps.experience' },
  { id: 'intendedUse', titleKey: 'finder.steps.intendedUse' },
  { id: 'crewSize', titleKey: 'finder.steps.crewSize' },
  { id: 'budget', titleKey: 'finder.steps.budget' },
  { id: 'priorities', titleKey: 'finder.steps.priorities' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];
