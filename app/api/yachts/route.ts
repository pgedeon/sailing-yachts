import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { yachts } from "../../../drizzle/schema";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const yachtsList = await db.select().from(yachts);
    const total = yachtsList.length;
    return NextResponse.json({
      yachts: yachtsList,
      total,
      page: 1,
      limit: total,
      totalPages: 1,
    });
  } catch (error) {
    console.error("Error fetching yachts:", error);
    return NextResponse.json(
      { error: "Failed to fetch yachts" },
      { status: 500 }
    );
  }
}
