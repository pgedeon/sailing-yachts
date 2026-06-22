/**
 * Data layer for "Best [year] [size] sailboats" editorial pages.
 * Route: /yachts/best/[year]/[sizeCategory]
 */

import { db, yachtModels, manufacturers } from "@/lib/db";
import { eq, and, sql, count, desc } from "drizzle-orm";
import { SIZE_CATEGORIES, type SizeCategory } from "@/lib/size-categories";
import type { YachtListItem } from "@/lib/yachts";
import { slugify } from "@/lib/utils/slugify";
import { safeDataFetch } from "@/lib/build-safe";

/** Supported editorial years. */
export const EDITORIAL_YEARS = [2024, 2025, 2026] as const;
export type EditorialYear = (typeof EDITORIAL_YEARS)[number];

export interface BestYearSizePageData {
  year: number;
  sizeCategory: SizeCategory;
  yachts: YachtListItem[];
  topManufacturers: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
  otherSizes: Array<{
    slug: string;
    labelEn: string;
    labelFr: string;
    count: number;
  }>;
  otherYears: Array<{
    year: number;
    count: number;
  }>;
}

/** Editorial content per size category for the "best of" pages. */
export interface EditorialContent {
  titleEn: (year: number, sizeLabel: string) => string;
  titleFr: (year: number, sizeLabel: string) => string;
  introEn: (year: number, count: number) => string;
  introFr: (year: number, count: number) => string;
  conclusionEn: string;
  conclusionFr: string;
}

export const EDITORIAL_CONTENT: Record<string, EditorialContent> = {
  "under-30ft": {
    titleEn: (year, sizeLabel) => `Best ${sizeLabel} Sailboats of ${year}`,
    titleFr: (year, sizeLabel) => `Meilleurs voiliers ${sizeLabel} de ${year}`,
    introEn: (year, count) =>
      `Our editors select the ${count} best sailboats under 30 feet for ${year}. Compact, affordable, and endlessly fun — these pocket cruisers are perfect for weekend adventures, solo sailing, and exploring hidden coves. We evaluate each model on build quality, sailing performance, and value for money.`,
    introFr: (year, count) =>
      `Notre sélection des ${count} meilleurs voiliers de moins de 30 pieds pour ${year}. Compacts, abordables et passionnants — ces petits croiseurs sont parfaits pour les aventures du week-end, la navigation en solitaire et l'exploration des criques cachées.`,
    conclusionEn:
      "Small sailboats deliver big adventures. Whether you're a first-time buyer or a seasoned sailor looking for a nimble daysailer, these under-30ft models offer the best combination of quality, performance, and value in the current market.",
    conclusionFr:
      "Les petits voiliers offrent de grandes aventures. Que vous soyez un premier acheteur ou un marin chevronné à la recherche d'un dayboat maniable, ces modèles de moins de 30 pieds offrent le meilleur rapport qualité-prix du marché actuel.",
  },
  "30-35ft": {
    titleEn: (year, sizeLabel) => `Best ${sizeLabel} Sailboats of ${year}`,
    titleFr: (year, sizeLabel) => `Meilleurs voiliers ${sizeLabel} de ${year}`,
    introEn: (year, count) =>
      `Discover the ${count} best sailboats between 30 and 35 feet for ${year}. This size range is the sweet spot for family cruising — spacious enough for week-long charters, easy to handle shorthanded, and affordable to maintain. Our editorial team rates each model on comfort, seaworthiness, and owner satisfaction.`,
    introFr: (year, count) =>
      `Découvrez les ${count} meilleurs voiliers entre 30 et 35 pieds pour ${year}. Cette taille est idéale pour la croisière familiale — assez spacieux pour des charters d'une semaine, facile à manœuvrer en équipage réduit et abordable à l'entretien.`,
    conclusionEn:
      "The 30-35 foot range remains the most popular segment for good reason. These boats strike the perfect balance between cruising comfort and sailing pleasure, making them ideal for coastal exploration and island-hopping adventures.",
    conclusionFr:
      "La gamme 30-35 pieds reste le segment le plus populaire pour de bonnes raisons. Ces bateaux offrent le parfait équilibre entre confort de croisière et plaisir de la navigation.",
  },
  "35-40ft": {
    titleEn: (year, sizeLabel) => `Best ${sizeLabel} Sailboats of ${year}`,
    titleFr: (year, sizeLabel) => `Meilleurs voiliers ${sizeLabel} de ${year}`,
    introEn: (year, count) =>
      `Our top ${count} sailboats between 35 and 40 feet for ${year}. This is where cruising gets serious — with generous accommodation, solid offshore capability, and performance that keeps experienced sailors engaged. We assess build quality, sail plans, and liveaboard comfort.`,
    introFr: (year, count) =>
      `Notre top ${count} des voiliers entre 35 et 40 pieds pour ${year}. C'est ici que la croisière devient sérieuse — avec un logement généreux, de solides capacités hauturières et des performances qui ravissent les marins expérimentés.`,
    conclusionEn:
      "Mid-size cruisers in the 35-40 foot range offer an exceptional blend of performance and comfort. Whether crossing oceans or exploring the Mediterranean, these yachts deliver confidence-inspiring sailing characteristics with genuine liveaboard potential.",
    conclusionFr:
      "Les croiseurs de taille moyenne entre 35 et 40 pieds offrent un mélange exceptionnel de performance et de confort. Ces yachts offrent des caractéristiques de navigation qui inspirent confiance avec un vrai potentiel d'habitation à bord.",
  },
  "40-45ft": {
    titleEn: (year, sizeLabel) => `Best ${sizeLabel} Sailboats of ${year}`,
    titleFr: (year, sizeLabel) => `Meilleurs voiliers ${sizeLabel} de ${year}`,
    introEn: (year, count) =>
      `The ${count} best sailboats between 40 and 45 feet for ${year}. Premium bluewater-capable cruisers with generous accommodation, advanced sail plans, and serious offshore capability. Our editors evaluate each model on construction quality, systems integration, and long-distance cruising potential.`,
    introFr: (year, count) =>
      `Les ${count} meilleurs voiliers entre 40 et 45 pieds pour ${year}. Des croiseurs premium capables de grands voyages avec un logement généreux et de vraies capacités hauturières.`,
    conclusionEn:
      "The 40-45 foot segment represents the pinnacle of production cruiser design. These yachts are built for serious sailing — capable of crossing oceans in comfort while remaining manageable for a couple. Expect premium finishes, advanced navigation systems, and thoughtful storage throughout.",
    conclusionFr:
      "Le segment 40-45 pieds représente le sommet du design des croiseurs de série. Ces yachts sont construits pour la navigation sérieuse — capables de traverser les océans dans le confort tout en restant gérables pour un couple.",
  },
  "45-50ft": {
    titleEn: (year, sizeLabel) => `Best ${sizeLabel} Sailboats of ${year}`,
    titleFr: (year, sizeLabel) => `Meilleurs voiliers ${sizeLabel} de ${year}`,
    introEn: (year, count) =>
      `Explore the ${count} best sailboats between 45 and 50 feet for ${year}. Luxury performance cruisers designed for extended bluewater voyaging with premium finishes and state-of-the-art systems. Each model is evaluated on build excellence, sailing performance, and long-range capability.`,
    introFr: (year, count) =>
      `Explorez les ${count} meilleurs voiliers entre 45 et 50 pieds pour ${year}. Des croiseurs de luxe performants conçus pour les grands voyages avec des finitions premium.`,
    conclusionEn:
      "At 45-50 feet, sailboats enter a realm of true luxury cruising. These yachts combine superyacht-level comfort with genuine sailing performance, making them ideal for extended voyages and liveaboard lifestyles. The investment is significant but the reward is unmatched freedom.",
    conclusionFr:
      "À 45-50 pieds, les voiliers entrent dans le domaine de la véritable croisière de luxe. Ces yachts combinent un confort de niveau superyacht avec de vraies performances de navigation.",
  },
  "over-50ft": {
    titleEn: (year, sizeLabel) => `Best ${sizeLabel} Sailboats of ${year}`,
    titleFr: (year, sizeLabel) => `Meilleurs voiliers ${sizeLabel} de ${year}`,
    introEn: (year, count) =>
      `The ${count} best sailboats over 50 feet for ${year}. Large-format cruisers and performance yachts offering superyacht-level comfort with exceptional sailing characteristics. Our editors assess each model on design innovation, build quality, and the overall ownership experience.`,
    introFr: (year, count) =>
      `Les ${count} meilleurs voiliers de plus de 50 pieds pour ${year}. De grands croiseurs offrant un confort de niveau superyacht avec des caractéristiques de navigation exceptionnelles.`,
    conclusionEn:
      "Sailboats over 50 feet represent the ultimate expression of the cruising lifestyle. These magnificent yachts offer palatial accommodation, cutting-edge technology, and the ability to cross oceans in style. For those who can afford them, they deliver an unparalleled sailing experience.",
    conclusionFr:
      "Les voiliers de plus de 50 pieds représentent l'expression ultime du style de vie en croisière. Ces yachts magnifiques offrent un logement palatial et la capacité de traverser les océans avec style.",
  },
};

/**
 * Parse and validate a year string.
 */
export function parseYear(yearStr: string): EditorialYear | null {
  const year = parseInt(yearStr, 10);
  if (EDITORIAL_YEARS.includes(year as EditorialYear)) {
    return year as EditorialYear;
  }
  return null;
}

/**
 * Fetch all data for a "best [year] [size]" editorial page.
 */
export async function getBestYearSizePageData(
  year: EditorialYear,
  sizeCategorySlug: string
): Promise<BestYearSizePageData | null> {
  return safeDataFetch(async () => {
    const sizeCategory = SIZE_CATEGORIES.find((c) => c.slug === sizeCategorySlug);
    if (!sizeCategory) return null;

    // Get yachts in this size range, preferring newer year models
    const yachts = await db
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
      .where(
        and(
          sql`${yachtModels.lengthOverall}::numeric >= ${sizeCategory.loaMin}`,
          sql`${yachtModels.lengthOverall}::numeric < ${sizeCategory.loaMax}`
        )
      )
      .orderBy(desc(yachtModels.year), yachtModels.modelName);

    if (yachts.length === 0) return null;

    // Get top manufacturers in this size range
    const mfrCounts = await db
      .select({
        name: manufacturers.name,
        cnt: count(),
      })
      .from(yachtModels)
      .innerJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(
        and(
          sql`${yachtModels.lengthOverall}::numeric >= ${sizeCategory.loaMin}`,
          sql`${yachtModels.lengthOverall}::numeric < ${sizeCategory.loaMax}`
        )
      )
      .groupBy(manufacturers.name)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const topManufacturers = mfrCounts.map((m: { name: string; cnt: number }) => ({
      name: m.name,
      slug: slugify(m.name),
      count: Number(m.cnt),
    }));

    // Get counts for other size categories
    const otherSizes = await Promise.all(
      SIZE_CATEGORIES.filter((sc) => sc.slug !== sizeCategorySlug).map(
        async (sc) => {
          const result = await db
            .select({ cnt: count() })
            .from(yachtModels)
            .innerJoin(
              manufacturers,
              eq(yachtModels.manufacturerId, manufacturers.id)
            )
            .where(
              and(
                sql`${yachtModels.lengthOverall}::numeric >= ${sc.loaMin}`,
                sql`${yachtModels.lengthOverall}::numeric < ${sc.loaMax}`
              )
            );
          return {
            slug: sc.slug,
            labelEn: sc.labelEn,
            labelFr: sc.labelFr,
            count: Number(result[0]?.cnt ?? 0),
          };
        }
      )
    );

    // Get yacht counts per other year (same size range)
    const otherYears = await Promise.all(
      EDITORIAL_YEARS.filter((y) => y !== year).map(async (y) => {
        // Count yachts with year matching or within 3 years of editorial year
        const result = await db
          .select({ cnt: count() })
          .from(yachtModels)
          .innerJoin(
            manufacturers,
            eq(yachtModels.manufacturerId, manufacturers.id)
          )
          .where(
            and(
              sql`${yachtModels.lengthOverall}::numeric >= ${sizeCategory.loaMin}`,
              sql`${yachtModels.lengthOverall}::numeric < ${sizeCategory.loaMax}`,
              sql`${yachtModels.year} >= ${y - 3}`,
              sql`${yachtModels.year} <= ${y}`
            )
          );
        return { year: y, count: Number(result[0]?.cnt ?? 0) };
      })
    );

    return {
      year,
      sizeCategory,
      yachts,
      topManufacturers,
      otherSizes,
      otherYears,
    };
  });
}


/**
 * Generate static params for all year+size combinations.
 */
export function getBestYearSizeStaticParams(): Array<{
  year: string;
  sizeCategory: string;
}> {
  const params: Array<{ year: string; sizeCategory: string }> = [];
  for (const year of EDITORIAL_YEARS) {
    for (const sc of SIZE_CATEGORIES) {
      params.push({ year: String(year), sizeCategory: sc.slug });
    }
  }
  return params;
}
