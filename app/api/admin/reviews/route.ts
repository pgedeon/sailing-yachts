import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db, reviews, yachtModels, manufacturers } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { validate, createReviewSchema } from '@/lib/validations'
import { revalidateTag } from 'next/cache'

function mapReview(row: any) {
  return {
    id: row.id,
    yachtModelId: row.yacht_model_id ?? row.yachtModelId,
    source: row.source,
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : null,
    summary: row.summary ?? null,
    fullText: row.full_text ?? row.fullText ?? null,
    reviewDate: row.review_date ?? row.reviewDate ?? null,
    authorName: row.author_name ?? row.authorName ?? null,
    sourceUrl: row.source_url ?? row.sourceUrl ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    yachtModelName: row.yacht_model_name ?? null,
    manufacturerName: row.manufacturer_name ?? null,
  }
}

export async function GET() {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
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
      .orderBy(desc(reviews.createdAt))

    const mappedReviews = result.map((r: any) => ({
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
    }))

    return NextResponse.json({ reviews: mappedReviews })
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    const validation = validate(createReviewSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify the yacht model exists
    const yachtCheck = await db
      .select({ id: yachtModels.id, modelName: yachtModels.modelName })
      .from(yachtModels)
      .where(eq(yachtModels.id, data.yachtModelId))
      .limit(1)

    if (yachtCheck.length === 0) {
      return NextResponse.json(
        { error: 'Yacht model not found' },
        { status: 404 }
      )
    }

    const result = await db
      .insert(reviews)
      .values({
        yachtModelId: data.yachtModelId,
        source: data.source,
        rating: data.rating !== null && data.rating !== undefined ? String(data.rating) : null,
        summary: data.summary ?? null,
        fullText: data.fullText ?? null,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
        authorName: data.authorName ?? null,
        sourceUrl: data.sourceUrl && data.sourceUrl !== '' ? data.sourceUrl : null,
      })
      .returning()

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
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
