import { db, yachtModels, manufacturers, images } from "@/lib/db";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { getRelatedArticles, addAffiliateTag } from "@/lib/sailboat-articles";

// ─── Types ───────────────────────────────────────────────────────
export interface RelatedYachtCard {
  id: number;
  manufacturer: string | null;
  modelName: string;
  slug: string | null;
  year: number;
  lengthOverall: string | null;
  beam: string | null;
  draft: string | null;
  displacement: string | null;
  primaryImage: string | null;
  score?: number;
}

export interface RelatedGuide {
  title: string;
  slug: string;
  excerpt: string;
  relevance: number;
}

export interface RelatedArticle {
  id: string;
  title: string;
  url: string;
  description: string;
  categories: string[];
  tags: string[];
}

// ─── Similar Yachts (weighted Euclidean) ─────────────────────────
export async function getSimilarYachts(slug: string, limit = 3): Promise<RelatedYachtCard[]> {
  const sourceResult = await db
    .select({
      id: yachtModels.id,
      manufacturer: manufacturers.name,
      modelName: yachtModels.modelName,
      slug: yachtModels.slug,
      year: yachtModels.year,
      lengthOverall: yachtModels.lengthOverall,
      beam: yachtModels.beam,
      draft: yachtModels.draft,
      displacement: yachtModels.displacement,
      sailAreaMain: yachtModels.sailAreaMain,
      hullMaterial: yachtModels.hullMaterial,
      rigType: yachtModels.rigType,
      keelType: yachtModels.keelType,
      cabins: yachtModels.cabins,
    })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(eq(yachtModels.slug, slug))
    .limit(1);

  if (sourceResult.length === 0) return [];

  const source = sourceResult[0];

  const candidates = await db
    .select({
      id: yachtModels.id,
      manufacturer: manufacturers.name,
      modelName: yachtModels.modelName,
      slug: yachtModels.slug,
      year: yachtModels.year,
      lengthOverall: yachtModels.lengthOverall,
      beam: yachtModels.beam,
      draft: yachtModels.draft,
      displacement: yachtModels.displacement,
      sailAreaMain: yachtModels.sailAreaMain,
      hullMaterial: yachtModels.hullMaterial,
      rigType: yachtModels.rigType,
      keelType: yachtModels.keelType,
      cabins: yachtModels.cabins,
    })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id));

  const filtered = candidates.filter((c: any) => c.id !== source.id);

  type DimKey = "lengthOverall" | "beam" | "draft" | "displacement" | "sailAreaMain";
  const dims: Array<{ key: DimKey; weight: number }> = [
    { key: "lengthOverall", weight: 0.30 },
    { key: "displacement", weight: 0.25 },
    { key: "beam", weight: 0.20 },
    { key: "draft", weight: 0.15 },
    { key: "sailAreaMain", weight: 0.10 },
  ];

  const scored = filtered
    .map((c: any) => {
      let totalWeight = 0;
      let weightedDist = 0;
      for (const dim of dims) {
        const sv = source[dim.key] !== null ? parseFloat(source[dim.key]!) : null;
        const cv = c[dim.key] !== null ? parseFloat(c[dim.key]!) : null;
        if (sv === null || cv === null || sv === 0) continue;
        weightedDist += dim.weight * (Math.abs(sv - cv) / sv);
        totalWeight += dim.weight;
      }
      if (totalWeight === 0) return null;
      const score = Math.max(0, 1 - weightedDist / totalWeight);
      return { ...c, score };
    })
    .filter((x: any): x is any => x !== null && x.score > 0.3)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);

  // Fetch images for scored yachts
  const withImages = await Promise.all(
    scored.map(async (y: any) => {
      let primaryImage: string | null = null;
      try {
        const imgs = await db
          .select({ url: images.url })
          .from(images)
          .where(eq(images.yachtModelId, y.id))
          .limit(1);
        primaryImage = imgs.length > 0 ? imgs[0].url : null;
      } catch {}
      return {
        id: y.id,
        manufacturer: y.manufacturer,
        modelName: y.modelName,
        slug: y.slug,
        year: y.year,
        lengthOverall: y.lengthOverall,
        beam: y.beam,
        draft: y.draft,
        displacement: y.displacement,
        primaryImage,
        score: y.score,
      };
    })
  );

  return withImages;
}

// ─── Same Size Alternatives ──────────────────────────────────────
export async function getSameSizeYachts(
  yachtId: number,
  loa: number | null,
  limit = 3,
): Promise<RelatedYachtCard[]> {
  if (!loa) return [];

  const minLen = loa * 0.9;
  const maxLen = loa * 1.1;

  const results = await db
    .select({
      id: yachtModels.id,
      manufacturer: manufacturers.name,
      modelName: yachtModels.modelName,
      slug: yachtModels.slug,
      year: yachtModels.year,
      lengthOverall: yachtModels.lengthOverall,
      beam: yachtModels.beam,
      draft: yachtModels.draft,
      displacement: yachtModels.displacement,
    })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id));

  // Filter in JS (Neon HTTP driver compatibility)
  const filtered = results.filter((r: any) => {
    if (r.id === yachtId) return false;
    const loaVal = parseFloat(r.lengthOverall);
    if (isNaN(loaVal)) return false;
    return loaVal >= minLen && loaVal <= maxLen;
  });

  // Take up to limit, prioritizing closest match
  filtered.sort((a: any, b: any) => {
    const diffA = Math.abs(parseFloat(a.lengthOverall) - loa);
    const diffB = Math.abs(parseFloat(b.lengthOverall) - loa);
    return diffA - diffB;
  });

  const selected = filtered.slice(0, limit);

  // Fetch images
  return Promise.all(
    selected.map(async (y: any) => {
      let primaryImage: string | null = null;
      try {
        const imgs = await db
          .select({ url: images.url })
          .from(images)
          .where(eq(images.yachtModelId, y.id))
          .limit(1);
        primaryImage = imgs.length > 0 ? imgs[0].url : null;
      } catch {}
      return {
        id: y.id,
        manufacturer: y.manufacturer,
        modelName: y.modelName,
        slug: y.slug,
        year: y.year,
        lengthOverall: y.lengthOverall,
        beam: y.beam,
        draft: y.draft,
        displacement: y.displacement,
        primaryImage,
      };
    })
  );
}

// ─── Same Manufacturer ───────────────────────────────────────────
export async function getManufacturerYachts(
  manufacturerId: number | null,
  excludeId: number,
  limit = 3,
): Promise<RelatedYachtCard[]> {
  if (!manufacturerId) return [];

  const results = await db
    .select({
      id: yachtModels.id,
      manufacturer: manufacturers.name,
      modelName: yachtModels.modelName,
      slug: yachtModels.slug,
      year: yachtModels.year,
      lengthOverall: yachtModels.lengthOverall,
      beam: yachtModels.beam,
      draft: yachtModels.draft,
      displacement: yachtModels.displacement,
    })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(eq(yachtModels.manufacturerId, manufacturerId));

  const filtered = results.filter((r: any) => r.id !== excludeId).slice(0, limit);

  return Promise.all(
    filtered.map(async (y: any) => {
      let primaryImage: string | null = null;
      try {
        const imgs = await db
          .select({ url: images.url })
          .from(images)
          .where(eq(images.yachtModelId, y.id))
          .limit(1);
        primaryImage = imgs.length > 0 ? imgs[0].url : null;
      } catch {}
      return {
        id: y.id,
        manufacturer: y.manufacturer,
        modelName: y.modelName,
        slug: y.slug,
        year: y.year,
        lengthOverall: y.lengthOverall,
        beam: y.beam,
        draft: y.draft,
        displacement: y.displacement,
        primaryImage,
      };
    })
  );
}

// ─── Related Guides ──────────────────────────────────────────────
// Delegates to the existing sailboat-articles module
export function getRelatedArticlesForYacht(params: {
  manufacturer: string;
  loa: number | null;
  rig?: string | null;
  keel?: string | null;
  hull?: string | null;
  cabins?: number | null;
  displacement?: number | null;
}): RelatedArticle[] {
  const articles = getRelatedArticles(
    {
      manufacturer: params.manufacturer,
      lengthOverall: params.loa,
      rigType: params.rig ?? null,
      keelType: params.keel ?? null,
      hullMaterial: params.hull ?? null,
      cabins: params.cabins ?? null,
      displacement: params.displacement ?? null,
    },
    4,
  );

  return articles.map((a) => ({
    ...a,
    url: addAffiliateTag(a.url),
  }));
}
