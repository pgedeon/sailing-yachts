import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getDescriptionStats,
  findAndGenerateDescriptions,
  getPendingDescriptions,
  approveDescription,
  rejectDescription,
  approveAllPending,
} from "@/lib/description-service";

export const dynamic = "force-dynamic";

// GET /api/admin/descriptions — stats + pending list
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "pending") {
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const pending = await getPendingDescriptions(limit, offset);
      return NextResponse.json({ pending });
    }

    // Default: return stats
    const stats = await getDescriptionStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching description stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

// POST /api/admin/descriptions — generate, approve, reject
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "generate": {
        const limit = body.limit || 50;
        const dryRun = body.dryRun !== false;
        const result = await findAndGenerateDescriptions(limit, dryRun);
        return NextResponse.json(result);
      }

      case "approve": {
        const { yachtId, editedDescription } = body;
        if (!yachtId) {
          return NextResponse.json(
            { error: "yachtId required" },
            { status: 400 }
          );
        }
        await approveDescription(yachtId, editedDescription);
        return NextResponse.json({ success: true });
      }

      case "reject": {
        const { yachtId } = body;
        if (!yachtId) {
          return NextResponse.json(
            { error: "yachtId required" },
            { status: 400 }
          );
        }
        await rejectDescription(yachtId);
        return NextResponse.json({ success: true });
      }

      case "approve-all": {
        const result = await approveAllPending();
        return NextResponse.json({
          success: true,
          approved: (result as any).rowCount || 0,
        });
      }

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in description action:", error);
    return NextResponse.json(
      { error: "Operation failed" },
      { status: 500 }
    );
  }
}
