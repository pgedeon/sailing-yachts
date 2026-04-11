import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/related-guides
 * Find guides relevant to a specific yacht based on manufacturer, size, and rig type.
 *
 * Query params:
 *   manufacturer - yacht manufacturer name (e.g. "Beneteau")
 *   lengthOverall - LOA in meters (e.g. 10.5)
 *   rigType - rig type string (e.g. "Sloop", "Cutter")
 *   limit - max results (default 4)
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const manufacturer = sp.get("manufacturer")?.trim();
    const lengthOverall = sp.get("lengthOverall")
      ? parseFloat(sp.get("lengthOverall")!)
      : null;
    const rigType = sp.get("rigType")?.trim();
    const limit = Math.min(parseInt(sp.get("limit") || "4", 10), 8);

    // Build relevance query: search article content/title for matching terms
    const conditions: string[] = ["is_published = true"];
    const params: any[] = [];
    let paramIdx = 1;

    // Score-based relevance: prefer articles whose title or content mentions the manufacturer
    const scoreParts: string[] = [];
    if (manufacturer) {
      const p = paramIdx++;
      params.push(`%${manufacturer}%`);
      scoreParts.push(`CASE WHEN title ILIKE $${p} THEN 3 ELSE 0 END`);
      const p2 = paramIdx++;
      params.push(`%${manufacturer}%`);
      scoreParts.push(
        `CASE WHEN content ILIKE $${p2} OR content_markdown ILIKE $${p2} THEN 1 ELSE 0 END`
      );
    }

    // Size-based relevance: match articles mentioning similar size ranges
    if (lengthOverall) {
      const sizeCategory =
        lengthOverall < 10
          ? "small"
          : lengthOverall < 13
            ? "mid"
            : lengthOverall < 16
              ? "large"
              : "xl";

      const sizeTerms: Record<string, string[]> = {
        small: ["under 10", "under 33", "30 ft", "32 ft", "35 ft", "day sailer", "trailer"],
        mid: ["10-13", "35-42", "36 ft", "38 ft", "40 ft", "coastal cruiser"],
        large: ["13-16", "42-52", "45 ft", "48 ft", "50 ft", "bluewater"],
        xl: ["over 16", "over 50", "over 52", "55 ft", "60 ft", "superyacht"],
      };

      const terms = sizeTerms[sizeCategory] || [];
      if (terms.length > 0) {
        const termConds = terms.map((t) => {
          const p = paramIdx++;
          params.push(`%${t}%`);
          return `CASE WHEN title ILIKE $${p} OR content ILIKE $${p} OR content_markdown ILIKE $${p} THEN 2 ELSE 0 END`;
        });
        scoreParts.push(termConds.join(" + "));
      }
    }

    // Rig type relevance
    if (rigType) {
      const p = paramIdx++;
      params.push(`%${rigType}%`);
      scoreParts.push(`CASE WHEN title ILIKE $${p} THEN 2 ELSE 0 END`);
      const p2 = paramIdx++;
      params.push(`%${rigType}%`);
      scoreParts.push(
        `CASE WHEN content ILIKE $${p2} OR content_markdown ILIKE $${p2} THEN 1 ELSE 0 END`
      );
    }

    const scoreExpr =
      scoreParts.length > 0 ? scoreParts.join(" + ") : "0";

    const limitP = paramIdx++;
    params.push(limit);

    const query = `
      SELECT
        id, slug, title, excerpt, category, featured_image, reading_time_minutes,
        buying_guide_template_id,
        (${scoreExpr}) AS relevance_score
      FROM articles
      WHERE is_published = true
        AND (${scoreExpr}) > 0
      ORDER BY relevance_score DESC, published_at DESC
      LIMIT $${limitP}
    `;

    const result = await pool.query(query, params);

    const guides = result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      category: row.category,
      featuredImage: row.featured_image,
      readingTimeMinutes: row.reading_time_minutes,
      buyingGuideTemplateId: row.buying_guide_template_id || null,
    }));

    return NextResponse.json({ guides });
  } catch (error) {
    console.error("Error fetching related guides:", error);
    return NextResponse.json(
      { error: "Failed to fetch related guides" },
      { status: 500 }
    );
  }
}
