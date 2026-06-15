import { NextRequest, NextResponse } from "next/server";
import { db, leads } from "@/lib/db";
import { eq, inArray, desc } from "drizzle-orm";
import { z } from "zod";
import { checkRateLimit, getClientIp, rateLimitHeaders, WRITE_RATE_LIMIT } from "@/lib/rate-limit";

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

// --- Zod validation ---
const leadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().max(50).optional(),
  message: z.string().max(5000).optional(),
  yachtIds: z.string().min(1, "yachtIds is required"),
  leadType: z.enum(["dealer_inquiry", "price_request", "find_similar", "general"]).optional().default("general"),
  pageUrl: z.string().max(2000).optional(),
  referrer: z.string().max(2000).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
});

/**
 * POST /api/leads
 *
 * Captures lead/inquiry submissions from yacht detail and compare pages.
 * Supports multiple lead types with source attribution and UTM tracking.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit (write: 20/min)
    const ip = getClientIp(request);
    const rlResult = checkRateLimit(`leads:${ip}`, WRITE_RATE_LIMIT);
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)),
            ...rateLimitHeaders(rlResult),
          },
        },
      );
    }

    const parsed = leadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const body = parsed.data;

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

    const leadType = body.leadType;

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
