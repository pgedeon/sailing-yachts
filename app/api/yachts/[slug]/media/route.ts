import { NextResponse } from 'next/server'
import { ensureSchema, pool } from '@/lib/db'

// ISR: revalidate every 5 minutes
export const revalidate = 300

export interface MediaAsset {
  id: number
  mediaType: string
  title: string | null
  description: string | null
  url: string | null
  embedUrl: string | null
  thumbnailUrl: string | null
  sourceUrl: string | null
  fileFormat: string | null
  fileSize: number | null
  caption: string | null
  altText: string | null
  isPrimary: boolean
  sortOrder: number
}

function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isNaN(n) ? null : n
}

/** GET /api/yachts/[slug]/media — public media assets for a yacht */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    await ensureSchema()
    const { slug } = params

    // Resolve yacht id from slug
    const yachtResult = await pool.query(
      'SELECT id FROM yacht_models WHERE slug = $1',
      [slug],
    )

    if (yachtResult.rows.length === 0) {
      return NextResponse.json({ error: 'Yacht not found' }, { status: 404 })
    }

    const yachtId = toNum(yachtResult.rows[0].id as string | number)!

    const result = await pool.query(
      `SELECT id, media_type, title, description, url, embed_url,
              thumbnail_url, source_url, file_format, file_size, caption,
              alt_text, is_primary, sort_order
       FROM media_assets
       WHERE yacht_model_id = $1
       ORDER BY sort_order, created_at`,
      [yachtId],
    )

    const assets: MediaAsset[] = result.rows.map(
      (row: Record<string, unknown>) => ({
        id: toNum(row.id as string | number | null)!,
        mediaType: String(row.media_type ?? 'photo'),
        title: (row.title as string) ?? null,
        description: (row.description as string) ?? null,
        url: (row.url as string) ?? null,
        embedUrl: (row.embed_url as string) ?? null,
        thumbnailUrl: (row.thumbnail_url as string) ?? null,
        sourceUrl: (row.source_url as string) ?? null,
        fileFormat: (row.file_format as string) ?? null,
        fileSize: toNum(row.file_size as string | number | null),
        caption: (row.caption as string) ?? null,
        altText: (row.alt_text as string) ?? null,
        isPrimary: row.is_primary === true || row.is_primary === 'true',
        sortOrder: toNum(row.sort_order as string | number | null) ?? 0,
      }),
    )

    // Group by media type for easier frontend consumption
    const grouped: Record<string, MediaAsset[]> = {}
    for (const asset of assets) {
      const type = asset.mediaType
      if (!grouped[type]) grouped[type] = []
      grouped[type].push(asset)
    }

    return NextResponse.json({ mediaAssets: assets, grouped, total: assets.length })
  } catch (error) {
    console.error('Error fetching yacht media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 },
    )
  }
}
