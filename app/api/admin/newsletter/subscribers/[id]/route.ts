import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, newsletterSubscribers } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// PATCH — update subscriber tags
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const subscriberId = parseInt(id, 10);
    if (isNaN(subscriberId)) {
      return NextResponse.json({ error: "Invalid subscriber ID" }, { status: 400 });
    }

    const body = await request.json();
    const { tags } = body;

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: "tags must be an array" }, { status: 400 });
    }

    const [updated] = await db
      .update(newsletterSubscribers)
      .set({ tags })
      .where(eq(newsletterSubscribers.id, subscriberId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    return NextResponse.json({ subscriber: updated });
  } catch (error) {
    console.error("[newsletter/subscribers/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update subscriber" }, { status: 500 });
  }
}

// POST — add a single tag to subscriber
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const subscriberId = parseInt(id, 10);
    if (isNaN(subscriberId)) {
      return NextResponse.json({ error: "Invalid subscriber ID" }, { status: 400 });
    }

    const body = await request.json();
    const { tag } = body;

    if (!tag || typeof tag !== "string") {
      return NextResponse.json({ error: "tag is required" }, { status: 400 });
    }

    await db
      .update(newsletterSubscribers)
      .set({
        tags: sql`array_append(COALESCE(${newsletterSubscribers.tags}, '{}'::text[]), ${tag})`,
      })
      .where(eq(newsletterSubscribers.id, subscriberId));

    const [updated] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, subscriberId))
      .limit(1);

    return NextResponse.json({ subscriber: updated });
  } catch (error) {
    console.error("[newsletter/subscribers/[id]] POST error:", error);
    return NextResponse.json({ error: "Failed to add tag" }, { status: 500 });
  }
}

// DELETE — remove a tag from subscriber
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const subscriberId = parseInt(id, 10);
    if (isNaN(subscriberId)) {
      return NextResponse.json({ error: "Invalid subscriber ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    if (!tag) {
      return NextResponse.json({ error: "tag query parameter is required" }, { status: 400 });
    }

    await db
      .update(newsletterSubscribers)
      .set({
        tags: sql`array_remove(COALESCE(${newsletterSubscribers.tags}, '{}'::text[]), ${tag})`,
      })
      .where(eq(newsletterSubscribers.id, subscriberId));

    const [updated] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, subscriberId))
      .limit(1);

    return NextResponse.json({ subscriber: updated });
  } catch (error) {
    console.error("[newsletter/subscribers/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove tag" }, { status: 500 });
  }
}
