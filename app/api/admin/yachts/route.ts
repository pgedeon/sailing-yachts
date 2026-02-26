import { NextRequest, NextResponse } from "next/server";
import { getDb, yachtModels, manufacturers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

// POST create yacht (admin)
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authError = requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const {
      modelName,
      manufacturerId,
      year,
      slug,
      lengthOverall,
      beam,
      draft,
      displacement,
      ballast,
      sailAreaMain,
      rigType,
      keelType,
      hullMaterial,
      cabins,
      berths,
      heads,
      maxOccupancy,
      engineHp,
      engineType,
      fuelCapacity,
      waterCapacity,
      designNotes,
      description,
      sourceUrl,
      sourceAttribution,
    } = body;

    if (!modelName || !manufacturerId) {
      return NextResponse.json(
        { error: "Model name and manufacturer ID are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify manufacturer exists
    const [manufacturer] = await db
      .select()
      .from(manufacturers)
      .where(eq(manufacturers.id, manufacturerId))
      .limit(1);

    if (!manufacturer) {
      return NextResponse.json(
        { error: "Manufacturer not found" },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(yachtModels)
      .values({
        manufacturerId,
        modelName,
        year,
        slug,
        lengthOverall,
        beam,
        draft,
        displacement,
        ballast,
        sailAreaMain,
        rigType,
        keelType,
        hullMaterial,
        cabins,
        berths,
        heads,
        maxOccupancy,
        engineHp,
        engineType,
        fuelCapacity,
        waterCapacity,
        designNotes,
        description,
        sourceUrl,
        sourceAttribution,
        adminLinks: [],
      })
      .returning();

    return NextResponse.json({ success: true, yacht: inserted[0] });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json({ error: "Failed to create yacht" }, { status: 500 });
  }
}