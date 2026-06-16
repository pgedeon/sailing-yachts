import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'
import { authOptions } from '@/lib/auth'
import { db, userFavorites, yachtModels, manufacturers } from '@/lib/db'
import { validateBody, userFavoriteSchema } from '@/lib/api-validate'

// GET /api/user/favorites — list user's favorites with yacht details
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const favorites = await db
      .select({
        id: userFavorites.id,
        yachtModelId: userFavorites.yachtModelId,
        slug: yachtModels.slug,
        modelName: yachtModels.modelName,
        manufacturerId: yachtModels.manufacturerId,
        year: yachtModels.year,
        lengthOverall: yachtModels.lengthOverall,
        beam: yachtModels.beam,
        draft: yachtModels.draft,
        displacement: yachtModels.displacement,
        rigType: yachtModels.rigType,
        createdAt: userFavorites.createdAt,
        manufacturerName: manufacturers.name,
      })
      .from(userFavorites)
      .innerJoin(yachtModels, eq(userFavorites.yachtModelId, yachtModels.id))
      .innerJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(eq(userFavorites.userId, Number(session.user.id)))
      .orderBy(userFavorites.createdAt)

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('[favorites] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

// POST /api/user/favorites — add a favorite
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validation = validateBody(userFavoriteSchema, body)
    if (!validation.ok) return validation.response
    const { yachtModelId } = validation.data

    // Check if already favorited
    const existing = await db
      .select({ id: userFavorites.id })
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, Number(session.user.id)),
        eq(userFavorites.yachtModelId, yachtModelId)
      ))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 409 })
    }

    await db.insert(userFavorites).values({
      userId: Number(session.user.id),
      yachtModelId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[favorites] POST error:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}

// DELETE /api/user/favorites — remove a favorite
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const yachtModelId = searchParams.get('yachtModelId')

    if (!yachtModelId) {
      return NextResponse.json({ error: 'yachtModelId required' }, { status: 400 })
    }

    await db
      .delete(userFavorites)
      .where(and(
        eq(userFavorites.userId, Number(session.user.id)),
        eq(userFavorites.yachtModelId, Number(yachtModelId))
      ))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[favorites] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
  }
}
