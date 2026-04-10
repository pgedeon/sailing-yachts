import { NextRequest, NextResponse } from "next/server";
import {
  getAllPublishedArticles,
  getArticlesByCategory,
  createArticle,
} from "@/lib/articles";

/**
 * GET /api/articles
 * Get all published articles (public view)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");

    let articles;
    if (category) {
      articles = await getArticlesByCategory(category);
    } else {
      articles = await getAllPublishedArticles();
    }

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles
 * Create a new article (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.slug || !body.title || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, content" },
        { status: 400 }
      );
    }

    // Calculate reading time if not provided
    const readingTimeMinutes = body.readingTimeMinutes || null;

    const newArticle = await createArticle({
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt || null,
      content: body.content,
      contentMarkdown: body.contentMarkdown || null,
      category: body.category || null,
      author: body.author || null,
      authorTitle: body.authorTitle || null,
      featuredImage: body.featuredImage || null,
      readingTimeMinutes,
      isPublished: body.isPublished ?? false,
      publishedAt: body.publishedAt || null,
    });

    if (!newArticle) {
      return NextResponse.json(
        { error: "Failed to create article" },
        { status: 500 }
      );
    }

    return NextResponse.json({ article: newArticle }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
