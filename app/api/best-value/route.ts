import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { calculateValueScore } from "@/app/[locale]/best-value/[slug]/page";

export const dynamic = "force-dynamic";

// Static category definitions for the API (locale-independent)
const BEST_VALUE_CATEGORIES = [
  {
    slug: "40ft-cruisers",
    title: "Best Value 40ft Cruising Sailboats",
    lengthMin: 11.5,
    lengthMax: 12.8,
  },
  {
    slug: "35ft-sailboats",
    title: "Best Value 35ft Sailboats",
    lengthMin: 10.0,
    lengthMax: 11.5,
  },
  {
    slug: "family-cruisers-under-45ft",
    title: "Best Value Family Cruisers Under 45ft",
    lengthMin: 10.5,
    lengthMax: 13.7,
  },
  {
    slug: "bluewater-value",
    title: "Best Value Bluewater Sailboats",
    lengthMin: 10.0,
    lengthMax: 15.0,
  },
];

interface BestValueYachtRow {
  id: number;
  slug: string;
  manufacturer: string;
  modelName: string;
  year: number | null;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  cabins: number | null;
  berths: number | null;
  hullMaterial: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  completenessScore: number | null;
  primaryImageUrl: string | null;
  valueScore: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10), 50);

  // If a specific category is requested, return yachts for that category
  if (category) {
    const catDef = BEST_VALUE_CATEGORIES.find((p) => p.slug === category);
    if (!catDef) {
      return NextResponse.json(
        {
          error: "Invalid category",
          availableCategories: BEST_VALUE_CATEGORIES.map((p) => p.slug),
        },
        { status: 400 }
      );
    }

    const yachts = await fetchBestValueYachts(catDef.lengthMin, catDef.lengthMax, limit);
    return NextResponse.json({
      category: catDef.slug,
      title: catDef.title,
      yachts,
    });
  }

  // Otherwise, return summary for all categories
  const categories = BEST_VALUE_CATEGORIES.map((p) => ({
    slug: p.slug,
    title: p.title,
    lengthRange: `${p.lengthMin}m–${p.lengthMax}m`,
  }));

  // Fetch top 5 from each category for overview
  const results: Record<string, { title: string; yachts: BestValueYachtRow[] }> = {};
  for (const catDef of BEST_VALUE_CATEGORIES) {
    const yachts = await fetchBestValueYachts(catDef.lengthMin, catDef.lengthMax, 5);
    results[catDef.slug] = { title: catDef.title, yachts };
  }

  return NextResponse.json({
    categories,
    data: results,
  });
}

async function fetchBestValueYachts(
  lengthMin: number,
  lengthMax: number,
  limit: number
): Promise<BestValueYachtRow[]> {
  const query = `
    SELECT
      y.id,
      y.slug,
      m.name AS manufacturer,
      y.model_name,
      y.year,
      y.length_overall,
      y.beam,
      y.draft,
      y.displacement,
      y.cabins,
      y.berths,
      y.hull_material,
      y.completeness_score,
      mi.url AS primary_image_url,
      yp.price_min,
      yp.price_max,
      yp.currency
    FROM yacht_models y
    LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
    LEFT JOIN LATERAL (
      SELECT url FROM images
      WHERE yacht_model_id = y.id AND is_primary = true
      LIMIT 1
    ) mi ON true
    LEFT JOIN LATERAL (
      SELECT price_min, price_max, currency
      FROM yacht_prices
      WHERE yacht_model_id = y.id AND is_active = true AND condition = 'new'
      ORDER BY effective_date DESC
      LIMIT 1
    ) yp ON true
    WHERE y.length_overall >= $1
      AND y.length_overall <= $2
    ORDER BY y.cabins DESC NULLS LAST, y.length_overall DESC
    LIMIT $3
  `;

  const result = await pool.query(query, [lengthMin, lengthMax, limit]);

  const yachts: BestValueYachtRow[] = result.rows.map((r: any) => ({
    id: r.id,
    slug: r.slug,
    manufacturer: r.manufacturer,
    modelName: r.model_name,
    year: r.year,
    lengthOverall: r.length_overall ? Number(r.length_overall) : null,
    beam: r.beam ? Number(r.beam) : null,
    draft: r.draft ? Number(r.draft) : null,
    displacement: r.displacement ? Number(r.displacement) : null,
    cabins: r.cabins,
    berths: r.berths,
    hullMaterial: r.hull_material,
    priceMin: r.price_min ? Number(r.price_min) : null,
    priceMax: r.price_max ? Number(r.price_max) : null,
    currency: r.currency,
    completenessScore: r.completeness_score,
    primaryImageUrl: r.primary_image_url,
    valueScore: 0,
  }));

  for (const yacht of yachts) {
    yacht.valueScore = calculateValueScore(yacht);
  }

  yachts.sort((a, b) => b.valueScore - a.valueScore);

  return yachts;
}
