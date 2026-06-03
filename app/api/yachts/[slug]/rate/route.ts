import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { yachtModels } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { submitRating } from "@/lib/rating-service";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Rate limit: 10 rating submissions per minute per IP
const RATE_LIMIT = { limit: 10, windowSeconds: 60 };

/**
 * POST /api/yachts/[slug]/rate — Submit a rating for a yacht.
 *
 * Body: { score: number } (1-5)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const ip = getClientIp(request);
    const rlResult = checkRateLimit(`rate:${ip}`, RATE_LIMIT);
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rlResult) },
      );
    }

    const { slug } = params;

    // Parse body
    let body: { score?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const score = Number(body?.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json(
        { error: "Score must be an integer between 1 and 5" },
        { status: 400 },
      );
    }

    // Find yacht by slug
    const yachtRows = await db
      .select({ id: yachtModels.id })
      .from(yachtModels)
      .where(eq(yachtModels.slug, slug))
      .limit(1);

    if (yachtRows.length === 0) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
    }

    // Submit the rating (anonymous by IP for now; user_id can be added with auth)
    const stats = await submitRating(yachtRows[0].id, score, null, ip);

    return NextResponse.json(stats, { headers: rateLimitHeaders(rlResult) });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
