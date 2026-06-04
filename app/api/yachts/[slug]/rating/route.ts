import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { yachtModels } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getRatingStats, getUserRating } from "@/lib/rating-service";
import { getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/yachts/[slug]/rating — Get rating stats for a yacht.
 *
 * Returns: { average, count, distribution, userRating? }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;

    // Find yacht by slug
    const yachtRows = await db
      .select({ id: yachtModels.id })
      .from(yachtModels)
      .where(eq(yachtModels.slug, slug))
      .limit(1);

    if (yachtRows.length === 0) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
    }

    const yachtId = yachtRows[0].id;
    const stats = await getRatingStats(yachtId);

    // Also check if this IP has already rated
    const ip = getClientIp(request);
    const userRating = await getUserRating(yachtId, null, ip);

    return NextResponse.json({
      ...stats,
      userRating,
    });
  } catch (error) {
    console.error("Error fetching rating stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
