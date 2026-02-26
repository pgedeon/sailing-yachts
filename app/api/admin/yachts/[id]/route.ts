import { NextRequest, NextResponse } from "next/server";
import { db, yachtModels, manufacturers } from "@/lib/db";
import { eq } from "drizzle-orm";

function authorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const key = authHeader.replace("Bearer ", "");
  return key === process.env.ADMIN_API_KEY;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const yachtId = parseInt(id);
    const result = await db
      .select({
        yacht: yachtModels,
        manufacturer: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(eq(yachtModels.id, yachtId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const r = result[0];
    return NextResponse.json({
      ...r.yacht,
      manufacturer: r.manufacturer,
    });
  } catch (error) {
    console.error("Error fetching yacht:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const yachtId = parseInt(id);
    const body = await request.json();

    // Validate required fields
    if (!body.manufacturer || !body.modelName || !body.year) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Find or create manufacturer
    let mfgResult = await db
      .select()
      .from(manufacturers)
      .where(eq(manufacturers.name, body.manufacturer))
      .limit(1);
    let manufacturerId = mfgResult[0]?.id;
    if (!manufacturerId) {
      const [mfg] = await db
        .insert(manufacturers)
        .values({ name: body.manufacturer })
        .returning({ id: manufacturers.id });
      manufacturerId = mfg.id;
    }

    // Update yacht
    const [updated] = await db
      .update(yachtModels)
      .set({
        manufacturerId,
        modelName: body.modelName,
        year: body.year,
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
        sourceUrl: body.sourceUrl,
        sourceAttribution: body.sourceAttribution,
        adminLinks: body.adminLinks,
        updatedAt: new Date(),
      })
      .where(eq(yachtModels.id, yachtId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating yacht:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
