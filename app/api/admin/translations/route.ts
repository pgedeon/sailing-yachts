import { NextRequest, NextResponse } from "next/server";
import {
  getTranslationStats,
  getTranslationQueue,
  getTranslation,
  updateTranslationStatus,
  updateTranslationText,
  upsertTranslation,
  autoGenerateYachtTranslations,
  autoGenerateManufacturerTranslations,
  autoGenerateArticleTranslations,
  bulkApproveAutoTranslations,
  getTranslationMemoryStats,
  type TranslationStatus,
  type ContentType,
} from "@/lib/translation-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/translations — stats + queue */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // /api/admin/translations?action=stats
    if (action === "stats") {
      const [stats, memoryStats] = await Promise.all([
        getTranslationStats(),
        getTranslationMemoryStats(),
      ]);
      return NextResponse.json({ stats, memoryStats });
    }

    // /api/admin/translations?action=memory
    if (action === "memory") {
      const memoryStats = await getTranslationMemoryStats();
      return NextResponse.json(memoryStats);
    }

    // /api/admin/translations?id=123
    const id = searchParams.get("id");
    if (id) {
      const translation = await getTranslation(Number(id));
      if (!translation) {
        return NextResponse.json({ error: "Translation not found" }, { status: 404 });
      }
      return NextResponse.json(translation);
    }

    // Default: return queue
    const status = searchParams.get("status") as TranslationStatus | null;
    const contentType = searchParams.get("contentType") as ContentType | null;
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

    const queue = await getTranslationQueue(
      status ?? undefined,
      contentType ?? undefined,
      limit,
      offset
    );
    return NextResponse.json(queue);
  } catch (error) {
    console.error("Translation API GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/admin/translations — create/update, auto-generate, bulk approve */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    // Auto-generate yacht translations
    if (action === "auto-generate-yachts") {
      const result = await autoGenerateYachtTranslations();
      return NextResponse.json(result);
    }

    // Auto-generate manufacturer translations
    if (action === "auto-generate-manufacturers") {
      const result = await autoGenerateManufacturerTranslations();
      return NextResponse.json(result);
    }

    // Auto-generate article translations
    if (action === "auto-generate-articles") {
      const result = await autoGenerateArticleTranslations();
      return NextResponse.json(result);
    }

    // Bulk approve auto-translations
    if (action === "bulk-approve") {
      const contentType = body.contentType as ContentType | undefined;
      const count = await bulkApproveAutoTranslations(contentType);
      return NextResponse.json({ approved: count });
    }

    // Create/update a translation
    if (body.contentType && body.contentId && body.fieldName && body.translatedText) {
      const translation = await upsertTranslation({
        contentType: body.contentType,
        contentId: Number(body.contentId),
        fieldName: body.fieldName,
        sourceLocale: body.sourceLocale,
        targetLocale: body.targetLocale,
        sourceText: body.sourceText,
        translatedText: body.translatedText,
        translationMethod: body.translationMethod,
        status: body.status,
        qualityScore: body.qualityScore,
      });
      return NextResponse.json(translation);
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  } catch (error) {
    console.error("Translation API POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PATCH /api/admin/translations — update status or text */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Update status
    if (body.status) {
      const translation = await updateTranslationStatus(
        Number(body.id),
        body.status as TranslationStatus,
        body.reviewerId
      );
      if (!translation) {
        return NextResponse.json({ error: "Translation not found" }, { status: 404 });
      }
      return NextResponse.json(translation);
    }

    // Update translated text
    if (body.translatedText) {
      const translation = await updateTranslationText(
        Number(body.id),
        body.translatedText,
        body.translationMethod
      );
      if (!translation) {
        return NextResponse.json({ error: "Translation not found" }, { status: 404 });
      }
      return NextResponse.json(translation);
    }

    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  } catch (error) {
    console.error("Translation API PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
