import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/guides/[id]
 * Get a single article by ID (admin — includes drafts) with related yachts.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const result = await pool.query(`SELECT * FROM articles WHERE id = $1`, [articleId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Fetch related yachts
    const yachtsResult = await pool.query(
      `SELECT ym.id, ym.slug, ym.model_name, ym.year, m.name as manufacturer_name, ay.sort_order
       FROM article_yachts ay
       JOIN yacht_models ym ON ay.yacht_model_id = ym.id
       JOIN manufacturers m ON ym.manufacturer_id = m.id
       WHERE ay.article_id = $1
       ORDER BY ay.sort_order, ym.model_name`,
      [articleId]
    );

    const article = {
      ...result.rows[0],
      relatedYachts: yachtsResult.rows,
    };

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error fetching guide:", error);
    return NextResponse.json({ error: "Failed to fetch guide" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/guides/[id]
 * Update an article including SEO fields and related yachts.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
      metaTitle: "meta_title",
      metaDescription: "meta_description",
      ogImage: "og_image",
      canonicalUrl: "canonical_url",
      noindex: "noindex",
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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE articles SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }

      // Update related yachts if provided
      if (body.relatedYachtIds !== undefined) {
        // Delete existing relations
        await client.query(`DELETE FROM article_yachts WHERE article_id = $1`, [articleId]);

        // Insert new relations
        if (Array.isArray(body.relatedYachtIds) && body.relatedYachtIds.length > 0) {
          for (let i = 0; i < body.relatedYachtIds.length; i++) {
            await client.query(
              `INSERT INTO article_yachts (article_id, yacht_model_id, sort_order)
               VALUES ($1, $2, $3)
               ON CONFLICT (article_id, yacht_model_id) DO NOTHING`,
              [articleId, body.relatedYachtIds[i], i]
            );
          }
        }
      }

      await client.query("COMMIT");

      // Fetch with related yachts for response
      const yachtsResult = await client.query(
        `SELECT ym.id, ym.slug, ym.model_name, ym.year, m.name as manufacturer_name, ay.sort_order
         FROM article_yachts ay
         JOIN yacht_models ym ON ay.yacht_model_id = ym.id
         JOIN manufacturers m ON ym.manufacturer_id = m.id
         WHERE ay.article_id = $1
         ORDER BY ay.sort_order, ym.model_name`,
        [articleId]
      );

      const article = {
        ...result.rows[0],
        relatedYachts: yachtsResult.rows,
      };

      return NextResponse.json({ article });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
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
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // article_yachts will be cascaded automatically
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
