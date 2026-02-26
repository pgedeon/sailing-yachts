import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { specCategories } from "../../../drizzle/schema/spec_categories";

export async function GET() {
  try {
    const result = await db.select().from(specCategories);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching spec categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch spec categories" },
      { status: 500 }
    );
  }
}
