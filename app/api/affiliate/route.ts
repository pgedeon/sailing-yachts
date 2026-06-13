import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { selectVariant, recordTrackingEvent } from "@/lib/affiliate-optimization";

export const dynamic = "force-dynamic";

// Helper to get property from DB row (snake_case) or typed object (camelCase)
function getProp(obj: any, snakeCase: string, camelCase: string): any {
  return obj[snakeCase] ?? obj[camelCase];
}

/**
 * GET /api/affiliate?action=serve&placement=<key>
 *
 * Returns the selected variant for a placement (for client-side rendering).
 * Uses the rotation strategy to pick a variant.
 */
export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "serve";

  try {
    if (action === "serve") {
      const placementKey = request.nextUrl.searchParams.get("placement");
      if (!placementKey) {
        return NextResponse.json({ error: "placement parameter required" }, { status: 400 });
      }

      const client = await pool.connect();
      try {
        // Get placement
        const placementResult = await client.query(
          "SELECT * FROM affiliate_placements WHERE placement_key = $1 AND is_active = true",
          [placementKey]
        );
        if (placementResult.rows.length === 0) {
          return NextResponse.json({ variant: null });
        }
        const placement = placementResult.rows[0];

        // Get active variants
        const variantsResult = await client.query(
          "SELECT * FROM affiliate_variants WHERE placement_id = $1 AND is_active = true ORDER BY display_order",
          [placement.id]
        );
        if (variantsResult.rows.length === 0) {
          return NextResponse.json({ variant: null });
        }

        // Select variant using rotation strategy
        const variant = selectVariant(placement, variantsResult.rows);

        if (!variant) {
          return NextResponse.json({ variant: null });
        }

        // Record impression asynchronously
        const sessionId = request.nextUrl.searchParams.get("sid") || null;
        const page = request.nextUrl.searchParams.get("page") || null;
        const yachtId = request.nextUrl.searchParams.get("yachtId")
          ? parseInt(request.nextUrl.searchParams.get("yachtId")!)
          : null;

        recordTrackingEvent({
          variantId: getProp(variant, "id", "id"),
          placementId: placement.id,
          eventType: "impression",
          sessionId: sessionId || undefined,
          page: page || undefined,
          yachtId: yachtId || undefined,
        }).catch(() => {});

        return NextResponse.json({
          variant: {
            id: getProp(variant, "id", "id"),
            placementId: getProp(variant, "placement_id", "placementId"),
            variantKey: getProp(variant, "variant_key", "variantKey"),
            partnerName: getProp(variant, "partner_name", "partnerName"),
            linkText: getProp(variant, "link_text", "linkText"),
            linkUrl: getProp(variant, "link_url", "linkUrl"),
            affiliateTag: getProp(variant, "affiliate_tag", "affiliateTag"),
          },
          placement: {
            id: placement.id,
            key: placement.placement_key,
            position: placement.position,
            strategy: placement.rotation_strategy,
          },
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Affiliate serve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/affiliate
 *
 * Track click or conversion events.
 *
 * Body: { action: "click"|"conversion", variantId, placementId, sessionId?, page?, yachtId?, revenue? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, variantId, placementId, sessionId, page, yachtId, revenue, metadata } = body;

    if (!variantId || !placementId || !action) {
      return NextResponse.json({ error: "action, variantId, placementId required" }, { status: 400 });
    }

    if (action !== "click" && action !== "conversion") {
      return NextResponse.json({ error: "action must be click or conversion" }, { status: 400 });
    }

    await recordTrackingEvent({
      variantId,
      placementId,
      eventType: action,
      sessionId,
      page,
      yachtId,
      revenue,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Affiliate track error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
