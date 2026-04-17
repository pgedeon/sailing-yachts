/**
 * Alert engine — finds matching items and creates alerts for users.
 *
 * Alert types:
 * - new_yachts: yachts added since last check matching saved search filters
 * - price_changes: price drops on favorited yachts
 * - new_reviews: new reviews on favorited yachts
 */

import { eq, and, gt, lt, isNotNull, sql, desc } from "drizzle-orm";
import { db, users, savedSearches, userFavorites, yachtModels, manufacturers, yachtPrices, reviews, alertPreferences, alertLog } from "@/lib/db";
import { sendEmail, generateUnsubscribeToken, type EmailResult } from "./email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";

interface AlertItem {
  userId: number;
  userEmail: string;
  userName: string | null;
  alertType: string;
  savedSearchId?: number;
  yachtModelId?: number;
  title: string;
  body: string;
  yachts?: Array<{
    slug: string | null;
    modelName: string;
    manufacturerName: string;
    year: number;
    lengthOverall: string | null;
  }>;
}

/**
 * Run all scheduled alert checks. Called by the cron endpoint.
 */
export async function runAlertChecks(): Promise<{
  processed: number;
  sent: number;
  errors: number;
}> {
  console.log("[alerts] Starting alert checks...");
  let processed = 0;
  let sent = 0;
  let errors = 0;

  // Get all users with alerts enabled
  const prefs = await db
    .select({
      userId: alertPreferences.userId,
      alertType: alertPreferences.alertType,
      frequency: alertPreferences.frequency,
    })
    .from(alertPreferences)
    .where(eq(alertPreferences.enabled, true));

  // Group by user
  const userAlerts = new Map<number, Map<string, string>>();
  for (const pref of prefs) {
    if (!userAlerts.has(pref.userId)) {
      userAlerts.set(pref.userId, new Map());
    }
    userAlerts.get(pref.userId)!.set(pref.alertType, pref.frequency);
  }

  for (const [userId, alertTypes] of userAlerts) {
    try {
      // Get user info
      const userRows = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userRows.length === 0) continue;
      const user = userRows[0];

      // Check frequency — skip if not due yet
      // For simplicity: daily alerts always run when cron fires (once daily),
      // weekly alerts only on Mondays

      for (const [alertType, frequency] of alertTypes) {
        if (frequency === "weekly") {
          const now = new Date();
          // Only run weekly alerts on Monday
          if (now.getUTCDay() !== 1) continue;
        }

        let alerts: AlertItem[] = [];

        switch (alertType) {
          case "new_yachts":
            alerts = await findNewYachtsForUser(userId, user);
            break;
          case "price_changes":
            alerts = await findPriceChangesForUser(userId, user);
            break;
          case "new_reviews":
            alerts = await findNewReviewsForUser(userId, user);
            break;
        }

        for (const alert of alerts) {
          processed++;
          const result = await deliverAlert(alert);
          if (result.success) sent++;
          else errors++;
        }
      }
    } catch (error) {
      console.error(`[alerts] Error processing user ${userId}:`, error);
      errors++;
    }
  }

  console.log(`[alerts] Complete: ${processed} processed, ${sent} sent, ${errors} errors`);
  return { processed, sent, errors };
}

/**
 * Find new yachts matching any of the user's saved searches.
 */
async function findNewYachtsForUser(userId: number, user: { email: string; name: string | null }): Promise<AlertItem[]> {
  const alerts: AlertItem[] = [];

  // Get user's saved searches
  const searches = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId));

  if (searches.length === 0) return alerts;

  // Check last alert time for this type
  const lastAlert = await db
    .select({ sentAt: alertLog.sentAt })
    .from(alertLog)
    .where(and(
      eq(alertLog.userId, userId),
      eq(alertLog.alertType, "new_yachts"),
    ))
    .orderBy(desc(alertLog.sentAt))
    .limit(1);

  const since = lastAlert.length > 0
    ? lastAlert[0].sentAt
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days

  for (const search of searches) {
    const params = search.searchParams as Record<string, unknown>;

    // Build conditions for matching
    const conditions = [gt(yachtModels.createdAt, since)];

    if (params.minLength) conditions.push(gt(yachtModels.lengthOverall, String(params.minLength)));
    if (params.maxLength) conditions.push(lt(yachtModels.lengthOverall, String(params.maxLength)));
    if (params.rigType) conditions.push(eq(yachtModels.rigType, String(params.rigType)));
    if (params.keelType) conditions.push(eq(yachtModels.keelType, String(params.keelType)));
    if (params.hullMaterial) conditions.push(eq(yachtModels.hullMaterial, String(params.hullMaterial)));
    if (params.cabins) conditions.push(eq(yachtModels.cabins, Number(params.cabins)));

    const newYachts = await db
      .select({
        slug: yachtModels.slug,
        modelName: yachtModels.modelName,
        year: yachtModels.year,
        lengthOverall: yachtModels.lengthOverall,
        manufacturerId: yachtModels.manufacturerId,
        manufacturerName: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(and(...conditions))
      .limit(20);

    if (newYachts.length === 0) continue;

    const searchName = search.name || "Saved Search";
    const title = `${newYachts.length} new yacht${newYachts.length > 1 ? "s" : ""} match "${searchName}"`;
    const body = newYachts
      .map((y: any) => `- ${y.manufacturerName || "Unknown"} ${y.modelName} (${y.year})${y.lengthOverall ? ` — ${y.lengthOverall}m` : ""}`)
      .join("\n");

    alerts.push({
      userId,
      userEmail: user.email,
      userName: user.name,
      alertType: "new_yachts",
      savedSearchId: search.id,
      title,
      body,
      yachts: newYachts,
    });
  }

  return alerts;
}

/**
 * Find price changes on favorited yachts.
 */
async function findPriceChangesForUser(userId: number, user: { email: string; name: string }): Promise<AlertItem[]> {
  const alerts: AlertItem[] = [];

  // Get user's favorite yacht IDs
  const favorites = await db
    .select({ yachtModelId: userFavorites.yachtModelId })
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId));

  if (favorites.length === 0) return alerts;

  // Check last alert time
  const lastAlert = await db
    .select({ sentAt: alertLog.sentAt })
    .from(alertLog)
    .where(and(
      eq(alertLog.userId, userId),
      eq(alertLog.alertType, "price_changes"),
    ))
    .orderBy(desc(alertLog.sentAt))
    .limit(1);

  const since = lastAlert.length > 0
    ? lastAlert[0].sentAt
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const fav of favorites) {
    // Get latest price
    const latestPrices = await db
      .select()
      .from(yachtPrices)
      .where(and(
        eq(yachtPrices.yachtModelId, fav.yachtModelId),
        eq(yachtPrices.isActive, true),
        gt(yachtPrices.updatedAt, since),
      ))
      .orderBy(desc(yachtPrices.updatedAt))
      .limit(1);

    if (latestPrices.length === 0) continue;

    const price = latestPrices[0];

    // Get yacht details
    const yachtRows = await db
      .select({
        modelName: yachtModels.modelName,
        slug: yachtModels.slug,
        manufacturerName: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(eq(yachtModels.id, fav.yachtModelId))
      .limit(1);

    if (yachtRows.length === 0) continue;
    const yacht = yachtRows[0];

    const title = `Price update: ${yacht.manufacturerName || ""} ${yacht.modelName}`;
    const body = `${yacht.manufacturerName || ""} ${yacht.modelName}: ${price.currency} ${price.priceMin}–${price.priceMax} (${price.condition})`;

    alerts.push({
      userId,
      userEmail: user.email,
      userName: user.name,
      alertType: "price_changes",
      yachtModelId: fav.yachtModelId,
      title,
      body,
    });
  }

  return alerts;
}

/**
 * Find new reviews on favorited yachts.
 */
async function findNewReviewsForUser(userId: number, user: { email: string; name: string | null }): Promise<AlertItem[]> {
  const alerts: AlertItem[] = [];

  const favorites = await db
    .select({ yachtModelId: userFavorites.yachtModelId })
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId));

  if (favorites.length === 0) return alerts;

  const lastAlert = await db
    .select({ sentAt: alertLog.sentAt })
    .from(alertLog)
    .where(and(
      eq(alertLog.userId, userId),
      eq(alertLog.alertType, "new_reviews"),
    ))
    .orderBy(desc(alertLog.sentAt))
    .limit(1);

  const since = lastAlert.length > 0
    ? lastAlert[0].sentAt
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const fav of favorites) {
    const newReviews = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.yachtModelId, fav.yachtModelId),
        gt(reviews.createdAt, since),
      ))
      .limit(10);

    if (newReviews.length === 0) continue;

    const yachtRows = await db
      .select({
        modelName: yachtModels.modelName,
        slug: yachtModels.slug,
        manufacturerName: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(eq(yachtModels.id, fav.yachtModelId))
      .limit(1);

    if (yachtRows.length === 0) continue;
    const yacht = yachtRows[0];

    const title = `${newReviews.length} new review${newReviews.length > 1 ? "s" : ""} for ${yacht.manufacturerName || ""} ${yacht.modelName}`;
    const body = newReviews
      .map((r: any) => `- ${r.authorName || "Anonymous"}: ${r.summary || r.fullText?.substring(0, 100) || "New review"}${r.rating ? ` (${r.rating}/5)` : ""}`)
      .join("\n");

    alerts.push({
      userId,
      userEmail: user.email,
      userName: user.name,
      alertType: "new_reviews",
      yachtModelId: fav.yachtModelId,
      title,
      body,
    });
  }

  return alerts;
}

/**
 * Deliver an alert — send email and log it.
 */
async function deliverAlert(alert: AlertItem): Promise<EmailResult> {
  const token = generateUnsubscribeToken();

  const yachtLinks = alert.yachts
    ? alert.yachts
        .map((y: any) => {
          const slug = y.slug;
          return `<li><a href="${SITE_URL}/yachts/${slug}">${y.manufacturerName || ""} ${y.modelName} (${y.year})</a>${y.lengthOverall ? ` — ${y.lengthOverall}m` : ""}</li>`;
        })
        .join("")
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="margin: 0; font-size: 20px; color: #1e40af;">⛵ Sailing Yacht Info Alert</h1>
  </div>

  <h2 style="font-size: 18px; margin-bottom: 16px;">${escapeHtml(alert.title)}</h2>

  ${yachtLinks ? `<ul style="padding-left: 20px; line-height: 1.8;">${yachtLinks}</ul>` : `<p style="line-height: 1.6;">${escapeHtml(alert.body)}</p>`}

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 13px; color: #6b7280;">
      You're receiving this because you enabled alerts on Sailing Yacht Info.
      <br/>
      <a href="${SITE_URL}/api/alerts/unsubscribe?token=${token}" style="color: #6b7280;">Unsubscribe from this alert type</a>
    </p>
  </div>
</body>
</html>`;

  const text = `${alert.title}\n\n${alert.body}\n\n---\nUnsubscribe: ${SITE_URL}/api/alerts/unsubscribe?token=${token}`;

  const result = await sendEmail({
    to: alert.userEmail,
    subject: alert.title,
    html,
    text,
  });

  // Log the alert regardless of email success
  try {
    await db.insert(alertLog).values({
      userId: alert.userId,
      alertType: alert.alertType,
      savedSearchId: alert.savedSearchId || null,
      yachtModelId: alert.yachtModelId || null,
      title: alert.title,
      body: alert.body,
      emailSent: result.success,
      emailStatus: result.success ? "sent" : "failed",
      unsubscribeToken: token,
      sentAt: new Date(),
    });
  } catch (logError) {
    console.error("[alerts] Failed to log alert:", logError);
  }

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
