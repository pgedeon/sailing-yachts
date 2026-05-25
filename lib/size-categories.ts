/**
 * Size category definitions for programmatic SEO landing pages.
 * Categories are based on Length Overall (LOA) in meters.
 */

export interface SizeCategory {
  slug: string;
  labelEn: string;
  labelFr: string;
  loaMin: number; // inclusive, meters
  loaMax: number; // exclusive, meters
  descriptionEn: (mfr: string, count: number) => string;
  descriptionFr: (mfr: string, count: number) => string;
}

export const SIZE_CATEGORIES: SizeCategory[] = [
  {
    slug: "under-30ft",
    labelEn: "Under 30ft",
    labelFr: "Moins de 30 pieds",
    loaMin: 0,
    loaMax: 9.14,
    descriptionEn: (mfr, count) =>
      `Explore ${count} ${mfr} sailboats under 30 feet. Compact cruisers ideal for coastal sailing, weekend trips, and solo sailing with manageable handling characteristics.`,
    descriptionFr: (mfr, count) =>
      `Découvrez ${count} voiliers ${mfr} de moins de 30 pieds. Des croiseurs compacts idéaux pour la navigation côtière, les sorties week-end et la navigation en solitaire.`,
  },
  {
    slug: "30-35ft",
    labelEn: "30–35ft",
    labelFr: "30–35 pieds",
    loaMin: 9.14,
    loaMax: 10.67,
    descriptionEn: (mfr, count) =>
      `Browse ${count} ${mfr} sailboats between 30 and 35 feet. The sweet spot for family cruising — spacious enough for comfortable week-long charters yet easy to handle shorthanded.`,
    descriptionFr: (mfr, count) =>
      `Parcourez ${count} voiliers ${mfr} entre 30 et 35 pieds. La taille idéale pour la croisière familiale — assez spacieux pour des locations d'une semaine et facile à manœuvrer en équipage réduit.`,
  },
  {
    slug: "35-40ft",
    labelEn: "35–40ft",
    labelFr: "35–40 pieds",
    loaMin: 10.67,
    loaMax: 12.19,
    descriptionEn: (mfr, count) =>
      `Discover ${count} ${mfr} sailboats between 35 and 40 feet. Popular mid-size cruisers offering excellent balance between performance, comfort, and liveaboard capability.`,
    descriptionFr: (mfr, count) =>
      `Découvrez ${count} voiliers ${mfr} entre 35 et 40 pieds. Des croiseurs mi-size populaires offrant un excellent équilibre entre performance, confort et capacité d'habitation.`,
  },
  {
    slug: "40-45ft",
    labelEn: "40–45ft",
    labelFr: "40–45 pieds",
    loaMin: 12.19,
    loaMax: 13.72,
    descriptionEn: (mfr, count) =>
      `View ${count} ${mfr} sailboats between 40 and 45 feet. Premium bluewater-capable cruisers with generous accommodation, advanced sail plans, and serious offshore capability.`,
    descriptionFr: (mfr, count) =>
      `Consultez ${count} voiliers ${mfr} entre 40 et 45 pieds. Des croiseurs premium capables de grands voyages avec un logement généreux et de vraies capacités hauturières.`,
  },
  {
    slug: "45-50ft",
    labelEn: "45–50ft",
    labelFr: "45–50 pieds",
    loaMin: 13.72,
    loaMax: 15.24,
    descriptionEn: (mfr, count) =>
      `Explore ${count} ${mfr} sailboats between 45 and 50 feet. Luxury performance cruisers designed for extended bluewater voyaging with premium finishes and state-of-the-art systems.`,
    descriptionFr: (mfr, count) =>
      `Explorez ${count} voiliers ${mfr} entre 45 et 50 pieds. Des croiseurs de luxe performants conçus pour les grands voyages avec des finitions premium.`,
  },
  {
    slug: "over-50ft",
    labelEn: "Over 50ft",
    labelFr: "Plus de 50 pieds",
    loaMin: 15.24,
    loaMax: 999,
    descriptionEn: (mfr, count) =>
      `Browse ${count} ${mfr} sailboats over 50 feet. Large-format cruisers and performance yachts offering superyacht-level comfort with exceptional sailing characteristics.`,
    descriptionFr: (mfr, count) =>
      `Parcourez ${count} voiliers ${mfr} de plus de 50 pieds. De grands croiseurs offrant un confort de niveau superyacht avec des caractéristiques de navigation exceptionnelles.`,
  },
];

/**
 * Lookup a size category by slug.
 */
export function getSizeCategory(slug: string): SizeCategory | undefined {
  return SIZE_CATEGORIES.find((c) => c.slug === slug);
}

/**
 * Get all valid size category slugs.
 */
export function getSizeCategorySlugs(): string[] {
  return SIZE_CATEGORIES.map((c) => c.slug);
}

/**
 * Determine the size category for a given LOA in meters.
 */
export function getSizeCategoryForLoa(loa: number): SizeCategory | undefined {
  return SIZE_CATEGORIES.find((c) => loa >= c.loaMin && loa < c.loaMax);
}
