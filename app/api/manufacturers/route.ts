import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await db.execute(
      sql`SELECT DISTINCT manufacturer FROM yachts WHERE manufacturer IS NOT NULL ORDER BY manufacturer ASC`
    );
    const manufacturers = result.rows.map((row: any) => row.manufacturer);
    return NextResponse.json({ manufacturers });
  } catch (error) {
    console.error("Error fetching manufacturers:", error);
    return NextResponse.json(
      { error: "Failed to fetch manufacturers" },
      { status: 500 }
    );
  }
}
