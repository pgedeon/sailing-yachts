/**
 * Dynamic FAQ Generation Service (P25.5)
 *
 * Auto-generates FAQ Q&A pairs from yacht data patterns.
 * Produces FAQs per manufacturer, per size category, and a general FAQ page.
 * Includes JSON-LD FAQPage schema markup for search engine rich results.
 */

import { db, yachtModels, manufacturers } from "@/lib/db-edge";
import { eq, sql, isNotNull, and, count, avg, min, max, between } from "drizzle-orm";
import { SIZE_CATEGORIES, type SizeCategory } from "@/lib/size-categories";
import { slugify } from "@/lib/utils/slugify";

// --- Types ---

export interface FaqItem {
  question: string;
  answer: string;
  /** French translation */
  questionFr: string;
  answerFr: string;
}

export interface FaqPageData {
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  slug: string;
  faqs: FaqItem[];
  /** JSON-LD FAQPage schema */
  jsonLd: object;
}

export interface ManufacturerStats {
  name: string;
  slug: string;
  yachtCount: number;
  minLoa: number | null;
  maxLoa: number | null;
  avgLoa: number | null;
  avgCabins: number | null;
  avgBerths: number | null;
  rigTypes: Record<string, number>;
  keelTypes: Record<string, number>;
  hullMaterials: Record<string, number>;
  years: { min: number | null; max: number | null };
}

export interface SizeCategoryStats {
  category: SizeCategory;
  yachtCount: number;
  manufacturers: { name: string; count: number }[];
  avgCabins: number | null;
  avgBerths: number | null;
  rigTypes: Record<string, number>;
  keelTypes: Record<string, number>;
}

// --- Data Aggregation ---

function num(v: string | number | null): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

function fmtM(ft: number | null): string {
  if (ft === null) return "N/A";
  return `${ft.toFixed(1)}m`;
}

function fmtFt(m: number | null): string {
  if (m === null) return "N/A";
  return `${(m * 3.28084).toFixed(1)}ft`;
}

export async function getManufacturerStats(mfrName: string): Promise<ManufacturerStats | null> {
  try {
    const rows = await db
    .select({
      yachtCount: count(yachtModels.id),
      minLoa: min(yachtModels.lengthOverall),
      maxLoa: max(yachtModels.lengthOverall),
      avgLoa: avg(yachtModels.lengthOverall),
      avgCabins: avg(yachtModels.cabins),
      avgBerths: avg(yachtModels.berths),
      minYear: min(yachtModels.year),
      maxYear: max(yachtModels.year),
    })
    .from(yachtModels)
    .innerJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(eq(manufacturers.name, mfrName));

  if (!rows[0] || rows[0].yachtCount === 0) return null;

  const stats = rows[0];

  // Get rig type distribution
  const rigRows = await db
    .select({
      rigType: yachtModels.rigType,
      cnt: count(),
    })
    .from(yachtModels)
    .innerJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(and(eq(manufacturers.name, mfrName), isNotNull(yachtModels.rigType)))
    .groupBy(yachtModels.rigType)
    .orderBy(sql`count(*) DESC`);

  const keelRows = await db
    .select({
      keelType: yachtModels.keelType,
      cnt: count(),
    })
    .from(yachtModels)
    .innerJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(and(eq(manufacturers.name, mfrName), isNotNull(yachtModels.keelType)))
    .groupBy(yachtModels.keelType)
    .orderBy(sql`count(*) DESC`);

  const hullRows = await db
    .select({
      hullMaterial: yachtModels.hullMaterial,
      cnt: count(),
    })
    .from(yachtModels)
    .innerJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(and(eq(manufacturers.name, mfrName), isNotNull(yachtModels.hullMaterial)))
    .groupBy(yachtModels.hullMaterial)
    .orderBy(sql`count(*) DESC`);

  return {
    name: mfrName,
    slug: slugify(mfrName),
    yachtCount: stats.yachtCount,
    minLoa: num(stats.minLoa),
    maxLoa: num(stats.maxLoa),
    avgLoa: num(stats.avgLoa),
    avgCabins: num(stats.avgCabins),
    avgBerths: num(stats.avgBerths),
    rigTypes: Object.fromEntries(rigRows.map((r: any) => [r.rigType, r.cnt])),
    keelTypes: Object.fromEntries(keelRows.map((r: any) => [r.keelType, r.cnt])),
    hullMaterials: Object.fromEntries(hullRows.map((r: any) => [r.hullMaterial, r.cnt])),
    years: { min: stats.minYear, max: stats.maxYear },
  };
  } catch {
    return null;
  }
}

export async function getAllManufacturerSlugs(): Promise<string[]> {
  try {
    const rows = await db
      .select({ name: manufacturers.name })
      .from(manufacturers)
      .innerJoin(yachtModels, eq(yachtModels.manufacturerId, manufacturers.id))
      .groupBy(manufacturers.name)
      .having(sql`count(*) >= 3`)
      .orderBy(manufacturers.name);

    return rows.map((r: any) => slugify(r.name));
  } catch {
    return [];
  }
}

export async function getSizeCategoryStats(cat: SizeCategory): Promise<SizeCategoryStats | null> {
  try {
    const rows = await db
    .select({
      yachtCount: count(yachtModels.id),
      avgCabins: avg(yachtModels.cabins),
      avgBerths: avg(yachtModels.berths),
    })
    .from(yachtModels)
    .where(
      and(
        isNotNull(yachtModels.lengthOverall),
        sql`length_overall::numeric >= ${cat.loaMin}`,
        sql`length_overall::numeric < ${cat.loaMax}`,
      ),
    );

  if (!rows[0] || rows[0].yachtCount === 0) return null;

  // Top manufacturers in this size
  const mfrRows = await db
    .select({
      name: manufacturers.name,
      cnt: count(),
    })
    .from(yachtModels)
    .innerJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(
      and(
        isNotNull(yachtModels.lengthOverall),
        sql`length_overall::numeric >= ${cat.loaMin}`,
        sql`length_overall::numeric < ${cat.loaMax}`,
      ),
    )
    .groupBy(manufacturers.name)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  const rigRows = await db
    .select({
      rigType: yachtModels.rigType,
      cnt: count(),
    })
    .from(yachtModels)
    .where(
      and(
        isNotNull(yachtModels.lengthOverall),
        sql`length_overall::numeric >= ${cat.loaMin}`,
        sql`length_overall::numeric < ${cat.loaMax}`,
        isNotNull(yachtModels.rigType),
      ),
    )
    .groupBy(yachtModels.rigType)
    .orderBy(sql`count(*) DESC`);

  const keelRows = await db
    .select({
      keelType: yachtModels.keelType,
      cnt: count(),
    })
    .from(yachtModels)
    .where(
      and(
        isNotNull(yachtModels.lengthOverall),
        sql`length_overall::numeric >= ${cat.loaMin}`,
        sql`length_overall::numeric < ${cat.loaMax}`,
        isNotNull(yachtModels.keelType),
      ),
    )
    .groupBy(yachtModels.keelType)
    .orderBy(sql`count(*) DESC`);

  return {
    category: cat,
    yachtCount: rows[0].yachtCount,
    manufacturers: mfrRows.map((r: any) => ({ name: r.name, count: r.cnt })),
    avgCabins: num(rows[0].avgCabins),
    avgBerths: num(rows[0].avgBerths),
    rigTypes: Object.fromEntries(rigRows.map((r: any) => [r.rigType, r.cnt])),
    keelTypes: Object.fromEntries(keelRows.map((r: any) => [r.keelType, r.cnt])),
  };
  } catch {
    return null;
  }
}

// --- FAQ Generation Helpers ---

function topKeys(obj: Record<string, number>, maxItems = 3): string[] {
  return Object.entries(obj)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxItems)
    .map(([k]) => k);
}

function buildJsonLd(faqs: FaqItem[], pageUrl: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// --- Manufacturer FAQ Generation ---

export function generateManufacturerFaqs(stats: ManufacturerStats): FaqPageData {
  const faqs: FaqItem[] = [];
  const topRig = topKeys(stats.rigTypes);
  const topKeel = topKeys(stats.keelTypes);
  const topHull = topKeys(stats.hullMaterials);

  // Q1: How many models
  faqs.push({
    question: `How many sailing yacht models does ${stats.name} offer?`,
    answer: `${stats.name} currently has ${stats.yachtCount} sailing yacht models in our database, ranging from ${fmtM(stats.minLoa)} (${fmtFt(stats.minLoa)}) to ${fmtM(stats.maxLoa)} (${fmtFt(stats.maxLoa)}) in length overall.`,
    questionFr: `Combien de modèles de voiliers ${stats.name} propose-t-il ?`,
    answerFr: `${stats.name} propose actuellement ${stats.yachtCount} modèles de voiliers dans notre base de données, allant de ${fmtM(stats.minLoa)} (${fmtFt(stats.minLoa)}) à ${fmtM(stats.maxLoa)} (${fmtFt(stats.maxLoa)}) de longueur hors tout.`,
  });

  // Q2: Size range
  if (stats.avgLoa) {
    faqs.push({
      question: `What is the average length of ${stats.name} sailing yachts?`,
      answer: `The average length overall of ${stats.name} yachts in our database is approximately ${fmtM(stats.avgLoa)} (${fmtFt(stats.avgLoa)}). The range spans from ${fmtM(stats.minLoa)} to ${fmtM(stats.maxLoa)}.`,
      questionFr: `Quelle est la longueur moyenne des voiliers ${stats.name} ?`,
      answerFr: `La longueur hors tout moyenne des voiliers ${stats.name} dans notre base de données est d'environ ${fmtM(stats.avgLoa)} (${fmtFt(stats.avgLoa)}). La gamme s'étend de ${fmtM(stats.minLoa)} à ${fmtM(stats.maxLoa)}.`,
    });
  }

  // Q3: Rig types
  if (topRig.length > 0) {
    const rigList = topRig.join(", ");
    const dominant = topRig[0];
    const dominantPct = Math.round((stats.rigTypes[dominant] / stats.yachtCount) * 100);
    faqs.push({
      question: `What rig types do ${stats.name} sailing yachts use?`,
      answer: `Most ${stats.name} yachts feature a ${dominant} rig configuration (${dominantPct}% of models). Other rig types include ${rigList}.`,
      questionFr: `Quels types de gréement les voiliers ${stats.name} utilisent-ils ?`,
      answerFr: `La plupart des voiliers ${stats.name} sont équipés d'un gréement ${dominant} (${dominantPct}% des modèles). D'autres types de gréement incluent ${rigList}.`,
    });
  }

  // Q4: Keel types
  if (topKeel.length > 0) {
    const keelList = topKeel.join(", ");
    const dominantKeel = topKeel[0];
    const keelPct = Math.round((stats.keelTypes[dominantKeel] / stats.yachtCount) * 100);
    faqs.push({
      question: `What keel types are available on ${stats.name} yachts?`,
      answer: `${stats.name} primarily uses ${dominantKeel} configurations (${keelPct}% of models). Available keel types include ${keelList}. The keel type affects stability, draft, and sailing performance.`,
      questionFr: `Quels types de quilles sont disponibles sur les voiliers ${stats.name} ?`,
      answerFr: `${stats.name} utilise principalement des configurations ${dominantKeel} (${keelPct}% des modèles). Les types de quilles disponibles incluent ${keelList}. Le type de quille affecte la stabilité, le tirant d'eau et les performances en navigation.`,
    });
  }

  // Q5: Accommodation
  if (stats.avgCabins && stats.avgBerths) {
    faqs.push({
      question: `How many cabins and berths do ${stats.name} yachts typically have?`,
      answer: `${stats.name} yachts average around ${Math.round(stats.avgCabins)} cabins and ${Math.round(stats.avgBerths)} berths. Actual accommodation varies by model — smaller yachts tend to have ${Math.max(1, Math.round(stats.avgCabins) - 1)} cabins while larger models can have ${Math.round(stats.avgCabins) + 1} or more.`,
      questionFr: `Combien de cabines et de couchettes les voiliers ${stats.name} ont-ils généralement ?`,
      answerFr: `Les voiliers ${stats.name} ont en moyenne ${Math.round(stats.avgCabins)} cabines et ${Math.round(stats.avgBerths)} couchettes. L'hébergement réel varie selon le modèle — les petits voiliers ont tendance à avoir ${Math.max(1, Math.round(stats.avgCabins) - 1)} cabines tandis que les modèles plus grands peuvent avoir ${Math.round(stats.avgCabins) + 1} ou plus.`,
    });
  }

  // Q6: Hull material
  if (topHull.length > 0) {
    const dominantHull = topHull[0];
    const hullPct = Math.round((stats.hullMaterials[dominantHull] / stats.yachtCount) * 100);
    faqs.push({
      question: `What hull materials does ${stats.name} use?`,
      answer: `${stats.name} constructs ${hullPct}% of their yachts with ${dominantHull} hulls. This material choice offers a balance of durability, performance, and maintenance costs suitable for ${stats.yachtCount > 10 ? "a wide range of" : ""} sailing conditions.`,
      questionFr: `Quels matériaux de coque ${stats.name} utilise-t-il ?`,
      answerFr: `${stats.name} construit ${hullPct}% de ses voiliers avec des coques en ${dominantHull}. Ce choix de matériau offre un équilibre entre durabilité, performance et coûts d'entretien adapté à ${stats.yachtCount > 10 ? "un large éventail de" : ""} conditions de navigation.`,
    });
  }

  // Q7: Year range
  if (stats.years.min && stats.years.max) {
    faqs.push({
      question: `What year range do ${stats.name} yachts in your database cover?`,
      answer: `Our database includes ${stats.name} yachts from ${stats.years.min} to ${stats.years.max}, spanning ${stats.years.max - stats.years.min} years of production. This includes both classic designs and the latest models.`,
      questionFr: `Quelle période les voiliers ${stats.name} de votre base de données couvrent-ils ?`,
      answerFr: `Notre base de données inclut des voiliers ${stats.name} de ${stats.years.min} à ${stats.years.max}, couvrant ${stats.years.max - stats.years.min} années de production. Cela inclut à la fois les designs classiques et les derniers modèles.`,
    });
  }

  return {
    title: `${stats.name} Sailing Yachts — Frequently Asked Questions`,
    titleFr: `Voiliers ${stats.name} — Questions Fréquentes`,
    description: `Frequently asked questions about ${stats.name} sailing yachts. Learn about models, sizes, rig types, keel configurations, and accommodation options.`,
    descriptionFr: `Questions fréquentes sur les voiliers ${stats.name}. Découvrez les modèles, tailles, types de gréement, configurations de quille et options d'hébergement.`,
    slug: stats.slug,
    faqs,
    jsonLd: buildJsonLd(faqs, `https://info.sailboats.fr/faq/${stats.slug}`),
  };
}

// --- Size Category FAQ Generation ---

export function generateSizeCategoryFaqs(stats: SizeCategoryStats): FaqPageData {
  const faqs: FaqItem[] = [];
  const cat = stats.category;
  const topRig = topKeys(stats.rigTypes);
  const topKeel = topKeys(stats.keelTypes);

  // Q1: What is this size category
  faqs.push({
    question: `What are the best sailing yachts ${cat.labelEn.toLowerCase()}?`,
    answer: `There are ${stats.yachtCount} sailing yachts ${cat.labelEn.toLowerCase()} in our database from ${stats.manufacturers.length} manufacturers. Top brands include ${stats.manufacturers.slice(0, 3).map((m: any) => m.name).join(", ")}.`,
    questionFr: `Quels sont les meilleurs voiliers ${cat.labelFr.toLowerCase()} ?`,
    answerFr: `Il y a ${stats.yachtCount} voiliers ${cat.labelFr.toLowerCase()} dans notre base de données de ${stats.manufacturers.length} constructeurs. Les meilleures marques incluent ${stats.manufacturers.slice(0, 3).map((m: any) => m.name).join(", ")}.`,
  });

  // Q2: Manufacturers
  if (stats.manufacturers.length > 1) {
    faqs.push({
      question: `Which manufacturers make sailing yachts ${cat.labelEn.toLowerCase()}?`,
      answer: `Leading manufacturers in this size range include ${stats.manufacturers.map((m) => `${m.name} (${m.count} models)`).join(", ")}. Each brand offers different design philosophies and target audiences.`,
      questionFr: `Quels constructeurs fabriquent des voiliers ${cat.labelFr.toLowerCase()} ?`,
      answerFr: `Les principaux constructeurs dans cette gamme de tailles incluent ${stats.manufacturers.map((m) => `${m.name} (${m.count} modèles)`).join(", ")}. Chaque marque offre différentes philosophies de design et publics cibles.`,
    });
  }

  // Q3: Cabins/berths
  if (stats.avgCabins && stats.avgBerths) {
    faqs.push({
      question: `How many cabins can I expect in a ${cat.labelEn.toLowerCase()} sailing yacht?`,
      answer: `Sailing yachts ${cat.labelEn.toLowerCase()} typically offer around ${Math.round(stats.avgCabins)} cabins and ${Math.round(stats.avgBerths)} berths. This makes them suitable for ${stats.avgBerths >= 6 ? "family cruising with children or groups of friends" : "couples or small families"}.`,
      questionFr: `Combien de cabines puis-je attendre d'un voilier ${cat.labelFr.toLowerCase()} ?`,
      answerFr: `Les voiliers ${cat.labelFr.toLowerCase()} offrent généralement environ ${Math.round(stats.avgCabins)} cabines et ${Math.round(stats.avgBerths)} couchettes. Cela les rend adaptés ${stats.avgBerths >= 6 ? "à la croisière familiale avec enfants ou à des groupes d'amis" : "aux couples ou aux petites familles"}.`,
    });
  }

  // Q4: Rig types
  if (topRig.length > 0) {
    faqs.push({
      question: `What rig types are common for ${cat.labelEn.toLowerCase()} sailing yachts?`,
      answer: `The most common rig configuration is ${topRig[0]}, with other options including ${topRig.slice(1).join(", ") || "various custom configurations"}. The sloop rig is popular for its simplicity and performance.`,
      questionFr: `Quels types de gréement sont courants pour les voiliers ${cat.labelFr.toLowerCase()} ?`,
      answerFr: `La configuration de gréement la plus courante est ${topRig[0]}, avec d'autres options incluant ${topRig.slice(1).join(", ") || "dives configurations personnalisées"}. Le gréement sloop est populaire pour sa simplicité et ses performances.`,
    });
  }

  // Q5: Keel types
  if (topKeel.length > 0) {
    faqs.push({
      question: `What keel options are available for ${cat.labelEn.toLowerCase()} sailing yachts?`,
      answer: `Common keel configurations include ${topKeel.join(", ")}. The keel type significantly impacts stability, pointing ability, and draft — important factors when choosing a yacht for your sailing grounds.`,
      questionFr: `Quelles options de quille sont disponibles pour les voiliers ${cat.labelFr.toLowerCase()} ?`,
      answerFr: `Les configurations de quille courantes incluent ${topKeel.join(", ")}. Le type de quille a un impact significatif sur la stabilité, la capacité de remontée au vent et le tirant d'eau — des facteurs importants lors du choix d'un voilier pour vos zones de navigation.`,
    });
  }

  // Q6: Usage
  const usageHint = cat.loaMin < 9.14
    ? "ideal for day sailing, coastal cruising, and trailer-sailing"
    : cat.loaMax <= 12.19
    ? "perfect for coastal and offshore cruising, offering a great balance of performance and comfort"
    : "designed for bluewater sailing, long-distance cruising, and living aboard";
  const usageHintFr = cat.loaMin < 9.14
    ? "idéaux pour la navigation à la journée, la croisière côtière et le transport sur remorque"
    : cat.loaMax <= 12.19
    ? "parfaits pour la croisière côtière et hauturière, offrant un excellent équilibre entre performance et confort"
    : "conçus pour la navigation hauturière, la croisière au long cours et la vie à bord";

  faqs.push({
    question: `What is a ${cat.labelEn.toLowerCase()} sailing yacht best suited for?`,
    answer: `Sailing yachts ${cat.labelEn.toLowerCase()} are ${usageHint}. With ${stats.yachtCount} models available from various manufacturers, you can find options for every sailing style and budget.`,
    questionFr: `À quoi convient le mieux un voilier ${cat.labelFr.toLowerCase()} ?`,
    answerFr: `Les voiliers ${cat.labelFr.toLowerCase()} sont ${usageHintFr}. Avec ${stats.yachtCount} modèles disponibles de divers constructeurs, vous pouvez trouver des options pour tous les styles de navigation et tous les budgets.`,
  });

  return {
    title: `Sailing Yachts ${cat.labelEn} — Frequently Asked Questions`,
    titleFr: `Voiliers ${cat.labelFr} — Questions Fréquentes`,
    description: `Frequently asked questions about sailing yachts ${cat.labelEn.toLowerCase()}. Compare models, manufacturers, and specifications.`,
    descriptionFr: `Questions fréquentes sur les voiliers ${cat.labelFr.toLowerCase()}. Comparez les modèles, les constructeurs et les spécifications.`,
    slug: cat.slug,
    faqs,
    jsonLd: buildJsonLd(faqs, `https://info.sailboats.fr/faq/size/${cat.slug}`),
  };
}

// --- General FAQ Generation ---

export async function generateGeneralFaqs(): Promise<FaqPageData> {
  const faqs: FaqItem[] = [];

  try {
  // Get overall stats
  const totalYachts = await db.select({ cnt: count() }).from(yachtModels);
  const totalMfrs = await db.select({ cnt: count() }).from(manufacturers);

  const loaRange = await db
    .select({
      minLoa: min(yachtModels.lengthOverall),
      maxLoa: max(yachtModels.lengthOverall),
    })
    .from(yachtModels)
    .where(isNotNull(yachtModels.lengthOverall));

  const topMfrRows = await db
    .select({
      name: manufacturers.name,
      cnt: count(),
    })
    .from(manufacturers)
    .innerJoin(yachtModels, eq(yachtModels.manufacturerId, manufacturers.id))
    .groupBy(manufacturers.name)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  const rigRows = await db
    .select({
      rigType: yachtModels.rigType,
      cnt: count(),
    })
    .from(yachtModels)
    .where(isNotNull(yachtModels.rigType))
    .groupBy(yachtModels.rigType)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  const keelRows = await db
    .select({
      keelType: yachtModels.keelType,
      cnt: count(),
    })
    .from(yachtModels)
    .where(isNotNull(yachtModels.keelType))
    .groupBy(yachtModels.keelType)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  const total = totalYachts[0]?.cnt ?? 0;
  const totalMfr = totalMfrs[0]?.cnt ?? 0;
  const minLoa = num(loaRange[0]?.minLoa);
  const maxLoa = num(loaRange[0]?.maxLoa);
  const topMfrs = topMfrRows.map((m: any) => m.name);
  const topRigs = rigRows.map((r: any) => r.rigType);
  const topKeels = keelRows.map((k: any) => k.keelType);

  // Q1: Overview
  faqs.push({
    question: "How many sailing yachts are in this database?",
    answer: `Our database contains ${total} sailing yacht models from ${totalMfr} manufacturers, ranging from ${fmtM(minLoa)} to ${fmtM(maxLoa)} in length overall. We cover everything from compact day sailors to luxury bluewater cruisers.`,
    questionFr: "Combien de voiliers contient cette base de données ?",
    answerFr: `Notre base de données contient ${total} modèles de voiliers de ${totalMfr} constructeurs, allant de ${fmtM(minLoa)} à ${fmtM(maxLoa)} de longueur hors tout. Nous couvrons tout, des petits voiliers de journée aux croiseurs hauturiers de luxe.`,
  });

  // Q2: Top manufacturers
  faqs.push({
    question: "Which are the most popular sailing yacht manufacturers?",
    answer: `The top manufacturers in our database include ${topMfrs.join(", ")}. These brands offer a wide range of models from entry-level to premium bluewater cruisers, with extensive dealer networks worldwide.`,
    questionFr: "Quels sont les constructeurs de voiliers les plus populaires ?",
    answerFr: `Les principaux constructeurs de notre base de données incluent ${topMfrs.join(", ")}. Ces marques offrent une large gamme de modèles, de l'entrée de gamme aux croiseurs hauturiers premium, avec des réseaux de concessionnaires étendus dans le monde entier.`,
  });

  // Q3: Choosing size
  faqs.push({
    question: "What size sailing yacht should I choose?",
    answer: `The right size depends on your experience and plans. Sailboats under 30ft are great for beginners and day sailing. The 30-40ft range is the sweet spot for family cruising. Yachts over 45ft are suitable for bluewater passages and liveaboard lifestyles. Our database spans from ${fmtM(minLoa)} to ${fmtM(maxLoa)}.`,
    questionFr: "Quelle taille de voilier dois-je choisir ?",
    answerFr: `La bonne taille dépend de votre expérience et de vos projets. Les voiliers de moins de 30 pieds sont idéaux pour les débutants et la navigation à la journée. La gamme 30-40 pieds est idéale pour la croisière familiale. Les voiliers de plus de 45 pieds conviennent aux passages hauturiers et à la vie à bord. Notre base de données s'étend de ${fmtM(minLoa)} à ${fmtM(maxLoa)}.`,
  });

  // Q4: Rig types
  faqs.push({
    question: "What are the most common rig types for sailing yachts?",
    answer: `The most common rig types are ${topRigs.join(", ")}. The sloop rig is by far the most popular due to its simplicity, efficiency, and ease of handling. Cutters and ketches offer more sail plan flexibility for offshore sailing.`,
    questionFr: "Quels sont les types de gréement les plus courants pour les voiliers ?",
    answerFr: `Les types de gréement les plus courants sont ${topRigs.join(", ")}. Le gréement sloop est de loin le plus populaire en raison de sa simplicité, de son efficacité et de sa facilité de manœuvre. Les cotres et les ketchs offrent plus de flexibilité de plan de voilure pour la navigation hauturière.`,
  });

  // Q5: Keel types
  faqs.push({
    question: "What keel types are available for sailing yachts?",
    answer: `Common keel configurations include ${topKeels.join(", ")}. Fin keels offer the best performance and pointing ability. Lifting keels and daggerboards allow access to shallow waters. Full keels provide excellent directional stability for long passages.`,
    questionFr: "Quels types de quilles sont disponibles pour les voiliers ?",
    answerFr: `Les configurations de quille courantes incluent ${topKeels.join(", ")}. Les quilles à aileron offrent les meilleures performances et la meilleure capacité de remontée au vent. Les quilles relevables et les dérives permettent l'accès aux eaux peu profondes. Les quilles longues offrent une excellente stabilité de route pour les longues traversées.`,
  });

  // Q6: Hull materials
  faqs.push({
    question: "What hull materials are most common for sailing yachts?",
    answer: "Fiberglass (GRP) is the dominant hull material, used in over 90% of production sailing yachts. It offers an excellent balance of strength, weight, cost, and low maintenance. Other materials include aluminium (for expedition yachts), carbon/epoxy (for high-performance), and wood/epoxy (for classic designs).",
    questionFr: "Quels matériaux de coque sont les plus courants pour les voiliers ?",
    answerFr: "La fibre de verre (GRP) est le matériau de coque dominant, utilisé dans plus de 90% des voiliers de série. Elle offre un excellent équilibre entre résistance, poids, coût et faible entretien. D'autres matériaux incluent l'aluminium (pour les yachts d'expédition), le carbone/époxy (pour la haute performance) et le bois/époxy (pour les designs classiques).",
  });

  // Q7: New vs used
  faqs.push({
    question: "Should I buy a new or used sailing yacht?",
    answer: "Both options have merit. New yachts offer the latest designs, technology, and warranty coverage — but at a premium price. Used yachts provide excellent value, especially 5-15 year old models that have depreciated but still offer modern design and equipment. Consider hiring a surveyor for any used purchase.",
    questionFr: "Dois-je acheter un voilier neuf ou d'occasion ?",
    answerFr: "Les deux options ont leurs mérites. Les voiliers neufs offrent les derniers designs, technologies et garanties — mais à un prix premium. Les voiliers d'occasion offrent un excellent rapport qualité-prix, en particulier les modèles de 5 à 15 ans qui se sont dépréciés mais offrent encore un design et un équipement modernes. Envisagez de faire appel à un expert pour tout achat d'occasion.",
  });

  return {
    title: "Sailing Yachts — Frequently Asked Questions",
    titleFr: "Voiliers — Questions Fréquentes",
    description: "Frequently asked questions about sailing yachts. Learn about manufacturers, sizes, rig types, keel configurations, and how to choose the right yacht.",
    descriptionFr: "Questions fréquentes sur les voiliers. Découvrez les constructeurs, tailles, types de gréement, configurations de quille et comment choisir le bon voilier.",
    slug: "general",
    faqs,
    jsonLd: buildJsonLd(faqs, "https://info.sailboats.fr/faq"),
  };
  } catch {
    // Return minimal FAQ data on DB error
    return {
      title: "Sailing Yachts — Frequently Asked Questions",
      titleFr: "Voiliers — Questions Fréquentes",
      description: "Frequently asked questions about sailing yachts.",
      descriptionFr: "Questions fréquentes sur les voiliers.",
      slug: "general",
      faqs: [],
      jsonLd: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [] },
    };
  }
}
