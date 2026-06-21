import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? null : n;
}

/**
 * GET /api/admin/corrections?status=pending&yachtId=123&limit=20&offset=0
 * List user corrections with optional filters.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();


  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const yachtId = searchParams.get("yachtId");
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (status && ["pending", "accepted", "rejected"].includes(status)) {
      conditions.push(`uc.status = $${paramIdx++}`);
      params.push(status);
    }

    if (yachtId) {
      conditions.push(`uc.yacht_model_id = $${paramIdx++}`);
      params.push(Number(yachtId));
    }

    const whereClause = conditions.length > 0
      ? "WHERE " + conditions.join(" AND ")
      : "";

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT uc.*, ym.model_name, ym.slug as yacht_slug, m.name as manufacturer_name
       FROM user_corrections uc
       LEFT JOIN yacht_models ym ON uc.yacht_model_id = ym.id
       LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
       ${whereClause}
       ORDER BY uc.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      params,
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM user_corrections uc ${whereClause}`,
      params.slice(0, -2), // exclude limit/offset
    );

    const corrections = result.rows.map((row: Record<string, unknown>) => ({
      id: toNum(row.id as string | number | null),
      yachtModelId: toNum(row.yacht_model_id as string | number | null),
      modelName: (row.model_name as string) ?? null,
      yachtSlug: (row.yacht_slug as string) ?? null,
      manufacturerName: (row.manufacturer_name as string) ?? null,
      submitterName: (row.submitter_name as string) ?? null,
      submitterEmail: (row.submitter_email as string) ?? null,
      correctionType: (row.correction_type as string) ?? "incorrect_value",
      fieldName: (row.field_name as string) ?? null,
      currentValue: (row.current_value as string) ?? null,
      suggestedValue: (row.suggested_value as string) ?? null,
      notes: (row.notes as string) ?? null,
      sourceUrl: (row.source_url as string) ?? null,
      status: (row.status as string) ?? "pending",
      adminNotes: (row.admin_notes as string) ?? null,
      createdAt: (row.created_at as string) ?? null,
      reviewedAt: (row.reviewed_at as string) ?? null,
    }));

    return NextResponse.json({
      corrections,
      total: countResult.rows[0]?.total ?? 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[admin/corrections] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
