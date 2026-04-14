import { NextRequest, NextResponse } from "next/server";
import { getSiteStats, formatYachtPhrase, formatYachtCountFAQ } from "@/lib/site-stats";
import { getSiteUrl } from "@/lib/seo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include")?.split(",") || [];
    
    const response: any = {
      timestamp: new Date().toISOString(),
      stats: await getSiteStats(),
    };
    
    // Add formatted versions for UI use
    const stats = response.stats;
    response.formatted = {
      yachtPhrase: formatYachtPhrase(stats),
      yachtCountFAQ: formatYachtCountFAQ(stats),
    };
    
    // Include search intent data if requested
    if (include.includes("search-intent")) {
      try {
        const searchIntentResults = await fetch(`${getSiteUrl()}/api/search-intent-stats`, {
          cache: 'no-store'
        }).then(r => r.json());
        response.searchIntent = searchIntentResults;
      } catch (error) {
        console.warn("Could not fetch search intent stats:", error);
        response.searchIntent = [];
      }
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch site statistics" },
      { status: 500 }
    );
  }
}