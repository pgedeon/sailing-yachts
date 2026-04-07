/**
 * Landing Page Data Service
 *
 * Fetches matching yachts from the database for a given landing page definition.
 * Uses the same query patterns as the yachts API but optimized for landing pages.
 */

import { pool } from "@/lib/db";
import { buildSafeQuery } from "@/lib/build-safe";
import type { LandingPageDefinition } from "@/data/landing-pages";

export interface LandingPageYacht {
  id: number;
  modelName: string;
  slug: string;
  year: number;
  manufacturer: string;
  manufacturerSlug: string | null;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  cabins: number | null;
  berths: number | null;
  hullMaterial: string | null;
  rigType: string | null;
  primaryImageUrl: string | null;
}

export interface LandingPageData {
  yachts: LandingPageYacht[];
  totalCount: number;
}

const FALLBACK_DATA: LandingPageData = { yachts: [], totalCount: 0 };

/**
 * Fetch yachts matching the landing page filters
 */
export async function getLandingPageYachts(
  definition: LandingPageDefinition
): Promise<LandingPageData> {
  return buildSafeQuery(async () => {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    const { filters } = definition;

    if (filters.lengthMin != null) {
      conditions.push(`y.length_overall >= $${paramIdx++}`);
      params.push(String(filters.lengthMin));
    }
    if (filters.lengthMax != null) {
      conditions.push(`y.length_overall <= $${paramIdx++}`);
      params.push(String(filters.lengthMax));
    }
    if (filters.cabinsMin != null) {
      conditions.push(`y.cabins >= $${paramIdx++}`);
      params.push(String(filters.cabinsMin));
    }
    if (filters.keelType) {
      conditions.push(`y.keel_type = $${paramIdx++}`);
      params.push(filters.keelType);
    }
    if (filters.rigType) {
      conditions.push(`y.rig_type = $${paramIdx++}`);
      params.push(filters.rigType);
    }
    if (filters.hullMaterial) {
      conditions.push(`y.hull_material = $${paramIdx++}`);
      params.push(filters.hullMaterial);
    }
    if (filters.displacementMin != null) {
      conditions.push(`y.displacement >= $${paramIdx++}`);
      params.push(String(filters.displacementMin));
    }

    // Only include yachts with a slug (publicly visible)
    conditions.push(`y.slug IS NOT NULL`);
    conditions.push(`y.length_overall IS NOT NULL`);

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM yacht_models y ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0]?.total || "0", 10);

    // Data query with limit
    const limit = Math.min(definition.maxResults, 24);
    const result = await pool.query(
      `SELECT
        y.id,
        y.model_name,
        y.slug,
        y.year,
        y.length_overall,
        y.beam,
        y.draft,
        y.displacement,
        y.cabins,
        y.berths,
        y.hull_material,
        y.rig_type,
        m.name as manufacturer,
        LOWER(REPLACE(m.name, ' ', '-')) as manufacturer_slug,
        (SELECT img.url FROM images img WHERE img.yacht_model_id = y.id AND img.is_primary = true LIMIT 1) as primary_image_url
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      ${whereClause}
      ORDER BY y.length_overall ASC
      LIMIT $${paramIdx++}`,
      [...params, String(limit)]
    );

    const yachts: LandingPageYacht[] = result.rows.map((row: any) => ({
      id: row.id,
      modelName: row.model_name,
      slug: row.slug,
      year: row.year,
      manufacturer: row.manufacturer || "Unknown",
      manufacturerSlug: row.manufacturer_slug,
      lengthOverall: row.length_overall ? parseFloat(row.length_overall) : null,
      beam: row.beam ? parseFloat(row.beam) : null,
      draft: row.draft ? parseFloat(row.draft) : null,
      displacement: row.displacement ? parseFloat(row.displacement) : null,
      cabins: row.cabins,
      berths: row.berths,
      hullMaterial: row.hull_material,
      rigType: row.rig_type,
      primaryImageUrl: row.primary_image_url,
    }));

    return { yachts, totalCount };
  }, FALLBACK_DATA);
}
