import { NextRequest, NextResponse } from "next/server";
import { getAllSearchIntents, createSearchIntent } from "@/lib/search-intents";

/**
 * GET /api/search-intents
 * Get all search intents (admin view)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const published = searchParams.get("published");

    let intents = await getAllSearchIntents();

    if (published === "true") {
      intents = intents.filter((intent) => intent.isPublished);
    } else if (published === "false") {
      intents = intents.filter((intent) => !intent.isPublished);
    }

    return NextResponse.json({ intents });
  } catch (error) {
    console.error("Error fetching search intents:", error);
    return NextResponse.json(
      { error: "Failed to fetch search intents" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search-intents
 * Create a new search intent (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.slug || !body.title || !body.intro) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, intro" },
        { status: 400 }
      );
    }

    const newIntent = await createSearchIntent({
      slug: body.slug,
      title: body.title,
      metaDescription: body.metaDescription || null,
      intro: body.intro,
      icon: body.icon || "🔍",
      filters: body.filters || null,
      maxResults: body.maxResults || 12,
      category: body.category || null,
      isPublished: body.isPublished ?? false,
      searchQuery: body.searchQuery || null,
    });

    if (!newIntent) {
      return NextResponse.json(
        { error: "Failed to create search intent" },
        { status: 500 }
      );
    }

    return NextResponse.json({ intent: newIntent }, { status: 201 });
  } catch (error) {
    console.error("Error creating search intent:", error);
    return NextResponse.json(
      { error: "Failed to create search intent" },
      { status: 500 }
    );
  }
}
