import { NextRequest, NextResponse } from "next/server";
import { recordSearchIntent } from "@/lib/search-intents";
import { validateBody, searchIntentRecordSchema } from "@/lib/api-validate";

/**
 * POST /api/search-intents/record
 * Record a search for intent mining/discovery
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateBody(searchIntentRecordSchema, body);
    if (!validation.ok) return validation.response;

    const { searchQuery, matchedIntentSlug } = validation.data;

    await recordSearchIntent(searchQuery, matchedIntentSlug ?? undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording search intent:", error);
    return NextResponse.json(
      { error: "Failed to record search intent" },
      { status: 500 }
    );
  }
}
