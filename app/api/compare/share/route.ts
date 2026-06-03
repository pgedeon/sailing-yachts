import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "edge";

const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 shares per minute

// In-memory rate limiting (per-edge-instance, good enough for this use case)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function generateShareId(): string {
  // Generate a 8-character base62 ID
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  // Use crypto.getRandomValues for edge runtime
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 8; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { yachtIds, title } = body;

    // Validate yachtIds
    if (!Array.isArray(yachtIds) || yachtIds.length < 2 || yachtIds.length > 4) {
      return NextResponse.json(
        { error: "yachtIds must be an array of 2-4 yacht IDs" },
        { status: 400 }
      );
    }

    // Validate each ID is a number
    const validIds = yachtIds.map((id: unknown) => {
      const n = typeof id === "string" ? parseInt(id, 10) : Number(id);
      return isNaN(n) ? null : n;
    });

    if (validIds.some((id: number | null) => id === null)) {
      return NextResponse.json(
        { error: "All yachtIds must be valid numbers" },
        { status: 400 }
      );
    }

    // Validate title if provided
    if (title !== undefined && typeof title !== "string") {
      return NextResponse.json(
        { error: "Title must be a string" },
        { status: 400 }
      );
    }

    const sanitizedTitle = title?.trim().substring(0, 500) || null;

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const sql = neon(databaseUrl);
    const shareId = generateShareId();

    // Insert the shared comparison
    await sql`
      INSERT INTO shared_comparisons (share_id, yacht_ids, title)
      VALUES (${shareId}, ${JSON.stringify(validIds)}, ${sanitizedTitle})
    `;

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

    const sql = neon(databaseUrl);

    const rows = await sql`
      SELECT share_id, yacht_ids, title, view_count, created_at
      FROM shared_comparisons
      WHERE share_id = ${shareId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Shared comparison not found" },
        { status: 404 }
      );
    }

    const row = rows[0];

    // Increment view count (fire-and-forget)
    sql`UPDATE shared_comparisons SET view_count = view_count + 1 WHERE share_id = ${shareId}`.catch(
      () => {}
    );

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
