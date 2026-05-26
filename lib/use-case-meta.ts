/**
 * Use-case tag IDs and metadata.
 * Shared between client and server — no DB imports.
 */

export type UseCaseTagId =
  | "bluewater-cruiser"
  | "weekend-sailor"
  | "racing"
  | "liveaboard"
  | "family-cruiser"
  | "light-wind-performer";

export const USE_CASE_IDS: UseCaseTagId[] = [
  "bluewater-cruiser",
  "weekend-sailor",
  "racing",
  "liveaboard",
  "family-cruiser",
  "light-wind-performer",
];

export interface UseCaseMeta {
  id: UseCaseTagId;
  slug: string;
  labelEn: string;
  labelFr: string;
  emoji: string;
}

export const USE_CASES: UseCaseMeta[] = [
  {
    id: "bluewater-cruiser",
    slug: "bluewater-cruiser",
    labelEn: "Bluewater Cruising",
    labelFr: "Croisière Hauturière",
    emoji: "🌊",
  },
  {
    id: "weekend-sailor",
    slug: "weekend-sailor",
    labelEn: "Weekend Sailing",
    labelFr: "Sorties Week-end",
    emoji: "⛵",
  },
  {
    id: "racing",
    slug: "racing",
    labelEn: "Racing",
    labelFr: "Régate",
    emoji: "🏆",
  },
  {
    id: "liveaboard",
    slug: "liveaboard",
    labelEn: "Liveaboard",
    labelFr: "Habitable",
    emoji: "🏠",
  },
  {
    id: "family-cruiser",
    slug: "family-cruiser",
    labelEn: "Family Cruising",
    labelFr: "Croisière Familiale",
    emoji: "👨‍👩‍👧‍👦",
  },
  {
    id: "light-wind-performer",
    slug: "light-wind-performer",
    labelEn: "Light Wind Performance",
    labelFr: "Performance vents légers",
    emoji: "🌤️",
  },
];

export function getUseCaseMeta(slug: string): UseCaseMeta | undefined {
  return USE_CASES.find((uc) => uc.slug === slug);
}
