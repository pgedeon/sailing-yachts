import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { validate, publicReviewSubmissionSchema } from "@/lib/validations";
import { revalidateTag } from "next/cache";

// Simple in-memory rate limiter: max 3 per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();

    // Honeypot check
    if (body.website) {
      // Silently accept but don't store
      return NextResponse.json({ success: true, id: 0 }, { status: 201 });
    }

    const validation = validate(publicReviewSubmissionSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 },
      );
    }

    const data = validation.data;

    // Verify yacht exists
    const yachtCheck = await pool.query(
      "SELECT id FROM yacht_models WHERE id = $1",
      [data.yachtModelId],
    );
    if (yachtCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Yacht model not found" },
        { status: 404 },
      );
    }

    // Build rating_breakdown JSON
    const ratingBreakdown = data.ratingBreakdown
      ? {
          build_quality: data.ratingBreakdown.build_quality ?? null,
          sailing_performance: data.ratingBreakdown.sailing_performance ?? null,
          comfort: data.ratingBreakdown.comfort ?? null,
          value_for_money: data.ratingBreakdown.value_for_money ?? null,
        }
      : {
          build_quality: null,
          sailing_performance: null,
          comfort: null,
          value_for_money: null,
        };

    const reviewerProfile = {
      reviewer_type: data.reviewerType,
    };

    const result = await pool.query(
      `INSERT INTO reviews (
        yacht_model_id, source, rating, summary, full_text,
        author_name, review_type, verified, rating_breakdown,
        helpful_count, reviewer_profile, pros, cons
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        data.yachtModelId,
        "user_submission",
        String(data.rating),
        data.summary,
        data.fullText || null,
        data.authorName,
        data.reviewerType,
        false, // unverified by default
        JSON.stringify(ratingBreakdown),
        0,
        JSON.stringify(reviewerProfile),
        data.pros || [],
        data.cons || [],
      ],
    );

    revalidateTag("yachts");
    revalidateTag(`yacht:${data.yachtModelId}`);

    return NextResponse.json(
      { success: true, id: result.rows[0].id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to submit review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 },
    );
  }
}
