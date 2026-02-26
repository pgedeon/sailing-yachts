import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { yachts } from "@/drizzle/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const result = await db.execute(
    sql`SELECT DISTINCT manufacturer FROM yachts WHERE manufacturer IS NOT NULL ORDER BY manufacturer ASC`
  );
  const manufacturers = result.rows.map((row: any) => row.manufacturer);
  return NextResponse.json({ manufacturers });
}
