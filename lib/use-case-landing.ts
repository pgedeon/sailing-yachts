/**
 * Data layer for use-case landing pages.
 * Route: /yachts/for/[useCase]
 *
 * Uses the existing assignUseCaseTags heuristic from lib/use-case-tags.ts
 * to filter yachts by their computed use-case tags.
 */

import { db, yachtModels, manufacturers } from "@/lib/db";
import { eq, and, sql, count, asc } from "drizzle-orm";
import {
  USE_CASE_TAG_IDS,
  type UseCaseTagId,
  assignUseCaseTags,
  type YachtSpecForTags,
} from "@/lib/use-case-tags";
import { SIZE_CATEGORIES } from "@/lib/size-categories";
import type { YachtListItem } from "@/lib/yachts";

// ─── Use Case metadata ───────────────────────────────────────────────

export interface UseCaseMeta {
  id: UseCaseTagId;
  slug: string;
  labelEn: string;
  labelFr: string;
  descriptionEn: (count: number) => string;
  descriptionFr: (count: number) => string;
  emoji: string;
}

export const USE_CASES: UseCaseMeta[] = [
  {
    id: "bluewater-cruiser",
    slug: "bluewater-cruiser",
    labelEn: "Bluewater Cruising",
    labelFr: "Croisière Hauturière",
    descriptionEn: (n) =>
      `${n} sailboats built for long-distance ocean cruising. These yachts feature heavy displacement, high ballast ratios, and robust construction for safe offshore passages.`,
    descriptionFr: (n) =>
      `${n} voiliers conçus pour la croisière au long cours. Ces yachts disposent d'un déplacement lourd, d'un ratio de lest élevé et d'une construction robuste pour des traversées sûres.`,
    emoji: "🌊",
  },
  {
    id: "weekend-sailor",
    slug: "weekend-sailor",
    labelEn: "Weekend Sailing",
    labelFr: "Sorties Weekend",
    descriptionEn: (n) =>
      `${n} compact sailboats perfect for weekend adventures and day sailing. Easy to handle short-handed with minimal systems to maintain.`,
    descriptionFr: (n) =>
      `${n} voiliers compacts parfaits pour les aventures du week-end et la navigation à la journée. Faciles à manœuvrer en équipage réduit.`,
    emoji: "☀️",
  },
  {
    id: "racing",
    slug: "racing",
    labelEn: "Racing",
    labelFr: "Régate",
    descriptionEn: (n) =>
      `${n} performance-oriented sailboats with high sail-area-to-displacement ratios and light hulls. Built for speed and competitive sailing.`,
    descriptionFr: (n) =>
      `${n} voiliers de performance avec des ratios surface voilure/déplacement élevés et des coques légères. Conçus pour la vitesse et la compétition.`,
    emoji: "🏆",
  },
  {
    id: "liveaboard",
    slug: "liveaboard",
    labelEn: "Liveaboard",
    labelFr: "Vie à Bord",
    descriptionEn: (n) =>
      `${n} spacious sailboats designed for living aboard. Multiple cabins, generous storage, and comfortable layouts for extended stays on the water.`,
    descriptionFr: (n) =>
      `${n} voiliers spacieux conçus pour la vie à bord. Plusieurs cabines, rangements généreux et aménagements confortables pour de longs séjours.`,
    emoji: "⚓",
  },
  {
    id: "family-cruiser",
    slug: "family-cruiser",
    labelEn: "Family Cruising",
    labelFr: "Croisière en Famille",
    descriptionEn: (n) =>
      `${n} family-friendly sailboats with multiple cabins, safe cockpits, and stable handling. The ideal size range for comfortable family holidays.`,
    descriptionFr: (n) =>
      `${n} voiliers adaptés à la famille avec plusieurs cabines, cockpits sûrs et comportement stable. La taille idéale pour des vacances en famille.`,
    emoji: "👨‍👩‍👧‍👦",
  },
  {
    id: "light-wind-performer",
    slug: "light-wind-performer",
    labelEn: "Light Wind Performance",
    labelFr: "Performance Vent Léger",
    descriptionEn: (n) =>
      `${n} sailboats that excel in light air conditions. High sail area and light displacement keep you moving when others are motoring.`,
    descriptionFr: (n) =>
      `${n} voiliers qui excellent par vent léger. Surface voilure importante et déplacement léger vous maintiennent en mouvement quand les autres motorisent.`,
    emoji: "🕊️",
  },
];

export function getUseCaseMeta(slug: string): UseCaseMeta | undefined {
  return USE_CASES.find((uc) => uc.slug === slug);
}

// ─── Data types ──────────────────────────────────────────────────────

export interface UseCaseLandingData {
  useCase: UseCaseMeta;
  yachts: YachtListItem[];
  otherUseCases: Array<{
    slug: string;
    labelEn: string;
    labelFr: string;
    count: number;
  }>;
  relatedSizes: Array<{
    slug: string;
    labelEn: string;
    labelFr: string;
    count: number;
  }>;
}

// ─── Data fetching ───────────────────────────────────────────────────

/**
 * Fetch all data for a use-case landing page.
 *
 * Strategy: fetch ALL yachts, compute tags in JS using assignUseCaseTags,
 * then filter. This avoids complex SQL and leverages the existing heuristic.
 *
 * We only select the fields needed for tag assignment + display.
 */
export async function getUseCaseLandingData(
  useCaseSlug: string
): Promise<UseCaseLandingData | null> {
  const useCase = getUseCaseMeta(useCaseSlug);
  if (!useCase) return null;

  // Fetch all yachts with manufacturer info (needed for tag computation + display)
  const allYachts = await db
    .select({
      id: yachtModels.id,
      manufacturer: manufacturers.name,
      modelName: yachtModels.modelName,
      year: yachtModels.year,
      slug: yachtModels.slug,
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
      maxOccupancy: yachtModels.maxOccupancy,
      engineHp: yachtModels.engineHp,
      engineType: yachtModels.engineType,
      fuelCapacity: yachtModels.fuelCapacity,
      waterCapacity: yachtModels.waterCapacity,
      description: yachtModels.description,
    })
    .from(yachtModels)
    .innerJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .orderBy(yachtModels.modelName);

  // Compute tags for each yacht and filter
  const taggedYachts = allYachts.filter((yacht: any) => {
    const spec: YachtSpecForTags = {
      lengthOverall: parseNum(yacht.lengthOverall),
      beam: parseNum(yacht.beam),
      draft: parseNum(yacht.draft),
      displacement: parseNum(yacht.displacement),
      ballast: parseNum(yacht.ballast),
      sailAreaMain: parseNum(yacht.sailAreaMain),
      cabins: parseNum(yacht.cabins),
      berths: parseNum(yacht.berths),
      rigType: yacht.rigType,
      keelType: yacht.keelType,
    };
    const tags = assignUseCaseTags(spec);
    return tags.includes(useCase.id);
  });

  if (taggedYachts.length === 0) return null;

  // Count yachts per other use case (compute from same data)
  const otherUseCases: UseCaseLandingData["otherUseCases"] = [];
  for (const uc of USE_CASES) {
    if (uc.slug === useCaseSlug) continue;
    let cnt = 0;
    for (const yacht of allYachts) {
      const spec: YachtSpecForTags = {
        lengthOverall: parseNum(yacht.lengthOverall),
        beam: parseNum(yacht.beam),
        draft: parseNum(yacht.draft),
        displacement: parseNum(yacht.displacement),
        ballast: parseNum(yacht.ballast),
        sailAreaMain: parseNum(yacht.sailAreaMain),
        cabins: parseNum(yacht.cabins),
        berths: parseNum(yacht.berths),
        rigType: yacht.rigType,
        keelType: yacht.keelType,
      };
      const tags = assignUseCaseTags(spec);
      if (tags.includes(uc.id)) cnt++;
    }
    otherUseCases.push({
      slug: uc.slug,
      labelEn: uc.labelEn,
      labelFr: uc.labelFr,
      count: cnt,
    });
  }

  // Compute size distribution for tagged yachts
  const relatedSizes: UseCaseLandingData["relatedSizes"] = SIZE_CATEGORIES.map(
    (sc) => {
      const cnt = taggedYachts.filter((y: any) => {
        const loa = parseNum(y.lengthOverall);
        if (loa === null) return false;
        return loa >= sc.loaMin && loa < sc.loaMax;
      }).length;
      return {
        slug: sc.slug,
        labelEn: sc.labelEn,
        labelFr: sc.labelFr,
        count: cnt,
      };
    }
  ).filter((s) => s.count > 0);

  return {
    useCase,
    yachts: taggedYachts,
    otherUseCases,
    relatedSizes,
  };
}

/** Parse a DB value that might be a string (decimal column) to number or null */
function parseNum(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  const n = Number(val);
  return isNaN(n) ? null : n;
}
