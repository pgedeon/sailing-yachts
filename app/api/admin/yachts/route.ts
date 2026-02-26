import { db } from "@/lib/db";
import { yachtModels, manufacturers } from "@/drizzle/schema";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
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

    // Verify manufacturer exists
    const [manufacturer] = await db
      .select()
      .from(manufacturers)
      .where({ id: manufacturerId });
    
    if (!manufacturer) {
      return NextResponse.json(
        { error: "Manufacturer not found" },
        { status: 400 }
      );
    }

    const [inserted] = await db
      .insert(yachtModels)
      .values({
        id: undefined, // Let DB auto-generate ID
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

    return NextResponse.json({ success: true, yacht: inserted });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json({ error: "Failed to create yacht" }, { status: 500 });
  }
}