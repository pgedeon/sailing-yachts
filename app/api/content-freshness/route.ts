import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/content-freshness
 * Get stale content report: articles that haven't been reviewed in a while.
 *
 * Query params:
 *   days - staleness threshold in days (default 90)
 *   status - filter by review_status (fresh, due, stale)
 *   limit - max results (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const days = parseInt(sp.get("days") || "90", 10);
    const status = sp.get("status");
    const limit = Math.min(parseInt(sp.get("limit") || "20", 10), 50);

    let query = `
      SELECT
        id, slug, title, category, published_at, updated_at,
        last_reviewed_at, review_status,
        CASE
          WHEN last_reviewed_at IS NULL THEN 'never reviewed'
          WHEN updated_at > last_reviewed_at THEN 'updated after review'
          ELSE 'reviewed'
        END AS review_state,
        CASE
          WHEN last_reviewed_at IS NULL THEN 9999
          ELSE EXTRACT(DAY FROM NOW() - last_reviewed_at)::int
        END AS days_since_review
      FROM articles
      WHERE is_published = true
    `;
    const params: any[] = [];
    let paramIdx = 1;

    if (status) {
      query += ` AND review_status = $${paramIdx++}`;
      params.push(status);
    } else {
      // Default: show articles that haven't been reviewed in `days` days
      query += ` AND (last_reviewed_at IS NULL OR last_reviewed_at < NOW() - INTERVAL '1 day' * $${paramIdx++})`;
      params.push(days);
    }

    query += ` ORDER BY days_since_review DESC, updated_at DESC LIMIT $${paramIdx++}`;
    params.push(limit);

    const result = await pool.query(query, params);

    // Auto-update stale statuses
    const updateQuery = `
      UPDATE articles SET review_status = CASE
        WHEN last_reviewed_at IS NULL OR last_reviewed_at < NOW() - INTERVAL '180 days' THEN 'stale'
        WHEN last_reviewed_at < NOW() - INTERVAL '90 days' THEN 'due'
        ELSE 'fresh'
      END
      WHERE is_published = true AND review_status IS DISTINCT FROM (
        CASE
          WHEN last_reviewed_at IS NULL OR last_reviewed_at < NOW() - INTERVAL '180 days' THEN 'stale'
          WHEN last_reviewed_at < NOW() - INTERVAL '90 days' THEN 'due'
          ELSE 'fresh'
        END
      )
    `;
    await pool.query(updateQuery);

    const articles = result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      lastReviewedAt: row.last_reviewed_at,
      reviewStatus: row.review_status || "fresh",
      reviewState: row.review_state,
      daysSinceReview: row.days_since_review,
      editUrl: `/guides/${row.slug}`,
    }));

    // Summary stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE review_status = 'fresh') AS fresh,
        COUNT(*) FILTER (WHERE review_status = 'due') AS due,
        COUNT(*) FILTER (WHERE review_status = 'stale') AS stale,
        COUNT(*) FILTER (WHERE last_reviewed_at IS NULL) AS never_reviewed
      FROM articles WHERE is_published = true
    `);

    return NextResponse.json({
      articles,
      stats: statsResult.rows[0],
      threshold: { days },
    });
  } catch (error) {
    console.error("Error fetching content freshness:", error);
    return NextResponse.json(
      { error: "Failed to fetch content freshness report" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/content-freshness
 * Mark an article as reviewed.
 *
 * Body: { articleId: number }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: "articleId is required" },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE articles SET last_reviewed_at = NOW(), review_status = 'fresh' WHERE id = $1`,
      [articleId]
    );

    return NextResponse.json({ success: true, articleId });
  } catch (error) {
    console.error("Error marking article as reviewed:", error);
    return NextResponse.json(
      { error: "Failed to update review status" },
      { status: 500 }
    );
  }
}
