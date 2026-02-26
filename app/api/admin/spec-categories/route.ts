import { NextRequest, NextResponse } from "next/server";
import { getDb, specCategories } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET all spec categories (admin)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authError = requireAuth(request);
    if (authError) return authError;

    const db = getDb()
    const allCategories = await db.select().from(specCategories);
    return NextResponse.json({ categories: allCategories });
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
    // Check authentication
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { name, unit, dataType, categoryGroup, displayOrder, isFilterable, isSortable, isComparable, description } = body;

    if (!name || !dataType) {
      return NextResponse.json(
        { error: "Name and dataType are required" },
        { status: 400 }
      );
    }

    const db = getDb()
    const [category] = await db
      .insert(specCategories)
      .values({
        name,
        unit: unit || null,
        dataType,
        categoryGroup: categoryGroup || null,
        displayOrder: displayOrder || 0,
        isFilterable: isFilterable !== undefined ? isFilterable : true,
        isSortable: isSortable || false,
        isComparable: isComparable !== undefined ? isComparable : true,
        description: description || null,
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