import { NextRequest, NextResponse } from "next/server";
import {
  createPrice,
  getPrices,
  getPriceById,
  updatePrice,
  deletePrice,
  getPriceSummary,
  getPriceHistory,
  importPricesFromCsv,
  validatePriceData,
} from "@/lib/price-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/prices
 *
 * Query params:
 *   - yachtId: get price summary for a yacht (aggregate view)
 *   - yachtModelId: filter prices by yacht
 *   - condition: filter by condition (new/used/broker/charter)
 *   - sourceType: filter by source type
 *   - history: if "true", return price history instead
 *   - id: get single price record by ID
 *   - limit: results per page (default 50)
 *   - offset: pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    // Single price record lookup
    const id = params.get("id");
    if (id) {
      const price = await getPriceById(parseInt(id, 10));
      if (!price) {
        return NextResponse.json({ error: "Price record not found" }, { status: 404 });
      }
      return NextResponse.json({ price });
    }

    // Price summary for a yacht (used by yacht detail pages)
    const yachtId = params.get("yachtId");
    if (yachtId) {
      const yachtModelId = parseInt(yachtId, 10);
      const summary = await getPriceSummary(yachtModelId);
      if (!summary) {
        return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
      }
      return NextResponse.json(summary);
    }

    // Price history for a yacht
    if (params.get("history") === "true" && yachtId) {
      const history = await getPriceHistory(
        parseInt(yachtId, 10),
        params.get("condition") || undefined,
        parseInt(params.get("limit") || "30", 10)
      );
      return NextResponse.json({ history });
    }

    // Price history (alternative: uses yachtModelId param)
    if (params.get("history") === "true") {
      const yachtModelIdParam = params.get("yachtModelId");
      if (!yachtModelIdParam) {
        return NextResponse.json({ error: "yachtModelId required for history" }, { status: 400 });
      }
      const history = await getPriceHistory(
        parseInt(yachtModelIdParam, 10),
        params.get("condition") || undefined,
        parseInt(params.get("limit") || "30", 10)
      );
      return NextResponse.json({ history });
    }

    // List prices with filters
    const prices = await getPrices({
      yachtModelId: params.get("yachtModelId") ? parseInt(params.get("yachtModelId")!, 10) : undefined,
      condition: params.get("condition") || undefined,
      sourceType: params.get("sourceType") || undefined,
      isActive: params.get("isActive") === "false" ? false : params.get("isActive") === "true" ? true : undefined,
      limit: parseInt(params.get("limit") || "50", 10),
      offset: parseInt(params.get("offset") || "0", 10),
    });

    return NextResponse.json(prices);
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}

/**
 * POST /api/prices
 *
 * Actions:
 *   - { action: "create", yachtModelId, priceMin, priceMax, ... } — create price
 *   - { action: "update", id, ...fields } — update price record
 *   - { action: "delete", id } — delete price record
 *   - { action: "import", rows: [...] } — CSV batch import
 *   - { action: "validate", ...fields } — validate without saving
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || "create";

    switch (action) {
      case "validate": {
        const errors = validatePriceData(body);
        return NextResponse.json({ valid: errors.length === 0, errors });
      }

      case "create": {
        if (!body.yachtModelId || body.priceMin == null || body.priceMax == null) {
          return NextResponse.json(
            { error: "yachtModelId, priceMin, and priceMax are required" },
            { status: 400 }
          );
        }

        const price = await createPrice({
          yachtModelId: body.yachtModelId,
          priceMin: body.priceMin,
          priceMax: body.priceMax,
          currency: body.currency,
          condition: body.condition,
          year: body.year,
          source: body.source || "Manual Entry",
          sourceType: body.sourceType,
          sourceUrl: body.sourceUrl,
          confidenceScore: body.confidenceScore,
          notes: body.notes,
          effectiveDate: body.effectiveDate,
          expiresAt: body.expiresAt,
        });

        if (!price) {
          return NextResponse.json({ error: "Failed to create price record" }, { status: 500 });
        }

        return NextResponse.json({ price }, { status: 201 });
      }

      case "update": {
        if (!body.id) {
          return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const price = await updatePrice(body.id, {
          priceMin: body.priceMin,
          priceMax: body.priceMax,
          currency: body.currency,
          confidenceScore: body.confidenceScore,
          notes: body.notes,
          isActive: body.isActive,
          source: body.source,
          sourceUrl: body.sourceUrl,
        });

        if (!price) {
          return NextResponse.json({ error: "Price record not found" }, { status: 404 });
        }

        return NextResponse.json({ price });
      }

      case "delete": {
        if (!body.id) {
          return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const deleted = await deletePrice(body.id);
        if (!deleted) {
          return NextResponse.json({ error: "Price record not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Price record deleted" });
      }

      case "import": {
        if (!Array.isArray(body.rows) || body.rows.length === 0) {
          return NextResponse.json({ error: "rows array is required" }, { status: 400 });
        }

        const result = await importPricesFromCsv(body.rows);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in prices API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
