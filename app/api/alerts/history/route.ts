import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, desc } from 'drizzle-orm'
import { authOptions } from '@/lib/auth'
import { db, alertLog } from '@/lib/db'

// GET /api/alerts/history — list recent alerts for the user
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') || 20), 100)
    const type = searchParams.get('type')

    const conditions = [eq(alertLog.userId, Number(session.user.id))]
    if (type) {
      // Import and for type filtering
      const { and: andOp } = await import('drizzle-orm')
      const alerts = await db
        .select()
        .from(alertLog)
        .where(andOp(eq(alertLog.userId, Number(session.user.id)), eq(alertLog.alertType, type)))
        .orderBy(desc(alertLog.sentAt))
        .limit(limit)

      return NextResponse.json({ alerts, total: alerts.length })
    }

    const alerts = await db
      .select()
      .from(alertLog)
      .where(eq(alertLog.userId, Number(session.user.id)))
      .orderBy(desc(alertLog.sentAt))
      .limit(limit)

    return NextResponse.json({ alerts, total: alerts.length })
  } catch (error) {
    console.error('[alert-history] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch alert history' }, { status: 500 })
  }
}
