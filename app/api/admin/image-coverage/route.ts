import { NextResponse } from 'next/server'
import { ensureSchema, pool } from '@/lib/db'

interface YachtWithImages {
  id: number
  model_name: string
  manufacturer_name: string | null
  slug: string | null
  year: number | null
  media_count: number
  has_images: boolean
  image_count: number
  media_asset_count: number
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ensureSchema()

    const result = await pool.query(`
      WITH image_counts AS (
        SELECT 
          yacht_model_id,
          COUNT(*)::int as image_count
        FROM images 
        GROUP BY yacht_model_id
      ),
      media_asset_counts AS (
        SELECT 
          yacht_model_id,
          COUNT(*)::int as media_count
        FROM media_assets 
        GROUP BY yacht_model_id
      )
      SELECT 
        ym.id,
        ym.model_name,
        y.name as manufacturer_name,
        ym.slug,
        ym.year,
        COALESCE(ym.media_count, 0) as media_count,
        COALESCE(ic.image_count, 0)::int as image_count,
        COALESCE(mac.media_count, 0)::int as media_asset_count,
        (COALESCE(ic.image_count, 0) > 0 OR COALESCE(mac.media_count, 0) > 0) as has_images
      FROM yacht_models ym
      LEFT JOIN manufacturers y ON ym.manufacturer_id = y.id
      LEFT JOIN image_counts ic ON ym.id = ic.yacht_model_id
      LEFT JOIN media_asset_counts mac ON ym.id = mac.yacht_model_id
      ORDER BY y.name, ym.model_name
    `)

    const yachts: YachtWithImages[] = result.rows

    // Calculate statistics
    const totalYachts = yachts.length
    const yachtsWithImages = yachts.filter(y => y.has_images).length
    const yachtsWithoutImages = yachts.filter(y => !y.has_images).length
    const totalImages = yachts.reduce((sum, y) => sum + (y.image_count || 0), 0)
    const totalMediaAssets = yachts.reduce((sum, y) => sum + (y.media_asset_count || 0), 0)

    // Find yachts that need attention (no images)
    const needsAttention = yachts
      .filter(y => !y.has_images)
      .slice(0, 100) // Limit to top 100

    // Manufacturer statistics
    const manufacturerStats: Record<string, { total: number; withImages: number; withoutImages: number }> = {}
    
    for (const yacht of yachts) {
      const manufacturer = yacht.manufacturer_name || 'Unknown'
      if (!manufacturerStats[manufacturer]) {
        manufacturerStats[manufacturer] = { total: 0, withImages: 0, withoutImages: 0 }
      }
      manufacturerStats[manufacturer].total++
      if (yacht.has_images) {
        manufacturerStats[manufacturer].withImages++
      } else {
        manufacturerStats[manufacturer].withoutImages++
      }
    }

    return NextResponse.json({
      stats: {
        totalYachts,
        yachtsWithImages,
        yachtsWithoutImages,
        totalImages,
        totalMediaAssets,
        coverageRate: totalYachts > 0 ? Math.round((yachtsWithImages / totalYachts) * 100) : 0,
        manufacturerStats
      },
      needsAttention,
    })
  } catch (error) {
    console.error('Failed to compute image coverage audit:', error)
    return NextResponse.json(
      { error: 'Failed to compute image coverage audit' },
      { status: 500 }
    )
  }
}
