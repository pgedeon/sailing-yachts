import { NextRequest, NextResponse } from "next/server";
import {
  getFaqProposals,
  getFaqProposalSummary,
  runHarvestingPipeline,
  createFaqProposal,
  getFaqProposalById,
  updateFaqProposalStatus,
  deleteFaqProposal,
} from "@/lib/faq-harvesting";

export const dynamic = "force-dynamic";

/**
 * GET /api/faq-proposals
 *
 * Query params:
 *   - status: filter by status (proposed/approved/published/rejected)
 *   - category: filter by category
 *   - source: filter by source (search/compare/newsletter/manual)
 *   - summary: if "true", return summary stats instead of list
 *   - limit: results per page (default 50)
 *   - offset: pagination offset
 *   - id: get single proposal by ID
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    // Single proposal lookup
    const id = params.get("id");
    if (id) {
      const proposal = await getFaqProposalById(parseInt(id, 10));
      if (!proposal) {
        return NextResponse.json(
          { error: "Proposal not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ proposal });
    }

    // Summary view
    if (params.get("summary") === "true") {
      const summary = await getFaqProposalSummary();
      return NextResponse.json(summary);
    }

    // List view with filters
    const proposals = await getFaqProposals({
      status: params.get("status") || undefined,
      category: params.get("category") || undefined,
      source: params.get("source") || undefined,
      limit: parseInt(params.get("limit") || "50", 10),
      offset: parseInt(params.get("offset") || "0", 10),
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error("Error fetching FAQ proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQ proposals" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/faq-proposals
 *
 * Actions:
 *   - { action: "harvest" } — run the harvesting pipeline
 *   - { action: "create", question, suggestedAnswer?, category? } — manual proposal
 *   - { action: "update", id, status, adminNotes? } — approve/reject/publish
 *   - { action: "delete", id } — delete a proposal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || "create";

    switch (action) {
      case "harvest": {
        const result = await runHarvestingPipeline();
        return NextResponse.json({
          message: "Harvesting pipeline completed",
          ...result,
        });
      }

      case "create": {
        if (!body.question) {
          return NextResponse.json(
            { error: "Question is required" },
            { status: 400 }
          );
        }

        const proposal = await createFaqProposal({
          question: body.question,
          suggestedAnswer: body.suggestedAnswer,
          category: body.category,
          source: body.source,
        });

        if (!proposal) {
          return NextResponse.json(
            { error: "Failed to create proposal" },
            { status: 500 }
          );
        }

        return NextResponse.json({ proposal }, { status: 201 });
      }

      case "update": {
        if (!body.id || !body.status) {
          return NextResponse.json(
            { error: "ID and status are required" },
            { status: 400 }
          );
        }

        const validStatuses = ["approved", "rejected", "published"];
        if (!validStatuses.includes(body.status)) {
          return NextResponse.json(
            { error: `Status must be one of: ${validStatuses.join(", ")}` },
            { status: 400 }
          );
        }

        const proposal = await updateFaqProposalStatus(
          body.id,
          body.status,
          body.adminNotes
        );

        if (!proposal) {
          return NextResponse.json(
            { error: "Proposal not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({ proposal });
      }

      case "delete": {
        if (!body.id) {
          return NextResponse.json(
            { error: "ID is required" },
            { status: 400 }
          );
        }

        const deleted = await deleteFaqProposal(body.id);
        if (!deleted) {
          return NextResponse.json(
            { error: "Proposal not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({ message: "Proposal deleted" });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in FAQ proposals API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
