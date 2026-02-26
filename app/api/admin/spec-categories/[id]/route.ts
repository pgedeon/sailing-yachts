import { NextRequest, NextResponse } from "next/server";
import { getDb, specCategories } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

// GET single spec category
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const authError = requireAuth(request as NextRequest);
    if (authError) return authError;

    const { id } = await params
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    const db = getDb()
    const [category] = await db
      .select()
      .from(specCategories)
      .where(eq(specCategories.id, categoryId))
      .limit(1)

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error fetching spec category:", error, error instanceof Error ? error.stack : null)
    return NextResponse.json({ 
      error: "Failed to fetch spec category", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}

// PUT update spec category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params
    const categoryId = parseInt(id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }
    
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.dataType) {
      return NextResponse.json(
        { error: "Name and dataType are required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if category exists
    const [existing] = await db
      .select()
      .from(specCategories)
      .where(eq(specCategories.id, categoryId))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Update
    const updated = await db
      .update(specCategories)
      .set({
        name: body.name,
        unit: body.unit,
        dataType: body.dataType,
        categoryGroup: body.categoryGroup,
        isFilterable: body.isFilterable,
        description: body.description,
      })
      .where(eq(specCategories.id, categoryId))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Failed to update spec category" }, { status: 500 })
    }

    return NextResponse.json({ success: true, category: updated[0] })
  } catch (error) {
    console.error("Error updating spec category:", error, error instanceof Error ? error.stack : null)
    return NextResponse.json({ 
      error: "Failed to update spec category", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}

// DELETE spec category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    const db = getDb()

    // Check if category exists
    const [existing] = await db
      .select()
      .from(specCategories)
      .where(eq(specCategories.id, categoryId))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    await db.delete(specCategories).where(eq(specCategories.id, categoryId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting spec category:", error, error instanceof Error ? error.stack : null)
    return NextResponse.json({ 
      error: "Failed to delete spec category", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}