import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/guides/yacht-search
 * Search yacht models for the guide form autocomplete.
 * Query: ?q=search+term&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    if (query.length < 2) {
      return NextResponse.json({ yachts: [] });
    }

    const result = await pool.query(
      `SELECT ym.id, ym.slug, ym.model_name, ym.year, m.name as manufacturer_name,
              ym.length_overall, ym.rig_type
       FROM yacht_models ym
       JOIN manufacturers m ON ym.manufacturer_id = m.id
       WHERE (ym.model_name ILIKE $1 OR m.name ILIKE $1)
       ORDER BY
         CASE WHEN m.name ILIKE $1 THEN 0 ELSE 1 END,
         CASE WHEN ym.model_name ILIKE $1 THEN 0 ELSE 1 END,
         m.name, ym.model_name, ym.year DESC
       LIMIT $2`,
      [`%${query}%`, limit]
    );

    const yachts = result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      modelName: row.model_name,
      year: row.year,
      manufacturerName: row.manufacturer_name,
      lengthOverall: row.length_overall,
      rigType: row.rig_type,
      label: `${row.manufacturer_name} ${row.model_name} (${row.year})`,
    }));

    return NextResponse.json({ yachts });
  } catch (error) {
    console.error("Error searching yachts for guide form:", error);
    return NextResponse.json(
      { error: "Failed to search yachts" },
      { status: 500 }
    );
  }
}
