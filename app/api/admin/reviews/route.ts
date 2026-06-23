import { NextResponse } from 'next/server'
import { db, reviews, yachtModels, manufacturers, pool } from '@/lib/db'
import { eq, desc, sql } from 'drizzle-orm'
import { validate, createReviewSchema } from '@/lib/validations'
import { revalidateTag } from 'next/cache'

function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isNaN(n) ? null : n
}

function mapReview(row: Record<string, unknown>) {
  return {
    id: toNum(row.id as string | number | null),
    yachtModelId: toNum(row.yacht_model_id as string | number | null),
    source: (row.source as string) ?? null,
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : null,
    summary: (row.summary as string) ?? null,
    fullText: (row.full_text as string) ?? null,
    reviewDate: (row.review_date as string) ?? null,
    authorName: (row.author_name as string) ?? null,
    sourceUrl: (row.source_url as string) ?? null,
    reviewType: (row.review_type as string) ?? 'expert',
    verified: row.verified === true || row.verified === 'true',
    ratingBreakdown: row.rating_breakdown ?? null,
    helpfulCount: toNum(row.helpful_count as string | number | null) ?? 0,
    reviewerProfile: row.reviewer_profile ?? null,
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    createdAt: (row.created_at as string) ?? null,
    yachtModelName: (row.yacht_model_name as string) ?? null,
    manufacturerName: (row.manufacturer_name as string) ?? null,
  }
}

/** GET /api/admin/reviews?status=pending|verified|rejected — list reviews */
export async function GET(request: Request) {

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, verified, rejected

    let statusCondition = ''
    if (status === 'pending') {
      statusCondition = 'WHERE r.verified = false'
    } else if (status === 'verified') {
      statusCondition = 'WHERE r.verified = true'
    }
    // 'rejected' or no filter — show all for now; rejection would use a separate column or status

    const result = await pool.query(
      `SELECT r.*, ym.model_name as yacht_model_name, m.name as manufacturer_name
       FROM reviews r
       LEFT JOIN yacht_models ym ON r.yacht_model_id = ym.id
       LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
       ${statusCondition}
       ORDER BY r.created_at DESC`,
    )

    const mappedReviews = result.rows.map(mapReview)
    return NextResponse.json({ reviews: mappedReviews })
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

/** POST /api/admin/reviews — create a review (admin) */
export async function POST(request: Request) {

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

    revalidateTag('yachts', 'default')

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

/** PATCH /api/admin/reviews?id=N — update review (approve/verify, reject) */
export async function PATCH(request: Request) {

  try {
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')
    if (!idParam) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 })
    }
    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
    }

    const body = await request.json()

    // Build dynamic SET clause for allowed fields
    const allowedFields = ['verified', 'review_type', 'summary', 'full_text', 'author_name', 'source_url', 'rating', 'helpful_count', 'pros', 'cons']
    const setClauses: string[] = []
    const values: unknown[] = []
    let paramIdx = 1

    for (const field of allowedFields) {
      if (field in body) {
        let val = body[field]
        if (field === 'rating' && val !== null) val = String(val)
        if (field === 'verified') val = !!val
        setClauses.push(`${field} = $${paramIdx++}`)
        values.push(val ?? null)
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    values.push(id)
    const result = await pool.query(
      `UPDATE reviews SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values,
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Revalidate caches
    const yachtModelId = toNum(result.rows[0].yacht_model_id)
    revalidateTag('yachts', 'default')
    if (yachtModelId) revalidateTag(`yacht:${yachtModelId}`, 'default')

    return NextResponse.json({ review: mapReview(result.rows[0]) })
  } catch (error) {
    console.error('Failed to update review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

/** DELETE /api/admin/reviews?id=N — remove review */
export async function DELETE(request: Request) {

  try {
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')
    if (!idParam) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 })
    }
    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
    }

    // Get yacht_model_id before deleting for cache invalidation
    const existing = await pool.query(
      'SELECT yacht_model_id FROM reviews WHERE id = $1',
      [id],
    )
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const yachtModelId = toNum(existing.rows[0].yacht_model_id)

    await pool.query('DELETE FROM reviews WHERE id = $1', [id])

    revalidateTag('yachts', 'default')
    if (yachtModelId) revalidateTag(`yacht:${yachtModelId}`, 'default')

    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Failed to delete review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
