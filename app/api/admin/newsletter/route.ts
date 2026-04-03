import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, newsletterSubscribers } from "@/lib/db";
import { desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();

    // Get query params for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Fetch subscribers
    const subscribers = await db
      .select()
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsletterSubscribers);

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      subscribers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[newsletter/admin] Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureSchema();

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Subscriber ID is required" },
        { status: 400 },
      );
    }

    await db
      .delete(newsletterSubscribers)
      .where(sql`${newsletterSubscribers.id} = ${id}`);

    return NextResponse.json({ message: "Subscriber removed" });
  } catch (error) {
    console.error("[newsletter/admin] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove subscriber" },
      { status: 500 },
    );
  }
}
