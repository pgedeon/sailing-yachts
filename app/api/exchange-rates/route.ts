import { NextResponse } from "next/server";
import { getAllRates } from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

/**
 * GET /api/exchange-rates
 *
 * Returns current exchange rates. Optionally specify ?base=EUR (default).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const base = (url.searchParams.get("base") || "EUR").toUpperCase();
    const validBases = ["USD", "EUR", "GBP"];

    if (!validBases.includes(base)) {
      return NextResponse.json(
        { error: `Base currency must be one of: ${validBases.join(", ")}` },
        { status: 400 }
      );
    }

    const rates = await getAllRates(base as "USD" | "EUR" | "GBP");
    return NextResponse.json({ base, rates });
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 500 }
    );
  }
}
