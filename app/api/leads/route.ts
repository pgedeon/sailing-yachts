import { NextRequest, NextResponse } from "next/server";
import { db, leads } from "@/lib/db";
import { eq, inArray, desc } from "drizzle-orm";

export interface LeadSubmission {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  yachtIds: string;
  leadType?: "dealer_inquiry" | "price_request" | "find_similar" | "general";
  pageUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const VALID_LEAD_TYPES = ["dealer_inquiry", "price_request", "find_similar", "general"];

/**
 * POST /api/leads
 *
 * Captures lead/inquiry submissions from yacht detail and compare pages.
 * Supports multiple lead types with source attribution and UTM tracking.
 */
export async function POST(request: NextRequest) {
  try {
    const body: LeadSubmission = await request.json();

    if (!body.name || !body.email || !body.yachtIds) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, and yachtIds are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const yachtIds = body.yachtIds
      .split(",")
      .map((id: string) => parseInt(id.trim(), 10))
      .filter((id: number) => !isNaN(id));

    if (yachtIds.length === 0) {
      return NextResponse.json({ error: "Invalid yachtIds" }, { status: 400 });
    }

    const yachtDetails = await db.query.yachtModels.findMany({
      where: (yachts: any, { inArray: inArrayOp }: any) => inArrayOp(yachts.id, yachtIds),
      columns: { id: true, manufacturer: true, modelName: true, slug: true, lengthOverall: true },
    });

    const leadType = VALID_LEAD_TYPES.includes(body.leadType || "") ? body.leadType : "general";

    const sourceMap: Record<string, string> = {
      dealer_inquiry: "yacht_detail_dealer",
      price_request: "yacht_detail_pricing",
      find_similar: "compare_similar",
      general: "compare_page",
    };

    const newLead = await db.insert(leads).values({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      message: body.message?.trim() || null,
      yachtIds: yachtIds.join(","),
      source: sourceMap[leadType!] || "compare_page",
      status: "new",
      leadType: leadType!,
      pageUrl: body.pageUrl || null,
      referrer: body.referrer || null,
      utmSource: body.utmSource || null,
      utmMedium: body.utmMedium || null,
      utmCampaign: body.utmCampaign || null,
      metadata: {
        yachtCount: yachtIds.length,
        yachtNames: yachtDetails.map((y: any) => `${y.manufacturer} ${y.modelName}`),
        submittedAt: new Date().toISOString(),
      },
    }).returning();

    return NextResponse.json({
      success: true,
      leadId: newLead[0].id,
      message: leadType === "dealer_inquiry"
        ? "Your inquiry has been sent to our dealer network. A broker will contact you shortly."
        : leadType === "price_request"
        ? "We'll send you market pricing information shortly."
        : leadType === "find_similar"
        ? "We'll help you find similar yachts. A specialist will be in touch."
        : "Inquiry received. We'll be in touch shortly.",
    });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads
 * List leads (admin). Supports filtering by status and lead type.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const leadType = searchParams.get("leadType");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  let query: any = db.query.leads.findMany({
    orderBy: (leadsTable: any, { desc: descOp }: any) => [descOp(leadsTable.createdAt)],
    limit,
  });

  // Simple filter approach - get all and filter in-memory for now
  const allLeads = await db.query.leads.findMany({
    orderBy: (leadsTable: any, { desc: descOp }: any) => [descOp(leadsTable.createdAt)],
    limit: 200,
  });

  let filtered = allLeads;
  if (status) filtered = filtered.filter((l: any) => l.status === status);
  if (leadType) filtered = filtered.filter((l: any) => l.leadType === leadType);

  return NextResponse.json({
    leads: filtered.slice(0, limit),
    total: filtered.length,
  });
}

/**
 * PATCH /api/leads
 * Update lead status (admin). Body: { id, status }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, status: newStatus } = await request.json();
    if (!id || !newStatus) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    const validStatuses = ["new", "contacted", "qualified", "closed", "spam"];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const updated = await db.update(leads)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: updated[0] });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
