import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  getAffiliateSummary,
  getAffiliateTrends,
  getPlacementsWithVariants,
  getPlacementStats,
  seedDefaultPlacements,
} from "@/lib/affiliate-optimization";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/affiliate-tracking
 *
 * Query params:
 *   action=summary — Overall performance stats
 *   action=trends — Daily trends (last N days)
 *   action=placements — All placements with variants
 *   action=stats&placementId=N — Stats for a specific placement
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const action = request.nextUrl.searchParams.get("action") || "summary";

  try {
    switch (action) {
      case "summary": {
        const summary = await getAffiliateSummary();
        return NextResponse.json({ summary });
      }

      case "trends": {
        const days = parseInt(request.nextUrl.searchParams.get("days") || "30");
        const trends = await getAffiliateTrends(days);
        return NextResponse.json({ trends });
      }

      case "placements": {
        await seedDefaultPlacements();
        const placements = await getPlacementsWithVariants();
        return NextResponse.json({ placements });
      }

      case "stats": {
        const placementId = parseInt(request.nextUrl.searchParams.get("placementId") || "0");
        if (!placementId) {
          return NextResponse.json({ error: "placementId required" }, { status: 400 });
        }
        const stats = await getPlacementStats(placementId);
        return NextResponse.json({ stats });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Affiliate tracking GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/affiliate-tracking
 *
 * Manage placements and variants.
 *
 * Actions:
 *   create_placement — Create a new placement
 *   update_placement — Update placement settings
 *   delete_placement — Delete a placement (and its variants)
 *   create_variant — Add a variant to a placement
 *   update_variant — Update variant settings
 *   delete_variant — Delete a variant
 *   reset_stats — Reset all counters for a placement/variant
 *   trigger_optimize — Force re-check auto-optimization
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "create_placement": {
        const { placementKey, label, pagePattern, position, rotationStrategy, autoOptimize, minSampleSize, confidenceThreshold } = body;
        if (!placementKey || !label || !pagePattern) {
          return NextResponse.json({ error: "placementKey, label, pagePattern required" }, { status: 400 });
        }
        const result = await pool.query(
          `INSERT INTO affiliate_placements (placement_key, label, page_pattern, position, rotation_strategy, auto_optimize, min_sample_size, confidence_threshold)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            placementKey,
            label,
            pagePattern,
            position || "sidebar",
            rotationStrategy || "ab_test",
            autoOptimize !== false,
            minSampleSize || 100,
            confidenceThreshold || "0.95",
          ]
        );
        return NextResponse.json({ placement: result.rows[0] });
      }

      case "update_placement": {
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        const allowedFields = ["label", "pagePattern", "position", "isActive", "rotationStrategy", "autoOptimize", "minSampleSize", "confidenceThreshold"];
        const setClauses: string[] = [];
        const values: any[] = [id];
        let paramIdx = 2;

        for (const field of allowedFields) {
          if (updates[field] !== undefined) {
            const colName = field.replace(/([A-Z])/g, "_$1").toLowerCase();
            setClauses.push(`${colName} = $${paramIdx}`);
            values.push(updates[field]);
            paramIdx++;
          }
        }

        if (setClauses.length === 0) {
          return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        setClauses.push("updated_at = NOW()");
        const result = await pool.query(
          `UPDATE affiliate_placements SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
          values
        );
        return NextResponse.json({ placement: result.rows[0] });
      }

      case "delete_placement": {
        const { id } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await pool.query("DELETE FROM affiliate_placements WHERE id = $1", [id]);
        return NextResponse.json({ success: true });
      }

      case "create_variant": {
        const { placementId, variantKey, partnerName, linkText, linkUrl, affiliateTag, trafficWeight } = body;
        if (!placementId || !variantKey || !linkText || !linkUrl) {
          return NextResponse.json({ error: "placementId, variantKey, linkText, linkUrl required" }, { status: 400 });
        }
        const result = await pool.query(
          `INSERT INTO affiliate_variants (placement_id, variant_key, partner_name, link_text, link_url, affiliate_tag, traffic_weight)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [placementId, variantKey, partnerName || "amazon", linkText, linkUrl, affiliateTag || null, trafficWeight || 50]
        );
        return NextResponse.json({ variant: result.rows[0] });
      }

      case "update_variant": {
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        const allowedFields = ["variantKey", "partnerName", "linkText", "linkUrl", "affiliateTag", "trafficWeight", "isActive", "isWinner"];
        const setClauses: string[] = [];
        const values: any[] = [id];
        let paramIdx = 2;

        for (const field of allowedFields) {
          if (updates[field] !== undefined) {
            const colName = field.replace(/([A-Z])/g, "_$1").toLowerCase();
            setClauses.push(`${colName} = $${paramIdx}`);
            values.push(updates[field]);
            paramIdx++;
          }
        }

        if (setClauses.length === 0) {
          return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        setClauses.push("updated_at = NOW()");
        const result = await pool.query(
          `UPDATE affiliate_variants SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
          values
        );
        return NextResponse.json({ variant: result.rows[0] });
      }

      case "delete_variant": {
        const { id } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await pool.query("DELETE FROM affiliate_variants WHERE id = $1", [id]);
        return NextResponse.json({ success: true });
      }

      case "reset_stats": {
        const { placementId, variantId } = body;
        if (variantId) {
          await pool.query(
            "UPDATE affiliate_variants SET clicks = 0, conversions = 0, estimated_revenue = '0.00', impressions = 0, is_winner = false WHERE id = $1",
            [variantId]
          );
        } else if (placementId) {
          await pool.query(
            "UPDATE affiliate_variants SET clicks = 0, conversions = 0, estimated_revenue = '0.00', impressions = 0, is_winner = false WHERE placement_id = $1",
            [placementId]
          );
        }
        // Reset placement strategy back to ab_test
        if (placementId) {
          await pool.query(
            "UPDATE affiliate_placements SET rotation_strategy = 'ab_test', updated_at = NOW() WHERE id = $1",
            [placementId]
          );
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Affiliate tracking POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
