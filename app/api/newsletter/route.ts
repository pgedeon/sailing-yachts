import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, newsletterSubscribers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkRateLimit, getClientIp, rateLimitHeaders, WRITE_RATE_LIMIT } from "@/lib/rate-limit";

const newsletterSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  source: z.string().max(100).optional().default("website"),
});

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    // Rate limit (write: 20/min)
    const ip = getClientIp(request);
    const rlResult = checkRateLimit(`newsletter:${ip}`, WRITE_RATE_LIMIT);
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)),
            ...rateLimitHeaders(rlResult),
          },
        },
      );
    }

    const parsed = newsletterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const trimmedEmail = parsed.data.email.trim().toLowerCase();

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
      source: parsed.data.source,
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
