import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'
import { authOptions } from '@/lib/auth'
import { db, alertPreferences } from '@/lib/db'
import { validateBody, alertPreferencesSchema } from '@/lib/api-validate'

// GET /api/alerts/preferences — list user's alert preferences
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const prefs = await db
      .select()
      .from(alertPreferences)
      .where(eq(alertPreferences.userId, Number(session.user.id)))

    return NextResponse.json({ preferences: prefs })
  } catch (error) {
    console.error('[alert-prefs] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

// PUT /api/alerts/preferences — update or create a preference
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validation = validateBody(alertPreferencesSchema, body)
    if (!validation.ok) return validation.response
    const { alertType, enabled, frequency } = validation.data

    const userId = Number(session.user.id)

    // Upsert: check if preference exists
    const existing = await db
      .select()
      .from(alertPreferences)
      .where(and(
        eq(alertPreferences.userId, userId),
        eq(alertPreferences.alertType, alertType),
      ))
      .limit(1)

    if (existing.length > 0) {
      // Update
      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (typeof enabled === 'boolean') updates.enabled = enabled
      if (frequency) updates.frequency = frequency

      await db
        .update(alertPreferences)
        .set(updates)
        .where(eq(alertPreferences.id, existing[0].id))

      return NextResponse.json({ success: true, id: existing[0].id, action: 'updated' })
    } else {
      // Insert
      const result = await db
        .insert(alertPreferences)
        .values({
          userId,
          alertType,
          enabled: typeof enabled === 'boolean' ? enabled : true,
          frequency: frequency || 'daily',
        })
        .returning({ id: alertPreferences.id })

      return NextResponse.json({ success: true, id: result[0].id, action: 'created' })
    }
  } catch (error) {
    console.error('[alert-prefs] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 })
  }
}
