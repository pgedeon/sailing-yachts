import { NextRequest, NextResponse } from "next/server";
import { getTemplateById } from "@/lib/buying-guides";
import { pool } from "@/lib/db";

/**
 * GET /api/buying-guides/[id]/yachts
 *
 * Returns yachts that match a buying guide template's filters.
 * Queries the database directly instead of making an internal HTTP roundtrip.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { error: "Buying guide template not found" },
        { status: 404 }
      );
    }

    const { filters, maxResults } = template;

    // Build WHERE clauses from template filters
    const conditions: string[] = ["ym.id IS NOT NULL"];
    const queryParams: any[] = [];
    let paramIdx = 1;

    if (filters.lengthMin !== undefined) {
      conditions.push(`ym.length_overall >= $${paramIdx++}`);
      queryParams.push(filters.lengthMin);
    }
    if (filters.lengthMax !== undefined) {
      conditions.push(`ym.length_overall <= $${paramIdx++}`);
      queryParams.push(filters.lengthMax);
    }
    if (filters.cabinsMin !== undefined) {
      conditions.push(`ym.cabins >= $${paramIdx++}`);
      queryParams.push(filters.cabinsMin);
    }
    if (filters.cabinsMax !== undefined) {
      conditions.push(`ym.cabins <= $${paramIdx++}`);
      queryParams.push(filters.cabinsMax);
    }
    if (filters.keelType) {
      conditions.push(`ym.keel_type ILIKE $${paramIdx++}`);
      queryParams.push(`%${filters.keelType}%`);
    }
    if (filters.rigType) {
      conditions.push(`ym.rig_type ILIKE $${paramIdx++}`);
      queryParams.push(`%${filters.rigType}%`);
    }
    if (filters.hullMaterial) {
      conditions.push(`ym.hull_material ILIKE $${paramIdx++}`);
      queryParams.push(`%${filters.hullMaterial}%`);
    }
    if (filters.displacementMin !== undefined) {
      conditions.push(`ym.displacement >= $${paramIdx++}`);
      queryParams.push(filters.displacementMin);
    }
    if (filters.displacementMax !== undefined) {
      conditions.push(`ym.displacement <= $${paramIdx++}`);
      queryParams.push(filters.displacementMax);
    }

    const limitClause = maxResults ? `LIMIT ${parseInt(String(maxResults), 10)}` : "";

    const whereClause = conditions.join(" AND ");

    // Count query
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM yacht_models ym WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    // Main query with manufacturer join and primary image
    const dataQuery = `
      SELECT
        ym.id,
        ym.model_name,
        ym.slug,
        ym.year,
        ym.length_overall,
        ym.beam,
        ym.draft,
        ym.displacement,
        ym.cabins,
        ym.berths,
        ym.hull_material,
        ym.rig_type,
        ym.keel_type,
        m.name AS manufacturer,
        m.slug AS manufacturer_slug,
        img.url AS primary_image_url
      FROM yacht_models ym
      LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
      LEFT JOIN LATERAL (
        SELECT i.url FROM images i
        WHERE i.yacht_model_id = ym.id
        ORDER BY i.sort_order ASC, i.id ASC
        LIMIT 1
      ) img ON true
      WHERE ${whereClause}
      ORDER BY ym.length_overall ASC
      ${limitClause}
    `;

    const dataResult = await pool.query(dataQuery, queryParams);

    const yachts = dataResult.rows.map((row: any) => ({
      id: row.id,
      modelName: row.model_name,
      slug: row.slug,
      year: row.year,
      manufacturer: row.manufacturer || "Unknown",
      manufacturerSlug: row.manufacturer_slug || null,
      lengthOverall: row.length_overall !== null ? parseFloat(row.length_overall) : null,
      beam: row.beam !== null ? parseFloat(row.beam) : null,
      draft: row.draft !== null ? parseFloat(row.draft) : null,
      displacement: row.displacement !== null ? parseFloat(row.displacement) : null,
      cabins: row.cabins,
      berths: row.berths,
      hullMaterial: row.hull_material,
      rigType: row.rig_type,
      keelType: row.keel_type,
      primaryImageUrl: row.primary_image_url || null,
    }));

    return NextResponse.json({
      templateId: id,
      templateName: template.title,
      yachts,
      total,
    });
  } catch (error) {
    console.error("Error fetching buying guide yachts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
