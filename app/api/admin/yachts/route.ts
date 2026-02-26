import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { yachts } from "../../../../drizzle/schema";
import { randomUUID } from "crypto";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      manufacturer,
      lengthOverall,
      beam,
      draft,
      displacement,
      year,
      imageUrl,
    } = body;

    if (!name || !manufacturer) {
      return NextResponse.json(
        { error: "Name and manufacturer are required" },
        { status: 400 }
      );
    }

    const [inserted] = await db
      .insert(yachts)
      .values({
        id: randomUUID(),
        name,
        manufacturer,
        lengthOverall,
        beam,
        draft,
        displacement,
        year,
        imageUrl,
      })
      .returning();

    return NextResponse.json({ success: true, yacht: inserted });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create yacht" }, { status: 500 });
  }
}
