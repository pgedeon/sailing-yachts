import { NextRequest, NextResponse } from "next/server";
import { recordSearchIntent } from "@/lib/search-intents";

/**
 * POST /api/search-intents/record
 * Record a search for intent mining/discovery
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchQuery, matchedIntentSlug } = body;

    if (!searchQuery) {
      return NextResponse.json(
        { error: "Missing required field: searchQuery" },
        { status: 400 }
      );
    }

    await recordSearchIntent(searchQuery, matchedIntentSlug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording search intent:", error);
    return NextResponse.json(
      { error: "Failed to record search intent" },
      { status: 500 }
    );
  }
}
