import { NextResponse } from "next/server";
import { getActiveFeaturedYacht, getRecentFeaturedYachts } from "@/lib/featured-yacht-service";

export async function GET() {
  try {
    const [active, recent] = await Promise.all([
      getActiveFeaturedYacht(),
      getRecentFeaturedYachts(6),
    ]);

    return NextResponse.json({
      active,
      recent,
    });
  } catch (error) {
    console.error("[featured] Error fetching featured yacht:", error);
    return NextResponse.json(
      { active: null, recent: [] },
      { status: 200 },
    );
  }
}
