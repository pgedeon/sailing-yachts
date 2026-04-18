import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

// --- Rate limiting (in-memory, per IP) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 }); // 1 hour window
    return false;
  }
  entry.count++;
  return entry.count > 3; // max 3 per hour
}

// Periodically prune stale entries (every 10 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, 10 * 60 * 1000);
}

// --- Validation ---
const correctionSchema = z.object({
  yachtModelId: z.number().int().positive("Yacht ID is required"),
  correctionType: z.enum([
    "missing_specification",
    "incorrect_value",
    "outdated_information",
    "wrong_image",
    "other",
  ]).default("incorrect_value"),
  fieldName: z.string().min(1, "Field name is required").max(200),
  currentValue: z.string().max(500).optional(),
  suggestedValue: z.string().min(1, "Suggested value is required").max(1000),
  notes: z.string().max(2000).optional(),
  sourceUrl: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  submitterName: z.string().max(200).optional(),
  submitterEmail: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  // honeypot — must be empty
  website: z.string().max(0).optional(),
});

/**
 * POST /api/corrections
 * Submit a user correction for a yacht spec.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();

    // Honeypot check
    if (body.website) {
      // Silently accept but don't insert (anti-spam)
      return NextResponse.json({ id: 0, status: "pending" }, { status: 201 });
    }

    const parsed = correctionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Verify the yacht exists
    const yachtCheck = await pool.query(
      "SELECT id FROM yacht_models WHERE id = $1",
      [data.yachtModelId],
    );
    if (yachtCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Yacht not found" },
        { status: 404 },
      );
    }

    const result = await pool.query(
      `INSERT INTO user_corrections
        (yacht_model_id, submitter_name, submitter_email, correction_type, field_name, current_value, suggested_value, notes, source_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING id`,
      [
        data.yachtModelId,
        data.submitterName || null,
        data.submitterEmail || null,
        data.correctionType,
        data.fieldName,
        data.currentValue || null,
        data.suggestedValue,
        data.notes || null,
        data.sourceUrl || null,
      ],
    );

    return NextResponse.json(
      { id: result.rows[0].id, status: "pending" },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[corrections] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
