import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/guides
 * List all articles (including drafts) for admin CMS.
 * Query params: ?search=...&category=...&status=draft|published&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(title ILIKE $${paramIdx} OR slug ILIKE $${paramIdx} OR author ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (category) {
      conditions.push(`category = $${paramIdx}`);
      params.push(category);
      paramIdx++;
    }

    if (status === "published") {
      conditions.push(`is_published = true`);
    } else if (status === "draft") {
      conditions.push(`is_published = false`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM articles ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch
    const result = await pool.query(
      `SELECT id, slug, title, excerpt, category, author, author_title, featured_image,
              reading_time_minutes, buying_guide_template_id, is_published, published_at,
              created_at, updated_at, last_reviewed_at, review_status
       FROM articles ${whereClause}
       ORDER BY updated_at DESC NULLS LAST, created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    const articles = result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      category: row.category,
      author: row.author,
      authorTitle: row.author_title,
      featuredImage: row.featured_image,
      readingTimeMinutes: row.reading_time_minutes,
      buyingGuideTemplateId: row.buying_guide_template_id,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastReviewedAt: row.last_reviewed_at,
      reviewStatus: row.review_status,
    }));

    // Get categories for filter
    const catResult = await pool.query(
      `SELECT category, COUNT(*) as count FROM articles WHERE category IS NOT NULL GROUP BY category ORDER BY category`
    );
    const categories = catResult.rows.map((r) => ({
      name: r.category,
      count: parseInt(r.count, 10),
    }));

    return NextResponse.json({
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      categories,
    });
  } catch (error) {
    console.error("Error fetching admin guides:", error);
    return NextResponse.json(
      { error: "Failed to fetch guides" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/guides
 * Create a new guide/article.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    if (!body.slug || !body.title) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title" },
        { status: 400 }
      );
    }

    // Calculate reading time from content/markdown
    const contentText = body.contentMarkdown || body.content || "";
    const wordCount = contentText.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = body.readingTimeMinutes || Math.max(1, Math.ceil(wordCount / 200));

    const result = await pool.query(
      `INSERT INTO articles (slug, title, excerpt, content, content_markdown, category, author, author_title,
         featured_image, reading_time_minutes, buying_guide_template_id, is_published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        body.slug,
        body.title,
        body.excerpt || null,
        body.content || "",
        body.contentMarkdown || null,
        body.category || null,
        body.author || null,
        body.authorTitle || null,
        body.featuredImage || null,
        readingTimeMinutes,
        body.buyingGuideTemplateId || null,
        body.isPublished ?? false,
        body.isPublished ? new Date().toISOString() : null,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
    }

    return NextResponse.json({ article: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "An article with this slug already exists" }, { status: 409 });
    }
    console.error("Error creating guide:", error);
    return NextResponse.json({ error: "Failed to create guide" }, { status: 500 });
  }
}
