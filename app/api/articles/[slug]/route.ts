import { NextRequest, NextResponse } from "next/server";
import { getArticleBySlug, deleteArticle } from "@/lib/articles";

/**
 * GET /api/articles/[slug]
 * Get a single article by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await getArticleBySlug(params.slug);

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/[slug]
 * Delete an article by slug (admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const success = await deleteArticle(params.slug);

    if (!success) {
      return NextResponse.json(
        { error: "Article not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
