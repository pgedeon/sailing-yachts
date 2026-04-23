import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ensureSchema, pool } from '@/lib/db'
import { revalidateTag } from 'next/cache'

// Numeric DB fields come as strings — normalize them
function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isNaN(n) ? null : n
}

/** GET /api/admin/media?yachtId=N — list media assets for a yacht */
export async function GET(request: Request) {
  const cookieStore = cookies()


  try {
    await ensureSchema()
    const { searchParams } = new URL(request.url)
    const yachtIdParam = searchParams.get('yachtId')

    if (!yachtIdParam) {
      return NextResponse.json(
        { error: 'yachtId query parameter is required' },
        { status: 400 },
      )
    }

    const yachtId = parseInt(yachtIdParam, 10)
    if (isNaN(yachtId)) {
      return NextResponse.json({ error: 'Invalid yacht ID' }, { status: 400 })
    }

    const result = await pool.query(
      `SELECT id, yacht_model_id, media_type, title, description, url, embed_url,
              thumbnail_url, source_url, file_format, file_size, caption, alt_text,
              is_primary, sort_order, data_source, source_confidence, last_verified_at,
              created_at, updated_at
       FROM media_assets
       WHERE yacht_model_id = $1
       ORDER BY sort_order, created_at`,
      [yachtId],
    )

    // Normalize numeric fields
    const assets = result.rows.map((row: Record<string, unknown>) => ({
      ...row,
      yacht_model_id: toNum(row.yacht_model_id as string | number | null),
      file_size: toNum(row.file_size as string | number | null),
      sort_order: toNum(row.sort_order as string | number | null),
      source_confidence: toNum(row.source_confidence as string | number | null),
      is_primary: row.is_primary === true || row.is_primary === 'true',
    }))

    return NextResponse.json({ mediaAssets: assets })
  } catch (error) {
    console.error('Failed to fetch media assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media assets' },
      { status: 500 },
    )
  }
}

/** POST /api/admin/media — create a new media asset */
export async function POST(request: Request) {
  const cookieStore = cookies()


  try {
    await ensureSchema()
    const body = await request.json()

    const {
      yachtModelId,
      mediaType = 'photo',
      title,
      description,
      url,
      embedUrl,
      thumbnailUrl,
      sourceUrl,
      fileFormat,
      fileSize,
      caption,
      altText,
      isPrimary = false,
      sortOrder = 0,
      dataSource = 'manual',
      sourceConfidence = 50,
    } = body

    if (!yachtModelId) {
      return NextResponse.json(
        { error: 'yachtModelId is required' },
        { status: 400 },
      )
    }

    const yachtId = Number(yachtModelId)
    if (isNaN(yachtId)) {
      return NextResponse.json(
        { error: 'Invalid yachtModelId' },
        { status: 400 },
      )
    }

    // Verify yacht exists
    const yachtCheck = await pool.query(
      'SELECT id FROM yacht_models WHERE id = $1',
      [yachtId],
    )
    if (yachtCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Yacht not found' },
        { status: 404 },
      )
    }

    const result = await pool.query(
      `INSERT INTO media_assets (
        yacht_model_id, media_type, title, description, url, embed_url,
        thumbnail_url, source_url, file_format, file_size, caption, alt_text,
        is_primary, sort_order, data_source, source_confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        yachtId,
        mediaType,
        title || null,
        description || null,
        url || null,
        embedUrl || null,
        thumbnailUrl || null,
        sourceUrl || null,
        fileFormat || null,
        fileSize || null,
        caption || null,
        altText || null,
        isPrimary,
        sortOrder || 0,
        dataSource,
        sourceConfidence || 50,
      ],
    )

    // Update media_count on the yacht
    await pool.query(
      `UPDATE yacht_models SET media_count = (
        SELECT COUNT(*) FROM media_assets WHERE yacht_model_id = $1
      ) WHERE id = $1`,
      [yachtId],
    )

    revalidateTag('yachts')
    revalidateTag(`yacht:${yachtId}`)

    const asset = result.rows[0]
    return NextResponse.json(
      {
        mediaAsset: {
          ...asset,
          yacht_model_id: toNum(asset.yacht_model_id),
          file_size: toNum(asset.file_size),
          sort_order: toNum(asset.sort_order),
          source_confidence: toNum(asset.source_confidence),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Failed to create media asset:', error)
    return NextResponse.json(
      { error: 'Failed to create media asset' },
      { status: 500 },
    )
  }
}

/** PATCH /api/admin/media?id=N — update a media asset */
export async function PATCH(request: Request) {
  const cookieStore = cookies()


  try {
    await ensureSchema()
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')

    if (!idParam) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 },
      )
    }

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid media asset ID' }, { status: 400 })
    }

    const body = await request.json()

    // Build dynamic SET clause
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

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`)

    if (setClauses.length === 1) {
      // Only updated_at, nothing to update
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
    revalidateTag('yachts')
    if (yachtId) revalidateTag(`yacht:${yachtId}`)

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

/** DELETE /api/admin/media?id=N — delete a media asset */
export async function DELETE(request: Request) {
  const cookieStore = cookies()


  try {
    await ensureSchema()
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')

    if (!idParam) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 },
      )
    }

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid media asset ID' }, { status: 400 })
    }

    // Get yacht_model_id before deleting for cache invalidation
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

    // Update media_count on the yacht
    if (yachtId) {
      await pool.query(
        `UPDATE yacht_models SET media_count = (
          SELECT COUNT(*) FROM media_assets WHERE yacht_model_id = $1
        ) WHERE id = $1`,
        [yachtId],
      )
    }

    revalidateTag('yachts')
    if (yachtId) revalidateTag(`yacht:${yachtId}`)

    return NextResponse.json({ message: 'Media asset deleted successfully' })
  } catch (error) {
    console.error('Failed to delete media asset:', error)
    return NextResponse.json(
      { error: 'Failed to delete media asset' },
      { status: 500 },
    )
  }
}
