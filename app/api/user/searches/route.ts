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
    const { name, searchParams, resultCount } = body

    if (!searchParams || typeof searchParams !== 'object') {
      return NextResponse.json({ error: 'searchParams object required' }, { status: 400 })
    }

    const result = await db.insert(savedSearches).values({
      userId: Number(session.user.id),
      name: name || `Search — ${new Date().toLocaleDateString()}`,
      searchParams,
      resultCount: resultCount || null,
    }).returning({ id: savedSearches.id })

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error('[searches] POST error:', error)
    return NextResponse.json({ error: 'Failed to save search' }, { status: 500 })
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
