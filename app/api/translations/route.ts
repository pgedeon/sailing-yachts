import { NextRequest, NextResponse } from "next/server";
import { getApprovedTranslation, type ContentType } from "@/lib/translation-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/translations?contentType=yacht_description&contentId=123&fieldName=description&targetLocale=fr
 * 
 * Returns an approved translation for a content item.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("contentType") as ContentType | null;
    const contentId = searchParams.get("contentId");
    const fieldName = searchParams.get("fieldName");
    const targetLocale = searchParams.get("targetLocale") ?? "fr";

    if (!contentType || !contentId || !fieldName) {
      return NextResponse.json(
        { error: "Missing required params: contentType, contentId, fieldName" },
        { status: 400 }
      );
    }

    const translatedText = await getApprovedTranslation(
      contentType,
      Number(contentId),
      fieldName,
      targetLocale
    );

    return NextResponse.json({
      contentType,
      contentId: Number(contentId),
      fieldName,
      targetLocale,
      translatedText,
    });
  } catch (error) {
    console.error("Public translation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
