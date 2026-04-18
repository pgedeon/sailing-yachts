import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? null : n;
}

function mapCorrection(row: Record<string, unknown>) {
  return {
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
  };
}

const patchSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
  adminNotes: z.string().max(2000).optional(),
});

/**
 * GET /api/admin/corrections/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = cookies();
  const authCookie = cookieStore.get("auth")?.value;

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const correctionId = Number(id);
    if (Number.isNaN(correctionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT uc.*, ym.model_name, ym.slug as yacht_slug, m.name as manufacturer_name
       FROM user_corrections uc
       LEFT JOIN yacht_models ym ON uc.yacht_model_id = ym.id
       LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
       WHERE uc.id = $1`,
      [correctionId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Correction not found" }, { status: 404 });
    }

    return NextResponse.json(mapCorrection(result.rows[0]));
  } catch (error: any) {
    console.error("[admin/corrections/[id]] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/corrections/[id]
 * Accept or reject a correction. When accepted, auto-updates the yacht_model field.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = cookies();
  const authCookie = cookieStore.get("auth")?.value;

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const correctionId = Number(id);
    if (Number.isNaN(correctionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { status, adminNotes } = parsed.data;

    // Fetch the correction
    const correctionResult = await pool.query(
      "SELECT * FROM user_corrections WHERE id = $1",
      [correctionId],
    );
    if (correctionResult.rows.length === 0) {
      return NextResponse.json({ error: "Correction not found" }, { status: 404 });
    }

    const correction = correctionResult.rows[0];

    // If already reviewed, prevent re-review
    if (correction.status !== "pending") {
      return NextResponse.json(
        { error: `Correction already ${correction.status}` },
        { status: 409 },
      );
    }

    // If accepted, apply the correction to the yacht model
    if (status === "accepted") {
      const fieldName = correction.field_name;
      const suggestedValue = correction.suggested_value;
      const yachtModelId = correction.yacht_model_id;

      // Map frontend field names to DB column names
      const fieldToColumn: Record<string, string> = {
        lengthOverall: "length_overall",
        beam: "beam",
        draft: "draft",
        displacement: "displacement",
        ballast: "ballast",
        sailAreaMain: "sail_area_main",
        rigType: "rig_type",
        keelType: "keel_type",
        hullMaterial: "hull_material",
        cabins: "cabins",
        berths: "berths",
        heads: "heads",
        maxOccupancy: "max_occupancy",
        engineHp: "engine_hp",
        engineType: "engine_type",
        fuelCapacity: "fuel_capacity",
        waterCapacity: "water_capacity",
        designNotes: "design_notes",
        description: "description",
      };

      const columnName = fieldToColumn[fieldName] || fieldName;

      // Use parameterized query — can't parameterize column names, so whitelist it
      const allowedColumns = new Set(Object.values(fieldToColumn));
      if (!allowedColumns.has(columnName)) {
        return NextResponse.json(
          { error: `Cannot update field: ${fieldName}` },
          { status: 400 },
        );
      }

      // Determine if numeric field for casting
      const numericFields = new Set([
        "length_overall", "beam", "draft", "displacement", "ballast",
        "sail_area_main", "cabins", "berths", "heads", "max_occupancy",
        "engine_hp", "fuel_capacity", "water_capacity",
      ]);

      if (numericFields.has(columnName)) {
        const numValue = Number(suggestedValue);
        if (Number.isNaN(numValue)) {
          return NextResponse.json(
            { error: `Invalid numeric value for ${fieldName}` },
            { status: 400 },
          );
        }
        await pool.query(
          `UPDATE yacht_models SET ${columnName} = $1, updated_at = NOW() WHERE id = $2`,
          [numValue, yachtModelId],
        );
      } else {
        await pool.query(
          `UPDATE yacht_models SET ${columnName} = $1, updated_at = NOW() WHERE id = $2`,
          [suggestedValue, yachtModelId],
        );
      }
    }

    // Update the correction status
    const updateResult = await pool.query(
      `UPDATE user_corrections
       SET status = $1, admin_notes = $2, reviewed_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, adminNotes || null, correctionId],
    );

    return NextResponse.json(mapCorrection(updateResult.rows[0]));
  } catch (error: any) {
    console.error("[admin/corrections/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/corrections/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = cookies();
  const authCookie = cookieStore.get("auth")?.value;

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const correctionId = Number(id);
    if (Number.isNaN(correctionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const result = await pool.query(
      "DELETE FROM user_corrections WHERE id = $1 RETURNING id",
      [correctionId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Correction not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true, id: correctionId });
  } catch (error: any) {
    console.error("[admin/corrections/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
