import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'
import { authOptions } from '@/lib/auth'
import { db, pushSubscriptions } from '@/lib/db'

// GET /api/user/push-subscriptions — list current user's push subscriptions
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const subs = await db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        notifyNewMatches: pushSubscriptions.notifyNewMatches,
        notifyPriceChanges: pushSubscriptions.notifyPriceChanges,
        frequency: pushSubscriptions.frequency,
        quietHoursStart: pushSubscriptions.quietHoursStart,
        quietHoursEnd: pushSubscriptions.quietHoursEnd,
        createdAt: pushSubscriptions.createdAt,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, Number(session.user.id)))
      .orderBy(pushSubscriptions.createdAt)

    return NextResponse.json({ subscriptions: subs })
  } catch (error) {
    console.error('[push-subscriptions] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch push subscriptions' }, { status: 500 })
  }
}

// POST /api/user/push-subscriptions — register a new push subscription
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { endpoint, keys, notifyNewMatches, notifyPriceChanges, frequency, quietHoursStart, quietHoursEnd } = body

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 })
    }
    if (!keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'keys.p256dh and keys.auth are required' }, { status: 400 })
    }

    // Upsert: if endpoint already exists for this user, update it
    const existing = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, Number(session.user.id)),
          eq(pushSubscriptions.endpoint, endpoint),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256dh: keys.p256dh,
          auth: keys.auth,
          notifyNewMatches: notifyNewMatches ?? true,
          notifyPriceChanges: notifyPriceChanges ?? true,
          frequency: frequency ?? 'immediate',
          quietHoursStart: quietHoursStart ?? null,
          quietHoursEnd: quietHoursEnd ?? null,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.id, existing[0].id))

      return NextResponse.json({ success: true, updated: true })
    }

    // Insert new subscription
    await db.insert(pushSubscriptions).values({
      userId: Number(session.user.id),
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      notifyNewMatches: notifyNewMatches ?? true,
      notifyPriceChanges: notifyPriceChanges ?? true,
      frequency: frequency ?? 'immediate',
      quietHoursStart: quietHoursStart ?? null,
      quietHoursEnd: quietHoursEnd ?? null,
      userAgent: request.headers.get('user-agent')?.substring(0, 500) ?? null,
    })

    return NextResponse.json({ success: true, created: true })
  } catch (error) {
    console.error('[push-subscriptions] POST error:', error)
    return NextResponse.json({ error: 'Failed to save push subscription' }, { status: 500 })
  }
}

// DELETE /api/user/push-subscriptions — remove a push subscription
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint query parameter required' }, { status: 400 })
    }

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, Number(session.user.id)),
          eq(pushSubscriptions.endpoint, endpoint),
        ),
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[push-subscriptions] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove push subscription' }, { status: 500 })
  }
}

// PATCH /api/user/push-subscriptions — update preferences for a subscription
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { endpoint, notifyNewMatches, notifyPriceChanges, frequency, quietHoursStart, quietHoursEnd } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof notifyNewMatches === 'boolean') updates.notifyNewMatches = notifyNewMatches
    if (typeof notifyPriceChanges === 'boolean') updates.notifyPriceChanges = notifyPriceChanges
    if (frequency) updates.frequency = frequency
    if (quietHoursStart !== undefined) updates.quietHoursStart = quietHoursStart
    if (quietHoursEnd !== undefined) updates.quietHoursEnd = quietHoursEnd

    await db
      .update(pushSubscriptions)
      .set(updates)
      .where(
        and(
          eq(pushSubscriptions.userId, Number(session.user.id)),
          eq(pushSubscriptions.endpoint, endpoint),
        ),
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[push-subscriptions] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update push subscription' }, { status: 500 })
  }
}
