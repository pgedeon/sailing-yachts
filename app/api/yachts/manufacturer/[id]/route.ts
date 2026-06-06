import { eq, desc, inArray, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db, yachtModels, manufacturers, images } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const manufacturerId = parseInt(id, 10);

    if (isNaN(manufacturerId)) {
      return NextResponse.json({ error: "Invalid manufacturer ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const excludeId = searchParams.get("exclude")
      ? parseInt(searchParams.get("exclude")!, 10)
      : null;
    const rawLimit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : 3;
    const limit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 3 : rawLimit));

    // Fetch yachts from this manufacturer
    const yachtRows = await db
      .select({
        yacht: yachtModels,
        manufacturer: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(eq(yachtModels.manufacturerId, manufacturerId))
      .orderBy(desc(yachtModels.createdAt), asc(yachtModels.modelName))
      .limit(limit + (excludeId ? 1 : 0)); // Fetch one extra to account for excluded

    // Filter out excluded yacht
    const filteredYachts = excludeId
      ? yachtRows.filter((row: { yacht: typeof yachtModels.$inferSelect }) => row.yacht.id !== excludeId)
      : yachtRows;

    // Get IDs for image query
    const yachtIds = filteredYachts.map((row: { yacht: typeof yachtModels.$inferSelect }) => row.yacht.id);

    // Fetch primary images
    const imageRows =
      yachtIds.length > 0
        ? await db
            .select({
              yachtModelId: images.yachtModelId,
              url: images.url,
              isPrimary: images.isPrimary,
              sortOrder: images.sortOrder,
            })
            .from(images)
            .where(
              inArray(
                images.yachtModelId,
                filteredYachts.map((row: { yacht: typeof yachtModels.$inferSelect }) => row.yacht.id)
              )
            )
            .orderBy(asc(images.yachtModelId), desc(images.isPrimary), asc(images.sortOrder))
        : [];

    // Build map of primary image per yacht
    const primaryImageByYachtId = new Map<number, string>();
    for (const img of imageRows) {
      if (!primaryImageByYachtId.has(img.yachtModelId)) {
        primaryImageByYachtId.set(img.yachtModelId, img.url);
      }
    }

    const yachts = filteredYachts.slice(0, limit).map((row: { yacht: typeof yachtModels.$inferSelect; manufacturer: string | null }) => ({
      id: row.yacht.id,
      slug: row.yacht.slug,
      manufacturer: row.manufacturer || "Unknown",
      modelName: row.yacht.modelName,
      year: row.yacht.year,
      lengthOverall: row.yacht.lengthOverall
        ? parseFloat(row.yacht.lengthOverall)
        : null,
      primaryImage: primaryImageByYachtId.get(row.yacht.id) || null,
    }));

    return NextResponse.json({ yachts });
  } catch (error) {
    console.error("[API] /yachts/manufacturer/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch manufacturer yachts" },
      { status: 500 }
    );
  }
}
