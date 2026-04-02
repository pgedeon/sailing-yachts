/**
 * Sailboats.fr article cross-linking utility.
 *
 * Reads the article mapping from data/sailboat-articles.json and returns
 * relevant articles for a given yacht based on manufacturer name and
 * yacht characteristics (rig type, keel type, size category, etc.).
 */

import articleData from "../data/sailboat-articles.json";

export interface SailboatArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  categories: string[];
  tags: string[];
}

interface YachtProfile {
  manufacturer: string;
  lengthOverall: number | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | null;
  displacement: number | null;
}

function normalize(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Determine sailing category tags from yacht specs.
 */
function inferSailingCategories(yacht: YachtProfile): string[] {
  const cats: string[] = [];
  const loa = yacht.lengthOverall;
  const disp = yacht.displacement;

  // Size-based categories
  if (loa !== null) {
    if (loa < 10) cats.push("coastal", "beginner");
    if (loa >= 10 && loa < 14) cats.push("cruising", "coastal");
    if (loa >= 14) cats.push("offshore", "cruising");
    if (loa >= 15) cats.push("bluewater");
  }

  // Rig type
  if (yacht.rigType) {
    const rt = normalize(yacht.rigType);
    if (rt.includes("sloop") || rt.includes("cutter")) {
      // Standard cruising rig
    }
    if (rt.includes("ketch") || rt.includes("yawl")) {
      cats.push("cruising", "offshore");
    }
  }

  // Displacement suggests heavy/offshore capability
  if (disp !== null && disp > 12000) {
    cats.push("offshore", "cruising");
  }

  return [...new Set(cats)];
}

/**
 * Score an article's relevance to a yacht profile (0–1).
 */
function scoreArticle(article: SailboatArticle, yacht: YachtProfile): number {
  let score = 0;
  const yachtCategories = inferSailingCategories(yacht);

  // Category overlap
  for (const cat of article.categories) {
    if (yachtCategories.includes(cat)) score += 0.25;
  }

  // Tag-based boosts
  const rigLower = (yacht.rigType || "").toLowerCase();
  const hullLower = (yacht.hullMaterial || "").toLowerCase();

  for (const tag of article.tags) {
    const t = tag.toLowerCase();
    if (t === "rigging" && (rigLower.includes("mast") || rigLower.includes("rig"))) score += 0.15;
    if (t === "anchoring" && yacht.keelType && normalize(yacht.keelType).includes("fixed")) score += 0.1;
    if (t === "racing" && (rigLower.includes("fractional") || rigLower.includes("marconi"))) score += 0.2;
    if (t === "cruising" && yacht.cabins && yacht.cabins >= 2) score += 0.15;
    if (t === "offshore" && yacht.lengthOverall && yacht.lengthOverall >= 12) score += 0.15;
    if (t === "maintenance" && hullLower) score += 0.05;
  }

  return Math.min(score, 1);
}

/**
 * Get relevant sailboats.fr articles for a given yacht.
 * Returns articles sorted by relevance, limited to `limit` results.
 */
export function getRelatedArticles(
  yacht: YachtProfile,
  limit = 4,
): SailboatArticle[] {
  const results: Array<{ article: SailboatArticle; score: number }> = [];

  // 1. Manufacturer-specific articles (highest priority)
  const manufacturerKey = Object.keys(articleData.manufacturerGuides).find(
    (key) => normalize(key) === normalize(yacht.manufacturer),
  );

  const manufacturerArticleIds = manufacturerKey
    ? articleData.manufacturerGuides[manufacturerKey as keyof typeof articleData.manufacturerGuides]?.articles || []
    : [];

  // 2. Score all articles
  const articlesById = new Map<string, SailboatArticle>();
  for (const article of articleData.articles) {
    articlesById.set(article.id, article);
  }

  // Add manufacturer-specific articles with a high base score
  const processed = new Set<string>();
  for (const id of manufacturerArticleIds) {
    const article = articlesById.get(id);
    if (article && !processed.has(id)) {
      processed.add(id);
      results.push({
        article,
        score: 0.8 + scoreArticle(article, yacht) * 0.2,
      });
    }
  }

  // Add articles scored by yacht characteristics
  for (const article of articleData.articles) {
    if (processed.has(article.id)) continue;
    const s = scoreArticle(article, yacht);
    if (s > 0.1) {
      results.push({ article, score: s });
    }
  }

  // Sort by score descending, take top `limit`
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map((r) => r.article);
}

/**
 * Add affiliate tag to a sailboats.fr URL if applicable.
 */
export function addAffiliateTag(url: string, tag = "pgedeon-20"): string {
  try {
    const u = new URL(url);
    if (u.hostname === "sailboats.fr" || u.hostname === "www.sailboats.fr") {
      u.searchParams.set("tag", tag);
    }
    return u.toString();
  } catch {
    return url;
  }
}
