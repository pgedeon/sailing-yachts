import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { yachtModels } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getRatingStats, getUserRating } from "@/lib/rating-service";
import { getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/yachts/[slug]/rating — Get rating stats for a yacht.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Find yacht by slug
    const yachtRows = await db
      .select({ id: yachtModels.id })
      .from(yachtModels)
      .where(eq(yachtModels.slug, slug))
      .limit(1);

    if (yachtRows.length === 0) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
    }

    const stats = await getRatingStats(yachtRows[0].id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching rating stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
