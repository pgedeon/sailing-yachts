import { YachtModels, Manufacturers, SpecCategories, SpecValues, Images, Reviews } from "./db";

/**
 * Map a raw yacht row (with joined manufacturer name) to the public-facing DTO.
 * This is the canonical shape used by both admin list and public APIs.
 */
export function mapYachtToListDto(row: any): {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number | null;
  slug: string | null;
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
  sourceUrl?: string | null;
  sourceAttribution?: string | null;
  adminLinks?: any; // JSONB
  createdAt?: Date | null;
  updatedAt?: Date | null;
} {
  return {
    id: row.id,
    manufacturer: row.manufacturer_name ?? row.manufacturer ?? "",
    modelName: row.model_name,
    year: row.year ?? undefined,
    slug: row.slug ?? undefined,
    lengthOverall: row.length_overall ?? undefined,
    beam: row.beam ?? undefined,
    draft: row.draft ?? undefined,
    displacement: row.displacement ?? undefined,
    ballast: row.ballast ?? undefined,
    sailAreaMain: row.sail_area_main ?? undefined,
    rigType: row.rig_type ?? undefined,
    keelType: row.keel_type ?? undefined,
    hullMaterial: row.hull_material ?? undefined,
    cabins: row.cabins ?? undefined,
    berths: row.berths ?? undefined,
    heads: row.heads ?? undefined,
    maxOccupancy: row.max_occupancy ?? undefined,
    engineHp: row.engine_hp ?? undefined,
    engineType: row.engine_type ?? undefined,
    fuelCapacity: row.fuel_capacity ?? undefined,
    waterCapacity: row.water_capacity ?? undefined,
    designNotes: row.design_notes ?? undefined,
    description: row.description ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    sourceAttribution: row.source_attribution ?? undefined,
    adminLinks: row.admin_links ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

/**
 * Map a raw yacht detail row (with joined manufacturer and related tables) to the full DTO.
 */
export function mapYachtToDetailDto(row: any): {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number | null;
  slug: string | null;
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
  sourceUrl?: string | null;
  sourceAttribution?: string | null;
  adminLinks?: any;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  specsByGroup?: Record<string, Array<{ category: string; value: number | string; unit?: string }>>;
  images?: Array<{ url: string; caption?: string; altText?: string; isPrimary: boolean }>;
  reviews?: Array<{
    source: string;
    rating: number | null;
    summary: string | null;
    fullText?: string | null;
    reviewDate?: string | null;
    authorName?: string | null;
    sourceUrl?: string | null;
  }>;
} {
  const base = mapYachtToListDto(row);

  // Build specsByGroup from specValues + specCategories (assume joined data available)
  const specsByGroup: Record<string, any[]> = {};
  if (row.specs && Array.isArray(row.specs)) {
    for (const spec of row.specs) {
      const group = spec.category_group || "other";
      if (!specsByGroup[group]) specsByGroup[group] = [];
      specsByGroup[group].push({
        category: spec.name,
        value: spec.value_numeric ?? spec.value_text ?? null,
        unit: spec.unit,
      });
    }
  }

  return {
    ...base,
    specsByGroup,
    images: row.images || [],
    reviews: row.reviews || [],
  };
}
