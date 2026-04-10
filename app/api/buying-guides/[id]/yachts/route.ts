import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getTemplateById, templateFiltersToQueryParams } from "@/lib/buying-guides";

export const dynamic = "force-dynamic";

/**
 * GET /api/buying-guides/[id]/yachts
 * Get yachts matching a buying guide template's filters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = getTemplateById(params.id);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const filters = template.filters;
    const maxResults = template.maxResults || 12;

    // Build WHERE clauses
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (filters.lengthMin != null) {
      conditions.push(`y.length_overall >= $${paramIdx}::numeric`);
      values.push(filters.lengthMin);
      paramIdx++;
    }
    if (filters.lengthMax != null) {
      conditions.push(`y.length_overall <= $${paramIdx}::numeric`);
      values.push(filters.lengthMax);
      paramIdx++;
    }
    if (filters.cabinsMin != null) {
      conditions.push(`y.cabins >= $${paramIdx}::integer`);
      values.push(filters.cabinsMin);
      paramIdx++;
    }
    if (filters.cabinsMax != null) {
      conditions.push(`y.cabins <= $${paramIdx}::integer`);
      values.push(filters.cabinsMax);
      paramIdx++;
    }
    if (filters.keelType) {
      conditions.push(`y.keel_type = $${paramIdx}`);
      values.push(filters.keelType);
      paramIdx++;
    }
    if (filters.rigType) {
      conditions.push(`y.rig_type = $${paramIdx}`);
      values.push(filters.rigType);
      paramIdx++;
    }
    if (filters.hullMaterial) {
      conditions.push(`y.hull_material = $${paramIdx}`);
      values.push(filters.hullMaterial);
      paramIdx++;
    }
    if (filters.displacementMin != null) {
      conditions.push(`y.displacement >= $${paramIdx}::numeric`);
      values.push(filters.displacementMin);
      paramIdx++;
    }
    if (filters.displacementMax != null) {
      conditions.push(`y.displacement <= $${paramIdx}::numeric`);
      values.push(filters.displacementMax);
      paramIdx++;
    }

    // Only include yachts with a slug (publicly visible)
    conditions.push(`y.slug IS NOT NULL`);

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM yacht_models y ${whereClause}`,
      values
    );
    const total = countResult.rows[0]?.total || 0;

    // Data query
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
        y.keel_type,
        m.name as manufacturer,
        LOWER(REPLACE(m.name, ' ', '-')) as manufacturer_slug,
        (SELECT img.url FROM images img WHERE img.yacht_model_id = y.id AND img.is_primary = true LIMIT 1) as primary_image_url
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      ${whereClause}
      ORDER BY y.length_overall ASC
      LIMIT $${paramIdx}`,
      [...values, maxResults]
    );

    const yachts = result.rows.map((row: any) => ({
      id: row.id,
      modelName: row.model_name,
      slug: row.slug,
      year: row.year,
      manufacturer: row.manufacturer || "Unknown",
      manufacturerSlug: row.manufacturer_slug,
      lengthOverall: row.length_overall
        ? parseFloat(row.length_overall)
        : null,
      beam: row.beam ? parseFloat(row.beam) : null,
      draft: row.draft ? parseFloat(row.draft) : null,
      displacement: row.displacement ? parseFloat(row.displacement) : null,
      cabins: row.cabins,
      berths: row.berths,
      hullMaterial: row.hull_material,
      rigType: row.rig_type,
      keelType: row.keel_type,
      primaryImageUrl: row.primary_image_url,
    }));

    return NextResponse.json({
      template,
      yachts,
      total,
    });
  } catch (error: any) {
    console.error("Error fetching buying guide yachts:", error);
    return NextResponse.json(
      { error: "Failed to fetch buying guide yachts", details: error.message },
      { status: 500 }
    );
  }
}
