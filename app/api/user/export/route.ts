import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db, users, userFavorites, savedComparisons, savedSearches, alertPreferences, pushSubscriptions, yachtModels, manufacturers } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Fetch user profile
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        analyticsOptOut: users.analyticsOptOut,
        communicationOptOut: users.communicationOptOut,
        dataSharingConsent: users.dataSharingConsent,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch favorites with yacht details
    const favorites = await db
      .select({
        id: userFavorites.id,
        yachtModelId: userFavorites.yachtModelId,
        modelName: yachtModels.modelName,
        manufacturerName: manufacturers.name,
        year: yachtModels.year,
        lengthOverall: yachtModels.lengthOverall,
        createdAt: userFavorites.createdAt,
      })
      .from(userFavorites)
      .leftJoin(yachtModels, eq(userFavorites.yachtModelId, yachtModels.id))
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(eq(userFavorites.userId, userId));

    // Fetch saved searches
    const searches = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, userId));

    // Fetch saved comparisons
    const comparisons = await db
      .select()
      .from(savedComparisons)
      .where(eq(savedComparisons.userId, userId));

    // Fetch alert preferences
    const alerts = await db
      .select()
      .from(alertPreferences)
      .where(eq(alertPreferences.userId, userId));

    // Fetch push subscriptions (redact sensitive keys)
    const pushSubs = await db
      .select({
        id: pushSubscriptions.id,
        notifyNewMatches: pushSubscriptions.notifyNewMatches,
        notifyPriceChanges: pushSubscriptions.notifyPriceChanges,
        frequency: pushSubscriptions.frequency,
        createdAt: pushSubscriptions.createdAt,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        ...user,
        id: undefined, // Don't expose internal ID
      },
      favorites,
      savedSearches: searches,
      savedComparisons: comparisons,
      alertPreferences: alerts,
      pushSubscriptions: pushSubs,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="sailing-yachts-data-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("[export] Error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
