import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { specCategories } from "../../../drizzle/schema";

export const dynamic = 'force-dynamic';

// GET all spec categories
export async function GET() {
  try {
    const categories = await db.select().from(specCategories);
    const response = NextResponse.json({ categories });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  } catch (error) {
    console.error("Error fetching spec categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch spec categories" },
      { status: 500 }
    );
  }
}

// POST create spec category (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, unit, dataType, categoryGroup, isFilterable, description } = body;

    if (!name || !dataType) {
      return NextResponse.json(
        { error: "Name and dataType are required" },
        { status: 400 }
      );
    }

    const [category] = await db
      .insert(specCategories)
      .values({
        name,
        unit,
        dataType,
        categoryGroup,
        isFilterable: isFilterable ?? true,
        description,
      })
      .returning();

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Error creating spec category:", error);
    return NextResponse.json(
      { error: "Failed to create spec category" },
      { status: 500 }
    );
  }
}
