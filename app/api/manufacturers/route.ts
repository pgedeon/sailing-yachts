import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { manufacturers } from "../../../drizzle/schema/manufacturers";

export async function GET() {
  try {
    const result = await db.select().from(manufacturers);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching manufacturers:", error);
    return NextResponse.json(
      { error: "Failed to fetch manufacturers" },
      { status: 500 }
    );
  }
}