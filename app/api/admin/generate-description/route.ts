import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, pool } from "@/lib/db";
import {
  generateDescription,
  generateAllStyles,
  needsGeneratedDescription,
  scoreDescription,
  type DescriptionStyle,
} from "@/lib/description-templates";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/generate-description?slug=<slug>&style=<style>
 *
 * Generates a description for a yacht based on its specs.
 * If no slug is provided, returns a report of yachts needing descriptions.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const style = (request.nextUrl.searchParams.get("style") || "balanced") as DescriptionStyle;

  await ensureSchema();

  if (slug) {
    // Generate description for a specific yacht
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT ym.*, m.name as manufacturer
         FROM yacht_models ym
         JOIN manufacturers m ON m.id = ym.manufacturer_id
         WHERE ym.slug = $1`,
        [slug],
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
      }

      const row = result.rows[0];
      const specs = {
        manufacturer: row.manufacturer,
        modelName: row.model_name,
        year: row.year,
        lengthOverall: row.length_overall,
        beam: row.beam,
        draft: row.draft,
        displacement: row.displacement,
        ballast: row.ballast,
        sailAreaMain: row.sail_area_main,
        rigType: row.rig_type,
        keelType: row.keel_type,
        hullMaterial: row.hull_material,
        cabins: row.cabins,
        berths: row.berths,
        heads: row.heads,
        maxOccupancy: row.max_occupancy,
        engineHp: row.engine_hp,
        engineType: row.engine_type,
        fuelCapacity: row.fuel_capacity,
        waterCapacity: row.water_capacity,
        designNotes: row.design_notes,
      };

      const allStyles = generateAllStyles(specs);
      const currentScore = scoreDescription(row.description);
      const needsNew = needsGeneratedDescription(row.description);

      return NextResponse.json({
        slug,
        currentDescription: row.description,
        currentScore,
        needsGenerated: needsNew,
        generated: allStyles,
        requestedStyle: generateDescription(specs, style),
      });
    } finally {
      client.release();
    }
  }

  // Report: yachts needing descriptions
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT ym.slug, ym.model_name, m.name as manufacturer,
              ym.description, ym.length_overall,
              LENGTH(COALESCE(ym.description, '')) as desc_length
       FROM yacht_models ym
       JOIN manufacturers m ON m.id = ym.manufacturer_id
       WHERE ym.description IS NULL OR LENGTH(ym.description) < 50
       ORDER BY ym.length_overall DESC NULLS LAST
       LIMIT 50`,
    );

    const report = result.rows.map((r) => ({
      slug: r.slug,
      manufacturer: r.manufacturer,
      modelName: r.model_name,
      currentDescription: r.description,
      score: scoreDescription(r.description),
      lengthOverall: r.length_overall,
    }));

    return NextResponse.json({
      totalNeedingDescription: report.length,
      yachts: report,
    });
  } finally {
    client.release();
  }
}
