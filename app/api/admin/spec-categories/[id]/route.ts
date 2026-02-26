import { NextRequest, NextResponse } from "next/server";
import { db, specCategories } from "@/lib/db";

// GET single spec category
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const categoryId = parseInt(id)

    const [category] = await db
      .select()
      .from(specCategories)
      .where({ id: categoryId })
      .limit(1)

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error fetching spec category:", error)
    return NextResponse.json({ error: "Failed to fetch spec category" }, { status: 500 })
  }
}

// PUT update spec category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const categoryId = parseInt(id)
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.dataType) {
      return NextResponse.json(
        { error: "Name and dataType are required" },
        { status: 400 }
      )
    }

    // Check if category exists
    const [existing] = await db
      .select()
      .from(specCategories)
      .where({ id: categoryId })
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Update
    const [updated] = await db
      .update(specCategories)
      .set({
        name: body.name,
        unit: body.unit,
        dataType: body.dataType,
        categoryGroup: body.categoryGroup,
        isFilterable: body.isFilterable,
        description: body.description,
      })
      .where({ id: categoryId })
      .returning()

    return NextResponse.json({ success: true, category: updated[0] })
  } catch (error) {
    console.error("Error updating spec category:", error)
    return NextResponse.json({ error: "Failed to update spec category" }, { status: 500 })
  }
}

// DELETE spec category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const categoryId = parseInt(id)

    // Check if category exists
    const [existing] = await db
      .select()
      .from(specCategories)
      .where({ id: categoryId })
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    await db.delete(specCategories).where({ id: categoryId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting spec category:", error)
    return NextResponse.json({ error: "Failed to delete spec category" }, { status: 500 })
  }
}