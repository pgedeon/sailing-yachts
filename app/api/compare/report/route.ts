/**
 * P26.4: Premium comparison report (PDF) — Lead-gated download
 * POST /api/compare/report
 *
 * Accepts: { yachtIds: number[], email: string, name?: string }
 * Saves lead, generates branded PDF, returns application/pdf
 */

import { NextRequest, NextResponse } from "next/server";
import { db, leads } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { edgePool } from "@/lib/edge-pool";
import { generateComparisonReport, type ReportYacht } from "@/lib/pdf-report";
import { trackExportDownload } from "@/lib/revenue-analytics";
import { validate, compareReportSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReportRequestBody {
  yachtIds: number[];
  email: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const validation = validate(compareReportSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 },
      );
    }

    const { email, name, yachtIds: ids } = validation.data;
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const yachtQuery = `
      SELECT
        y.id, y.model_name, y.manufacturer_id, y.year, y.slug,
        y.length_overall, y.beam, y.draft, y.displacement, y.ballast,
        y.sail_area_main, y.rig_type, y.keel_type, y.hull_material,
        y.cabins, y.berths, y.heads, y.engine_hp, y.engine_type,
        m.name AS manufacturer_name
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      WHERE y.id IN (${placeholders})
    `;
    const result = await edgePool.query(yachtQuery, ids);
    const rows = result.rows as any[];

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "Could not find enough yachts for comparison" },
        { status: 404 },
      );
    }

    const reportYachts: ReportYacht[] = rows.map((row) => ({
      id: row.id,
      manufacturer: row.manufacturer_name ?? "",
      modelName: row.model_name,
      year: row.year ?? null,
      lengthOverall: row.length_overall ? Number(row.length_overall) : null,
      beam: row.beam ? Number(row.beam) : null,
      draft: row.draft ? Number(row.draft) : null,
      displacement: row.displacement ? Number(row.displacement) : null,
      ballast: row.ballast ? Number(row.ballast) : null,
      sailAreaMain: row.sail_area_main ? Number(row.sail_area_main) : null,
      rigType: row.rig_type ?? null,
      keelType: row.keel_type ?? null,
      hullMaterial: row.hull_material ?? null,
      cabins: row.cabins ?? null,
      berths: row.berths ?? null,
      heads: row.heads ?? null,
      engineHp: row.engine_hp ? Number(row.engine_hp) : null,
      engineType: row.engine_type ?? null,
    }));

    // Save lead (lead gate)
    const yachtIdsStr = ids.join(",");
    const existingLead = await db.query.leads.findFirst({
      where: and(
        eq(leads.email, email),
        eq(leads.yachtIds, yachtIdsStr),
      ),
    });

    if (!existingLead) {
      await db.insert(leads).values({
        name: name || "PDF Report Download",
        email: email,
        yachtIds: yachtIdsStr,
        source: "compare_pdf_report",
        leadType: "general",
        status: "new",
        pageUrl: "/compare",
        metadata: {
          yachtNames: reportYachts.map((y) => `${y.manufacturer} ${y.modelName}`),
          reportType: "pdf_comparison",
        },
      });
    }

    // Generate PDF
    const pdfBytes = await generateComparisonReport(reportYachts, {
      email: email,
      name: name,
    });

    // Track analytics
    try {
      await trackExportDownload({
        format: "pdf",
        yachtIds: ids,
        page: "/compare",
      });
    } catch {
      // Non-blocking — analytics failure shouldn't block PDF
    }

    // Return PDF
    const yachtNames = reportYachts
      .map((y) => `${y.manufacturer}-${y.modelName}`)
      .join("-vs-")
      .toLowerCase()
      .replace(/\s+/g, "-");

    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comparison-${yachtNames}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("PDF report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error.message },
      { status: 500 },
    );
  }
}

/**
 * GET /api/compare/report?count=true
 * Returns download count for admin dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get("count");

  if (countOnly === "true") {
    const result = await db.query.leads.findMany({
      where: eq(leads.source, "compare_pdf_report"),
    });

    return NextResponse.json({
      totalDownloads: result.length,
      recentDownloads: result.slice(-10).reverse(),
    });
  }

  return NextResponse.json(
    { error: "Use POST to generate a report" },
    { status: 405 },
  );
}
