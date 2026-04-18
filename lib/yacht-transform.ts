import { getYachtDetailData, type YachtDetailData } from "./yachts";

// Drizzle's `numeric` type returns strings from PostgreSQL.
// Convert to actual numbers for proper JSON types.
function toNum(v: string | number | null): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? null : n;
}

export interface YachtPageData {
  id: number;
  manufacturerId: number | null;
  manufacturer: string;
  modelName: string;
  year: number;
  slug: string;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sailAreaMain: number | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  maxOccupancy: number | null;
  engineHp: number | null;
  engineType: string | null;
  fuelCapacity: number | null;
  waterCapacity: number | null;
  designNotes: string | null;
  description: string | null;
  adminLinks: Array<{ label: string; url: string }> | null;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  specsByGroup: Record<string, Array<{ category: string; value: number | string; unit?: string }>>;
  images: Array<{
    url: string;
    caption?: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  reviews: Array<{
    source: string | null;
    rating: number | null;
    summary: string | null;
    fullText: string | null;
    reviewDate: string | null;
    authorName: string | null;
    sourceUrl: string | null;
  }>;
}

/**
 * Transform raw yacht detail data into the client-friendly format.
 * Shared between the API route and the server component.
 */
export function transformYachtData(result: YachtDetailData): YachtPageData {
  const { yacht, manufacturer, specsByGroup, images, reviews } = result;

  // Rebuild specsByGroup with numeric values properly parsed
  const parsedSpecsByGroup: Record<string, Array<{ category: string; value: number | string; unit?: string }>> = {};
  for (const [group, specs] of Object.entries(specsByGroup)) {
    parsedSpecsByGroup[group] = specs.map((s) => {
      const parsed = typeof s.value === "string" ? toNum(s.value) : s.value;
      return {
        category: s.category,
        value: parsed ?? s.value,
        unit: s.unit ?? undefined,
      };
    });
  }

  return {
    id: yacht.id,
    manufacturerId: yacht.manufacturerId,
    manufacturer,
    modelName: yacht.modelName,
    year: yacht.year,
    slug: yacht.slug ?? "",
    lengthOverall: toNum(yacht.lengthOverall),
    beam: toNum(yacht.beam),
    draft: toNum(yacht.draft),
    displacement: toNum(yacht.displacement),
    ballast: toNum(yacht.ballast),
    sailAreaMain: toNum(yacht.sailAreaMain),
    rigType: yacht.rigType,
    keelType: yacht.keelType,
    hullMaterial: yacht.hullMaterial,
    cabins: yacht.cabins,
    berths: yacht.berths,
    heads: yacht.heads,
    maxOccupancy: yacht.maxOccupancy,
    engineHp: toNum(yacht.engineHp),
    engineType: yacht.engineType,
    fuelCapacity: toNum(yacht.fuelCapacity),
    waterCapacity: toNum(yacht.waterCapacity),
    designNotes: yacht.designNotes,
    description: yacht.description,
    adminLinks: yacht.adminLinks,
    sourceUrl: yacht.sourceUrl,
    sourceAttribution: yacht.sourceAttribution,
    specsByGroup: parsedSpecsByGroup,
    images: images.map((img) => ({
      url: img.url,
      caption: img.caption ?? undefined,
      altText: img.altText ?? undefined,
      isPrimary: img.isPrimary,
    })),
    reviews,
  };
}
