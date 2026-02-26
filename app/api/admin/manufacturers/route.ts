import { NextRequest, NextResponse } from "next/server";
import { getDb, manufacturers } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET all manufacturers (admin view - can be used by both admin and public API)
export async function GET() {
  try {
    const db = getDb()
    const allManufacturers = await db.select().from(manufacturers);
    return NextResponse.json({ manufacturers: allManufacturers });
  } catch (error) {
    console.error("Error fetching manufacturers:", error);
    return NextResponse.json(
      { error: "Failed to fetch manufacturers" },
      { status: 500 }
    );
  }
}

// POST create manufacturer (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, country, foundedYear, description, websiteUrl, logoUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const db = getDb()
    const [manufacturer] = await db
      .insert(manufacturers)
      .values({
        name,
        country,
        foundedYear,
        description: description || null,
        websiteUrl: websiteUrl || null,
        logoUrl: logoUrl || null,
      })
      .returning();

    return NextResponse.json({ success: true, manufacturer });
  } catch (error) {
    console.error("Error creating manufacturer:", error);
    return NextResponse.json(
      { error: "Failed to create manufacturer" },
      { status: 500 }
    );
  }
}