import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db, reviews, yachtModels, manufacturers } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { validate, updateReviewSchema } from '@/lib/validations'
import { revalidateTag } from 'next/cache'

function parseId(id: string) {
  const value = Number(id)
  return Number.isFinite(value) ? value : null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  const { id } = await params
  const reviewId = parseId(id)
  if (!reviewId) {
    return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
  }

  try {
    const result = await db
      .select({
        review: reviews,
        modelName: yachtModels.modelName,
        manufacturerName: manufacturers.name,
      })
      .from(reviews)
      .leftJoin(yachtModels, eq(reviews.yachtModelId, yachtModels.id))
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(eq(reviews.id, reviewId))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const r = result[0]
    return NextResponse.json({
      review: {
        id: r.review.id,
        yachtModelId: r.review.yachtModelId,
        source: r.review.source,
        rating: r.review.rating !== null ? Number(r.review.rating) : null,
        summary: r.review.summary,
        fullText: r.review.fullText,
        reviewDate: r.review.reviewDate,
        authorName: r.review.authorName,
        sourceUrl: r.review.sourceUrl,
        createdAt: r.review.createdAt,
        yachtModelName: r.modelName ?? 'Unknown',
        manufacturerName: r.manufacturerName ?? 'Unknown',
      }
    })
  } catch (error) {
    console.error('Failed to fetch review:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  const { id } = await params
  const reviewId = parseId(id)
  if (!reviewId) {
    return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
  }

  try {
    const body = await request.json()

    const validation = validate(updateReviewSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (data.yachtModelId !== undefined) updateData.yachtModelId = data.yachtModelId
    if (data.source !== undefined) updateData.source = data.source
    if (data.rating !== undefined) updateData.rating = data.rating !== null ? String(data.rating) : null
    if (data.summary !== undefined) updateData.summary = data.summary
    if (data.fullText !== undefined) updateData.fullText = data.fullText
    if (data.reviewDate !== undefined) updateData.reviewDate = data.reviewDate ? new Date(data.reviewDate) : null
    if (data.authorName !== undefined) updateData.authorName = data.authorName
    if (data.sourceUrl !== undefined) updateData.sourceUrl = data.sourceUrl && data.sourceUrl !== '' ? data.sourceUrl : null

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const result = await db
      .update(reviews)
      .set(updateData)
      .where(eq(reviews.id, reviewId))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    revalidateTag('yachts')

    const review = result[0]
    return NextResponse.json({
      review: {
        id: review.id,
        yachtModelId: review.yachtModelId,
        source: review.source,
        rating: review.rating !== null ? Number(review.rating) : null,
        summary: review.summary,
        fullText: review.fullText,
        reviewDate: review.reviewDate,
        authorName: review.authorName,
        sourceUrl: review.sourceUrl,
        createdAt: review.createdAt,
      }
    })
  } catch (error) {
    console.error('Failed to update review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  const { id } = await params
  const reviewId = parseId(id)
  if (!reviewId) {
    return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
  }

  try {
    const result = await db
      .delete(reviews)
      .where(eq(reviews.id, reviewId))
      .returning({ id: reviews.id })

    if (result.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    revalidateTag('yachts')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
