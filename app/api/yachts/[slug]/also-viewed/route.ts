import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { buildFallbackAlsoViewed } from "@/lib/also-viewed";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const client = await pool.connect();
  try {
    // Get current yacht info
    const currentResult = await client.query(
      `SELECT ym.id, ym.length_overall, ym.manufacturer_id, m.name as manufacturer
       FROM yacht_models ym
       JOIN manufacturers m ON m.id = ym.manufacturer_id
       WHERE ym.slug = $1`,
      [slug],
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ yachts: [] }, { status: 404 });
    }

    const current = currentResult.rows[0];

    // Get candidate yachts (same-ish size range, excluding current)
    const loa = Number(current.length_overall) || 0;
    const loaMin = Math.max(0, loa - 3);
    const loaMax = loa + 3;

    const candidatesResult = await client.query(
      `SELECT ym.id, m.name as manufacturer, ym.model_name as "modelName",
              ym.slug, ym.year, ym.length_overall as "lengthOverall",
              ym.manufacturer_id as "manufacturerId",
              (SELECT yi.url FROM yacht_images yi WHERE yi.yacht_model_id = ym.id AND yi.is_primary = true LIMIT 1) as "primaryImage"
       FROM yacht_models ym
       JOIN manufacturers m ON m.id = ym.manufacturer_id
       WHERE ym.id != $1
         AND ym.length_overall IS NOT NULL
         AND ym.length_overall >= $2
         AND ym.length_overall <= $3
       ORDER BY ym.length_overall ASC
       LIMIT 30`,
      [current.id, loaMin, loaMax],
    );

    const yachts = buildFallbackAlsoViewed(
      candidatesResult.rows.map((r) => ({
        ...r,
        lengthOverall: r.lengthOverall,
        manufacturerId: r.manufacturerId,
      })),
      {
        id: current.id,
        lengthOverall: current.length_overall,
        manufacturerId: current.manufacturer_id,
        manufacturer: current.manufacturer,
      },
      6,
    );

    return NextResponse.json({ yachts });
  } catch (err) {
    console.error("Also-viewed API error:", err);
    return NextResponse.json({ yachts: [] }, { status: 500 });
  } finally {
    client.release();
  }
}
