import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ensureSchema, pool } from '@/lib/db'
import { revalidateTag } from 'next/cache'

function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isNaN(n) ? null : n
}

/** GET /api/admin/media/[id] — get single media asset */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies()


  try {
    await ensureSchema()
    const { id: idParam } = params
    const id = parseInt(idParam, 10)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid media asset ID' },
        { status: 400 },
      )
    }

    const result = await pool.query(
      `SELECT id, yacht_model_id, media_type, title, description, url, embed_url,
              thumbnail_url, source_url, file_format, file_size, caption, alt_text,
              is_primary, sort_order, data_source, source_confidence, last_verified_at,
              created_at, updated_at
       FROM media_assets WHERE id = $1`,
      [id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Media asset not found' },
        { status: 404 },
      )
    }

    const asset = result.rows[0]
    return NextResponse.json({
      mediaAsset: {
        ...asset,
        yacht_model_id: toNum(asset.yacht_model_id),
        file_size: toNum(asset.file_size),
        sort_order: toNum(asset.sort_order),
        source_confidence: toNum(asset.source_confidence),
      },
    })
  } catch (error) {
    console.error('Failed to fetch media asset:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media asset' },
      { status: 500 },
    )
  }
}

/** PATCH /api/admin/media/[id] — update media asset */
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies()


  try {
    await ensureSchema()
    const { id: idParam } = params
    const id = parseInt(idParam, 10)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid media asset ID' },
        { status: 400 },
      )
    }

    const body = await request.json()

    const allowedFields = [
      'media_type', 'title', 'description', 'url', 'embed_url',
      'thumbnail_url', 'source_url', 'file_format', 'file_size', 'caption',
      'alt_text', 'is_primary', 'sort_order', 'data_source', 'source_confidence',
      'last_verified_at',
    ]

    const setClauses: string[] = []
    const values: unknown[] = []
    let paramIdx = 1

    for (const field of allowedFields) {
      if (field in body) {
        setClauses.push(`${field} = $${paramIdx++}`)
        values.push(body[field] ?? null)
      }
    }

    setClauses.push(`updated_at = NOW()`)

    if (setClauses.length === 1) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 },
      )
    }

    values.push(id)
    const result = await pool.query(
      `UPDATE media_assets SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values,
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Media asset not found' },
        { status: 404 },
      )
    }

    const yachtId = toNum(result.rows[0].yacht_model_id)
    revalidateTag('yachts', 'default')
    if (yachtId) revalidateTag(`yacht:${yachtId}`, 'default')

    const asset = result.rows[0]
    return NextResponse.json({
      mediaAsset: {
        ...asset,
        yacht_model_id: toNum(asset.yacht_model_id),
        file_size: toNum(asset.file_size),
        sort_order: toNum(asset.sort_order),
        source_confidence: toNum(asset.source_confidence),
      },
    })
  } catch (error) {
    console.error('Failed to update media asset:', error)
    return NextResponse.json(
      { error: 'Failed to update media asset' },
      { status: 500 },
    )
  }
}

/** DELETE /api/admin/media/[id] — delete media asset */
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies()


  try {
    await ensureSchema()
    const { id: idParam } = params
    const id = parseInt(idParam, 10)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid media asset ID' },
        { status: 400 },
      )
    }

    const existing = await pool.query(
      'SELECT yacht_model_id FROM media_assets WHERE id = $1',
      [id],
    )

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Media asset not found' },
        { status: 404 },
      )
    }

    const yachtId = toNum(existing.rows[0].yacht_model_id)

    await pool.query('DELETE FROM media_assets WHERE id = $1', [id])

    // Update media_count
    if (yachtId) {
      await pool.query(
        `UPDATE yacht_models SET media_count = (
          SELECT COUNT(*) FROM media_assets WHERE yacht_model_id = $1
        ) WHERE id = $1`,
        [yachtId],
      )
    }

    revalidateTag('yachts', 'default')
    if (yachtId) revalidateTag(`yacht:${yachtId}`, 'default')

    return NextResponse.json({ message: 'Media asset deleted successfully' })
  } catch (error) {
    console.error('Failed to delete media asset:', error)
    return NextResponse.json(
      { error: 'Failed to delete media asset' },
      { status: 500 },
    )
  }
}
