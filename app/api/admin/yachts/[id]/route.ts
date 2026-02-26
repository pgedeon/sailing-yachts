import { NextRequest, NextResponse } from "next/server";
import { db, yachtModels } from "@/lib/db";

// GET single yacht
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const yachtId = parseInt(id)

    if (isNaN(yachtId)) {
      return NextResponse.json({ error: "Invalid yacht ID" }, { status: 400 })
    }

    const [yacht] = await db
      .select()
      .from(yachtModels)
      .where({ id: yachtId })
      .limit(1)

    if (!yacht) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 })
    }

    return NextResponse.json({ yacht })
  } catch (error) {
    console.error("Error fetching yacht:", error, error instanceof Error ? error.stack : null)
    return NextResponse.json({ 
      error: "Failed to fetch yacht", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}

// PUT update yacht
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const yachtId = parseInt(id)
    
    if (isNaN(yachtId)) {
      return NextResponse.json({ error: "Invalid yacht ID" }, { status: 400 })
    }
    
    const body = await request.json()

    // Validate required fields
    if (!body.modelName || !body.manufacturerId) {
      return NextResponse.json(
        { error: "Model name and manufacturer ID are required" },
        { status: 400 }
      )
    }

    // Check if yacht exists
    const [existing] = await db
      .select()
      .from(yachtModels)
      .where({ id: yachtId })
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 })
    }

    // Update
    const [updated] = await db
      .update(yachtModels)
      .set({
        manufacturerId: body.manufacturerId,
        modelName: body.modelName,
        year: body.year,
        slug: body.slug,
        lengthOverall: body.lengthOverall,
        beam: body.beam,
        draft: body.draft,
        displacement: body.displacement,
        ballast: body.ballast,
        sailAreaMain: body.sailAreaMain,
        rigType: body.rigType,
        keelType: body.keelType,
        hullMaterial: body.hullMaterial,
        cabins: body.cabins,
        berths: body.berths,
        heads: body.heads,
        maxOccupancy: body.maxOccupancy,
        engineHp: body.engineHp,
        engineType: body.engineType,
        fuelCapacity: body.fuelCapacity,
        waterCapacity: body.waterCapacity,
        designNotes: body.designNotes,
        description: body.description,
      })
      .where({ id: yachtId })
      .returning()

    return NextResponse.json({ success: true, yacht: updated[0] })
  } catch (error) {
    console.error("Error updating yacht:", error, error instanceof Error ? error.stack : null)
    return NextResponse.json({ 
      error: "Failed to update yacht", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}

// DELETE yacht
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const yachtId = parseInt(id)

    if (isNaN(yachtId)) {
      return NextResponse.json({ error: "Invalid yacht ID" }, { status: 400 })
    }

    // Check if yacht exists
    const [existing] = await db
      .select()
      .from(yachtModels)
      .where({ id: yachtId })
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 })
    }

    await db.delete(yachtModels).where({ id: yachtId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting yacht:", error, error instanceof Error ? error.stack : null)
    return NextResponse.json({ 
      error: "Failed to delete yacht", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}