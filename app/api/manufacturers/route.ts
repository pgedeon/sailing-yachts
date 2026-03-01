import { NextResponse } from "next/server";
import { db, manufacturers as mfgTable } from "@/lib/db";

export async function GET() {
  try {
    const manufacturers = await db
      .select({
        id: mfgTable.id,
        name: mfgTable.name,
      })
      .from(mfgTable)
      .orderBy(mfgTable.name);

    const response = NextResponse.json({ manufacturers });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  } catch (error) {
    console.error("Error fetching manufacturers:", error);
    return NextResponse.json(
      { error: "Failed to fetch manufacturers" },
      { status: 500 },
    );
  }
}
