import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { specCategories } from "../../../drizzle/schema";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await db.select().from(specCategories);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching spec categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch spec categories" },
      { status: 500 }
    );
  }
}
