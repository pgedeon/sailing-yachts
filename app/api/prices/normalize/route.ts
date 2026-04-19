import { NextRequest, NextResponse } from "next/server";
import {
  normalizePricesToCurrency,
  getPriceTrend,
  getPriceDisplayInfo,
} from "@/lib/price-normalization";
import { type CurrencyCode } from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

/**
 * GET /api/prices/normalize
 *
 * Query params:
 *   - yachtModelId (required): yacht model ID
 *   - currency (optional): target currency (EUR, USD, GBP). Default: EUR
 *   - history (optional): "true" to include price trend data
 *   - condition (optional): filter history by condition
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const yachtModelId = params.get("yachtModelId");
    const currency = (params.get("currency") || "EUR").toUpperCase() as CurrencyCode;
    const includeHistory = params.get("history") === "true";
    const condition = params.get("condition") || undefined;

    if (!yachtModelId) {
      return NextResponse.json(
        { error: "yachtModelId is required" },
        { status: 400 }
      );
    }

    const validCurrencies = ["USD", "EUR", "GBP"];
    if (!validCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: `Currency must be one of: ${validCurrencies.join(", ")}` },
        { status: 400 }
      );
    }

    const yachtModelIdNum = parseInt(yachtModelId, 10);
    const { newPrice, usedPrice, ratesUsed } = await normalizePricesToCurrency(
      yachtModelIdNum,
      currency
    );

    const displayInfo = getPriceDisplayInfo(newPrice, usedPrice);

    const response: Record<string, unknown> = {
      yachtModelId: yachtModelIdNum,
      currency,
      newPrice,
      usedPrice,
      displayInfo,
      ratesUsed,
    };

    if (includeHistory) {
      response.history = await getPriceTrend(
        yachtModelIdNum,
        currency,
        condition,
        30
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in price normalization:", error);
    return NextResponse.json(
      { error: "Failed to normalize prices" },
      { status: 500 }
    );
  }
}
