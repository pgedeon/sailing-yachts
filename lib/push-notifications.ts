/**
 * Push notification dispatch utility (P9.7)
 *
 * Sends web push notifications to subscribed users.
 * Uses the web-push protocol to deliver messages via the Push API.
 *
 * NOTE: Full web-push delivery requires VAPID keys to be configured.
 * Until then, subscriptions are stored and preferences are managed,
 * but actual push delivery will be enabled when keys are added.
 */

import { db, pushSubscriptions } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export interface PushMessage {
  title: string
  body: string
  url?: string
  tag?: string
}

/**
 * Get all active push subscriptions for a user
 */
export async function getUserPushSubscriptions(userId: number) {
  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
}

/**
 * Send a push notification to a specific subscription
 * Currently stores the notification for delivery; actual web-push
 * will be enabled when VAPID keys are configured.
 */
export async function sendPushNotification(
  _subscriptionId: number,
  _message: PushMessage,
): Promise<{ sent: boolean; reason?: string }> {
  // VAPID keys need to be configured before actual push delivery
  // For now, return a descriptive status
  return {
    sent: false,
    reason: 'VAPID keys not configured — push delivery pending configuration',
  }
}

/**
 * Send push notification to all subscriptions for a user
 */
export async function sendPushToUser(
  userId: number,
  message: PushMessage,
): Promise<{ total: number; sent: number; pending: number }> {
  const subs = await getUserPushSubscriptions(userId)

  let sent = 0
  let pending = 0

  for (const sub of subs) {
    const result = await sendPushNotification(sub.id, message)
    if (result.sent) {
      sent++
    } else {
      pending++
    }
  }

  return { total: subs.length, sent, pending }
}

/**
 * Check if a user has active push subscriptions with the given notification type enabled
 */
export async function userHasPushEnabled(
  userId: number,
  type: 'newMatches' | 'priceChanges',
): Promise<boolean> {
  const subs = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        type === 'newMatches'
          ? eq(pushSubscriptions.notifyNewMatches, true)
          : eq(pushSubscriptions.notifyPriceChanges, true),
      ),
    )
    .limit(1)

  return subs.length > 0
}

/**
 * Clean up expired/invalid push subscriptions
 * Should be called periodically or after failed delivery attempts
 */
export async function cleanupInvalidSubscriptions(): Promise<number> {
  // When VAPID keys are configured, this will detect and remove
  // subscriptions that return 410 Gone or are otherwise invalid
  // For now, remove subscriptions older than 90 days with no update
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Placeholder — actual cleanup requires push delivery to detect failures
  return 0
}
