import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import {
  getAllFeaturedYachts,
  createFeaturedYacht,
  updateFeaturedYacht,
  deleteFeaturedYacht,
  markNewsletterSent,
} from "@/lib/featured-yacht-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const result = await getAllFeaturedYachts(limit, offset);

    return NextResponse.json({
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    console.error("[admin/featured] Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured yachts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await ensureSchema();

    const body = await request.json();
    const { yachtModelId, weekStart, weekEnd, headline, editorialText, isManualOverride } = body;

    if (!yachtModelId || !weekStart || !weekEnd) {
      return NextResponse.json(
        { error: "yachtModelId, weekStart, and weekEnd are required" },
        { status: 400 },
      );
    }

    const featured = await createFeaturedYacht({
      yachtModelId: parseInt(yachtModelId),
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd),
      headline,
      editorialText,
      isManualOverride,
    });

    return NextResponse.json(featured, { status: 201 });
  } catch (error) {
    console.error("[admin/featured] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create featured yacht" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await ensureSchema();

    const body = await request.json();
    const { id, headline, editorialText, isActive, weekStart, weekEnd, action } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Featured yacht ID is required" },
        { status: 400 },
      );
    }

    if (action === "mark-newsletter-sent") {
      await markNewsletterSent(id);
      return NextResponse.json({ success: true });
    }

    const updateData: Record<string, unknown> = {};
    if (headline !== undefined) updateData.headline = headline;
    if (editorialText !== undefined) updateData.editorialText = editorialText;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (weekStart) updateData.weekStart = new Date(weekStart);
    if (weekEnd) updateData.weekEnd = new Date(weekEnd);

    const updated = await updateFeaturedYacht(id, updateData);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[admin/featured] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update featured yacht" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json(
        { error: "Featured yacht ID is required" },
        { status: 400 },
      );
    }

    await deleteFeaturedYacht(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/featured] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete featured yacht" },
      { status: 500 },
    );
  }
}
