import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db'
import { desc, eq, like, and, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET /api/admin/audit-logs — List audit logs with pagination and filters
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')))
    const action = searchParams.get('action')
    const resourceType = searchParams.get('resourceType')
    const userId = searchParams.get('userId')

    const conditions = []
    if (action) conditions.push(eq(auditLogs.action, action))
    if (resourceType) conditions.push(eq(auditLogs.resourceType, resourceType))
    if (userId) conditions.push(eq(auditLogs.userId, Number(userId)))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [logs, countResult] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(where),
    ])

    const total = countResult[0]?.count ?? 0

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[audit-api] Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
