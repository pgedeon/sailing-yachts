import { NextRequest, NextResponse } from "next/server";
import { db, newsletterSubscribers } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Check if already subscribed
    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, trimmedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Already subscribed", alreadySubscribed: true },
        { status: 200 },
      );
    }

    // Insert new subscriber
    await db.insert(newsletterSubscribers).values({
      email: trimmedEmail,
      source: source || "website",
    });

    return NextResponse.json(
      { message: "Successfully subscribed" },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[newsletter] Subscription error:", error);

    // Handle duplicate key violation
    if (error?.code === "23505") {
      return NextResponse.json(
        { message: "Already subscribed", alreadySubscribed: true },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 },
    );
  }
}
