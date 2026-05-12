import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'
import { authOptions } from '@/lib/auth'
import { db, savedSearches } from '@/lib/db'

// GET /api/user/searches - list saved searches
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searches = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, Number(session.user.id)))

    return NextResponse.json({ searches })
  } catch (error) {
    console.error('[searches] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 })
  }
}

// POST /api/user/searches - save a search
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, searchParams, resultCount, alertEnabled } = body

    if (!searchParams || typeof searchParams !== 'object') {
      return NextResponse.json({ error: 'searchParams object required' }, { status: 400 })
    }

    const result = await db.insert(savedSearches).values({
      userId: Number(session.user.id),
      name: name || `Search — ${new Date().toLocaleDateString()}`,
      searchParams,
      resultCount: resultCount || null,
      alertEnabled: typeof alertEnabled === 'boolean' ? alertEnabled : false,
    }).returning({ id: savedSearches.id })

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error('[searches] POST error:', error)
    return NextResponse.json({ error: 'Failed to save search' }, { status: 500 })
  }
}

// PUT /api/user/searches - update a saved search (e.g., toggle alert)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, name, alertEnabled } = body

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const userId = Number(session.user.id)

    // Verify ownership
    const existing = await db
      .select()
      .from(savedSearches)
      .where(and(eq(savedSearches.id, Number(id)), eq(savedSearches.userId, userId)))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof name === 'string') updates.name = name
    if (typeof alertEnabled === 'boolean') updates.alertEnabled = alertEnabled

    await db
      .update(savedSearches)
      .set(updates)
      .where(eq(savedSearches.id, Number(id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[searches] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update saved search' }, { status: 500 })
  }
}

// DELETE /api/user/searches - remove a saved search
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    await db
      .delete(savedSearches)
      .where(and(
        eq(savedSearches.id, Number(id)),
        eq(savedSearches.userId, Number(session.user.id))
      ))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[searches] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete search' }, { status: 500 })
  }
}
