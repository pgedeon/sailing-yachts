import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { buildFallbackAlsoViewed } from "@/lib/also-viewed";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json(
      { yachts: [], error: "DATABASE_URL not configured" },
      { status: 500 },
    );
  }

  try {
    const sql = neon(connectionString);

    // Get current yacht info
    const currentRows = await sql`
      SELECT ym.id, ym.length_overall, ym.manufacturer_id, m.name as manufacturer
      FROM yacht_models ym
      JOIN manufacturers m ON m.id = ym.manufacturer_id
      WHERE ym.slug = ${slug}
    `;

    if (currentRows.length === 0) {
      return NextResponse.json({ yachts: [] }, { status: 404 });
    }

    const current = currentRows[0];
    const loa = Number(current.length_overall) || 0;
    const loaMin = Math.max(0, loa - 3);
    const loaMax = loa + 3;

    // Get candidate yachts
    const candidates = await sql`
      SELECT ym.id, m.name as manufacturer, ym.model_name as "modelName",
              ym.slug, ym.year, ym.length_overall as "lengthOverall",
              ym.manufacturer_id as "manufacturerId",
              (SELECT yi.url FROM yacht_images yi WHERE yi.yacht_model_id = ym.id AND yi.is_primary = true LIMIT 1) as "primaryImage"
       FROM yacht_models ym
       JOIN manufacturers m ON m.id = ym.manufacturer_id
       WHERE ym.id != ${current.id}
         AND ym.length_overall IS NOT NULL
         AND ym.length_overall >= ${loaMin}
         AND ym.length_overall <= ${loaMax}
       ORDER BY ym.length_overall ASC
       LIMIT 30
    `;

    const yachts = buildFallbackAlsoViewed(
      candidates.map((r: Record<string, unknown>) => ({
        id: r.id as number,
        manufacturer: r.manufacturer as string,
        modelName: r.modelName as string,
        slug: r.slug as string,
        year: r.year as number,
        lengthOverall: r.lengthOverall as string | number | null,
        manufacturerId: r.manufacturerId as number | null,
        primaryImage: r.primaryImage as string | null,
      })),
      {
        id: current.id as number,
        lengthOverall: current.length_overall as string | number | null,
        manufacturerId: current.manufacturer_id as number | null,
        manufacturer: current.manufacturer as string,
      },
      6,
    );

    return NextResponse.json({ yachts });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Also-viewed API error:", message);
    return NextResponse.json(
      { yachts: [], error: message },
      { status: 500 },
    );
  }
}
