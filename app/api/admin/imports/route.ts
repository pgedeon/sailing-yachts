import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { importYachts, getImportJob, getImportJobs, type YachtImportRecord, type ManufacturerImport } from "@/lib/data-import";

// Simple admin auth check
function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  // Check against CRON_SECRET or ADMIN_KEY env var
  const adminKey = process.env.CRON_SECRET || process.env.ADMIN_KEY || "";
  return authHeader === `Bearer ${adminKey}`;
}

/**
 * POST /api/admin/imports
 * Trigger a data import.
 * 
 * Body: { source, confidence, manufacturers, records }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { source, confidence, manufacturers, records } = body as {
      source: string;
      confidence?: number;
      manufacturers: ManufacturerImport[];
      records: YachtImportRecord[];
    };

    if (!source || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Missing required fields: source, records" },
        { status: 400 },
      );
    }

    const result = await importYachts(
      records,
      manufacturers || [],
      source,
      confidence || 70,
    );

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      added: result.added,
      duplicates: result.duplicates,
      errors: result.errors,
      duplicateDetails: result.duplicateDetails.slice(0, 50), // Limit output
      errorCount: result.errorDetails.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Import failed", details: error.message },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin/imports
 * List import jobs or get a specific job.
 * 
 * Query params: ?jobId=123 or ?limit=20
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (jobId) {
      const job = await getImportJob(parseInt(jobId, 10));
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json({ job });
    }

    const jobs = await getImportJobs(limit);
    return NextResponse.json({ jobs });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch jobs", details: error.message },
      { status: 500 },
    );
  }
}
