import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'
import { authOptions } from '@/lib/auth'
import { db, savedComparisons } from '@/lib/db'
import { validateBody, userSavedComparisonSchema } from '@/lib/api-validate'

// GET /api/user/comparisons - list saved comparisons
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const comparisons = await db
      .select()
      .from(savedComparisons)
      .where(eq(savedComparisons.userId, Number(session.user.id)))

    return NextResponse.json({ comparisons })
  } catch (error) {
    console.error('[comparisons] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch comparisons' }, { status: 500 })
  }
}

// POST /api/user/comparisons - save a comparison
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validation = validateBody(userSavedComparisonSchema, body)
    if (!validation.ok) return validation.response
    const { name, yachtIds } = validation.data

    const result = await db.insert(savedComparisons).values({
      userId: Number(session.user.id),
      name: name || `Comparison of ${yachtIds.length} yachts`,
      yachtIds,
    }).returning({ id: savedComparisons.id })

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error('[comparisons] POST error:', error)
    return NextResponse.json({ error: 'Failed to save comparison' }, { status: 500 })
  }
}

// DELETE /api/user/comparisons - remove a saved comparison
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
      .delete(savedComparisons)
      .where(and(
        eq(savedComparisons.id, Number(id)),
        eq(savedComparisons.userId, Number(session.user.id))
      ))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[comparisons] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete comparison' }, { status: 500 })
  }
}
