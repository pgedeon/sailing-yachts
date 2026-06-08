import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/guides/[id]
 * Get a single article by ID (admin — includes drafts).
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const result = await pool.query(`SELECT * FROM articles WHERE id = $1`, [articleId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article: result.rows[0] });
  } catch (error) {
    console.error("Error fetching guide:", error);
    return NextResponse.json({ error: "Failed to fetch guide" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/guides/[id]
 * Update an article.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();

    // Build dynamic SET clause
    const fields: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    const allowedFields: Record<string, string> = {
      title: "title",
      slug: "slug",
      excerpt: "excerpt",
      content: "content",
      contentMarkdown: "content_markdown",
      category: "category",
      author: "author",
      authorTitle: "author_title",
      featuredImage: "featured_image",
      buyingGuideTemplateId: "buying_guide_template_id",
      isPublished: "is_published",
    };

    for (const [key, col] of Object.entries(allowedFields)) {
      if (key in body) {
        fields.push(`${col} = $${paramIdx}`);
        values.push(body[key] ?? null);
        paramIdx++;
      }
    }

    // Recalculate reading time if content changed
    if ("content" in body || "contentMarkdown" in body) {
      const contentText = body.contentMarkdown || body.content || "";
      const wordCount = contentText.split(/\s+/).filter(Boolean).length;
      fields.push(`reading_time_minutes = $${paramIdx}`);
      values.push(Math.max(1, Math.ceil(wordCount / 200)));
      paramIdx++;
    }

    // Set published_at when publishing for the first time
    if (body.isPublished === true) {
      fields.push(`published_at = COALESCE(published_at, $${paramIdx})`);
      values.push(new Date().toISOString());
      paramIdx++;
    }

    // Always update updated_at
    fields.push(`updated_at = $${paramIdx}`);
    values.push(new Date().toISOString());
    paramIdx++;

    if (fields.length === 1) {
      // Only updated_at, nothing to update
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(articleId);

    const result = await pool.query(
      `UPDATE articles SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article: result.rows[0] });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "An article with this slug already exists" }, { status: 409 });
    }
    console.error("Error updating guide:", error);
    return NextResponse.json({ error: "Failed to update guide" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/guides/[id]
 * Delete an article.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const result = await pool.query(`DELETE FROM articles WHERE id = $1 RETURNING id`, [articleId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting guide:", error);
    return NextResponse.json({ error: "Failed to delete guide" }, { status: 500 });
  }
}
