import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { yachts } from "../../../drizzle/schema/yachts";

export async function GET() {
  try {
    const result = await db.select().from(yachts);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching yachts:", error);
    return NextResponse.json({ error: "Failed to fetch yachts" }, { status: 500 });
  }
}
