import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db, users } from "@/lib/db";

export const dynamic = "force-dynamic";

const DELETION_GRACE_DAYS = 30;

// GET — retrieve privacy settings for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const [user] = await db
      .select({
        analyticsOptOut: users.analyticsOptOut,
        communicationOptOut: users.communicationOptOut,
        dataSharingConsent: users.dataSharingConsent,
        deletionRequestedAt: users.deletionRequestedAt,
        deletionScheduledAt: users.deletionScheduledAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ privacySettings: user });
  } catch (error) {
    console.error("[account] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch privacy settings" }, { status: 500 });
  }
}

// PATCH — update privacy settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const updates: Record<string, boolean> = {};

    // Only allow updating specific privacy fields
    if (typeof body.analyticsOptOut === "boolean") {
      updates.analyticsOptOut = body.analyticsOptOut;
    }
    if (typeof body.communicationOptOut === "boolean") {
      updates.communicationOptOut = body.communicationOptOut;
    }
    if (typeof body.dataSharingConsent === "boolean") {
      updates.dataSharingConsent = body.dataSharingConsent;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, updated: Object.keys(updates) });
  } catch (error) {
    console.error("[account] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update privacy settings" }, { status: 500 });
  }
}

// DELETE — request account deletion (starts grace period)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const confirm = body.confirm === true;

    if (!confirm) {
      return NextResponse.json(
        { error: "Confirmation required. Pass { confirm: true } to proceed." },
        { status: 400 }
      );
    }

    const now = new Date();
    const scheduledDate = new Date(now);
    scheduledDate.setDate(scheduledDate.getDate() + DELETION_GRACE_DAYS);

    await db
      .update(users)
      .set({
        deletionRequestedAt: now,
        deletionScheduledAt: scheduledDate,
        isActive: false,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: `Account deletion scheduled. Your account will be permanently deleted on ${scheduledDate.toISOString().split("T")[0]}. You can cancel by signing back in before that date.`,
      deletionScheduledAt: scheduledDate.toISOString(),
      gracePeriodDays: DELETION_GRACE_DAYS,
    });
  } catch (error) {
    console.error("[account] DELETE error:", error);
    return NextResponse.json({ error: "Failed to request account deletion" }, { status: 500 });
  }
}

// POST — cancel pending account deletion (re-activate)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const [user] = await db
      .select({
        deletionScheduledAt: users.deletionScheduledAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.deletionScheduledAt) {
      return NextResponse.json({ error: "No pending deletion to cancel" }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        deletionRequestedAt: null,
        deletionScheduledAt: null,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "Account deletion cancelled. Your account is active again.",
    });
  } catch (error) {
    console.error("[account] POST (cancel) error:", error);
    return NextResponse.json({ error: "Failed to cancel deletion" }, { status: 500 });
  }
}
