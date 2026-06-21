import { NextRequest, NextResponse } from "next/server";
import { edgePool } from "@/lib/edge-pool";
import { checkRateLimit, getClientIp, rateLimitHeaders, WRITE_RATE_LIMIT } from "@/lib/rate-limit";
import { validate, compareShareSchema } from "@/lib/validations";

function generateShareId(): string {
  // Generate a 8-character base62 ID
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  // Use crypto.getRandomValues (available in both Edge and Node runtimes)
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 8; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rlResult = checkRateLimit(`compare-share:${ip}`, WRITE_RATE_LIMIT);
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)),
            ...rateLimitHeaders(rlResult),
          },
        }
      );
    }

    const rawBody = await request.json();
    const validation = validate(compareShareSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const validIds = validation.data.yachtIds;
    const sanitizedTitle = validation.data.title?.trim().substring(0, 500) || null;

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const shareId = generateShareId();

    // Insert the shared comparison
    await edgePool.query(
      `INSERT INTO shared_comparisons (share_id, yacht_ids, title)
       VALUES ($1, $2, $3)`,
      [shareId, JSON.stringify(validIds), sanitizedTitle]
    );

    return NextResponse.json({
      shareId,
      url: `/compare/s/${shareId}`,
      yachtIds: validIds,
    });
  } catch (error) {
    console.error("Error creating shared comparison:", error);
    return NextResponse.json(
      { error: "Failed to create shared comparison" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      return NextResponse.json(
        { error: "shareId query parameter is required" },
        { status: 400 }
      );
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const result = await edgePool.query(
      `SELECT share_id, yacht_ids, title, view_count, created_at
       FROM shared_comparisons
       WHERE share_id = $1`,
      [shareId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Shared comparison not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    // Increment view count (fire-and-forget)
    edgePool.query(
      `UPDATE shared_comparisons SET view_count = view_count + 1 WHERE share_id = $1`,
      [shareId]
    ).catch(() => {});

    return NextResponse.json({
      shareId: row.share_id,
      yachtIds: row.yacht_ids,
      title: row.title,
      viewCount: row.view_count,
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error("Error fetching shared comparison:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared comparison" },
      { status: 500 }
    );
  }
}
