import { NextRequest, NextResponse } from "next/server";
import { db, manufacturers } from "@/lib/db";

// GET single manufacturer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const manufacturerId = parseInt(id)

    const [manufacturer] = await db
      .select()
      .from(manufacturers)
      .where({ id: manufacturerId })
      .limit(1)

    if (!manufacturer) {
      return NextResponse.json({ error: "Manufacturer not found" }, { status: 404 })
    }

    return NextResponse.json({ manufacturer })
  } catch (error) {
    console.error("Error fetching manufacturer:", error)
    return NextResponse.json({ error: "Failed to fetch manufacturer" }, { status: 500 })
  }
}

// PUT update manufacturer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const manufacturerId = parseInt(id)
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Check if manufacturer exists
    const [existing] = await db
      .select()
      .from(manufacturers)
      .where({ id: manufacturerId })
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Manufacturer not found" }, { status: 404 })
    }

    // Update
    const [updated] = await db
      .update(manufacturers)
      .set({
        name: body.name,
        country: body.country,
        foundedYear: body.foundedYear,
        description: body.description,
        websiteUrl: body.websiteUrl,
        logoUrl: body.logoUrl,
      })
      .where({ id: manufacturerId })
      .returning()

    return NextResponse.json({ success: true, manufacturer: updated[0] })
  } catch (error) {
    console.error("Error updating manufacturer:", error)
    return NextResponse.json({ error: "Failed to update manufacturer" }, { status: 500 })
  }
}

// DELETE manufacturer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const manufacturerId = parseInt(id)

    // Check if manufacturer exists
    const [existing] = await db
      .select()
      .from(manufacturers)
      .where({ id: manufacturerId })
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Manufacturer not found" }, { status: 404 })
    }

    await db.delete(manufacturers).where({ id: manufacturerId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting manufacturer:", error)
    return NextResponse.json({ error: "Failed to delete manufacturer" }, { status: 500 })
  }
}