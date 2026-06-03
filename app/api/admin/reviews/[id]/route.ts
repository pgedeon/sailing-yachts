import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
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

function parseId(id: string) {
  const value = Number(id)
  return Number.isFinite(value) ? value : null
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {

  const { id } = params
  const reviewId = parseId(id)
  if (!reviewId) {
    return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
  }

  try {
    const result = await pool.query(
      `SELECT r.*, ym.model_name as yacht_model_name, m.name as manufacturer_name
       FROM reviews r
       LEFT JOIN yacht_models ym ON r.yacht_model_id = ym.id
       LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
       WHERE r.id = $1`,
      [reviewId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({ review: mapReview(result.rows[0]) })
  } catch (error) {
    console.error('Failed to fetch review:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {

  const { id } = params
  const reviewId = parseId(id)
  if (!reviewId) {
    return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
  }

  try {
    const body = await request.json()

    const allowedFields = [
      'verified', 'review_type', 'summary', 'full_text',
      'author_name', 'source_url', 'rating', 'helpful_count',
      'pros', 'cons', 'rating_breakdown', 'reviewer_profile',
    ]
    const setClauses: string[] = []
    const values: unknown[] = []
    let paramIdx = 1

    for (const field of allowedFields) {
      if (field in body) {
        let val = body[field]
        if (field === 'rating' && val !== null) val = String(val)
        if (field === 'verified') val = !!val
        if (field === 'rating_breakdown' || field === 'reviewer_profile') {
          val = JSON.stringify(val)
        }
        setClauses.push(`${field} = $${paramIdx++}`)
        values.push(val ?? null)
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(reviewId)
    const result = await pool.query(
      `UPDATE reviews SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values,
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const yachtModelId = toNum(result.rows[0].yacht_model_id)
    revalidateTag('yachts')
    if (yachtModelId) revalidateTag(`yacht:${yachtModelId}`)

    return NextResponse.json({ review: mapReview(result.rows[0]) })
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
  { params }: { params: { id: string } }
) {

  const { id } = params
  const reviewId = parseId(id)
  if (!reviewId) {
    return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
  }

  try {
    const existing = await pool.query(
      'SELECT yacht_model_id FROM reviews WHERE id = $1',
      [reviewId],
    )

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const yachtModelId = toNum(existing.rows[0].yacht_model_id)

    await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId])

    revalidateTag('yachts')
    if (yachtModelId) revalidateTag(`yacht:${yachtModelId}`)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
