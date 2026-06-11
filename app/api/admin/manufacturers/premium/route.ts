import { NextResponse } from 'next/server'
import { ensureSchema, pool } from '@/lib/db'
import { revalidateTag } from 'next/cache'
import { slugify } from '@/lib/utils/slugify'

/**
 * P26.1: Premium listing tier management API
 * GET  — List all manufacturers with tier info
 * PATCH — Update tier for a specific manufacturer
 */

function mapPremiumManufacturer(row: any) {
  return {
    id: row.id,
    name: row.name,
    country: row.country ?? null,
    logoUrl: row.logo_url ?? null,
    tier: row.tier ?? 'free',
    verifiedAt: row.verified_at ?? null,
    premiumVideoUrl: row.premium_video_url ?? null,
    premiumDocuments: row.premium_documents ?? [],
    premiumTagline: row.premium_tagline ?? null,
    premiumFeaturedSince: row.premium_featured_since ?? null,
    premiumCtaText: row.premium_cta_text ?? null,
    premiumCtaUrl: row.premium_cta_url ?? null,
    yachtCount: Number(row.yacht_count ?? 0),
  }
}

export async function GET() {
  try {
    await ensureSchema()
    const result = await pool.query(`
      SELECT m.id, m.name, m.country, m.logo_url, m.tier, m.verified_at,
             m.premium_video_url, m.premium_documents, m.premium_tagline,
             m.premium_featured_since, m.premium_cta_text, m.premium_cta_url,
             COUNT(ym.id)::int AS yacht_count
      FROM manufacturers m
      LEFT JOIN yacht_models ym ON ym.manufacturer_id = m.id
      GROUP BY m.id
      ORDER BY 
        CASE m.tier WHEN 'premium' THEN 0 WHEN 'verified' THEN 1 ELSE 2 END,
        m.name
    `)
    const manufacturers = result.rows.map(mapPremiumManufacturer)
    return NextResponse.json({ manufacturers })
  } catch (error) {
    console.error('Failed to fetch premium manufacturers:', error)
    return NextResponse.json({ error: 'Failed to fetch manufacturers' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureSchema()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id || !Number.isFinite(Number(id))) {
      return NextResponse.json({ error: 'Valid manufacturer id required' }, { status: 400 })
    }

    const manufacturerId = Number(id)

    // Validate tier value
    if (updates.tier && !['free', 'verified', 'premium'].includes(updates.tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be: free, verified, or premium' },
        { status: 400 }
      )
    }

    // Build dynamic SET clause
    const setClauses: string[] = []
    const values: any[] = []
    let paramIdx = 1

    const allowedFields: Record<string, string> = {
      tier: 'tier',
      verifiedAt: 'verified_at',
      premiumVideoUrl: 'premium_video_url',
      premiumDocuments: 'premium_documents',
      premiumTagline: 'premium_tagline',
      premiumFeaturedSince: 'premium_featured_since',
      premiumCtaText: 'premium_cta_text',
      premiumCtaUrl: 'premium_cta_url',
    }

    for (const [key, column] of Object.entries(allowedFields)) {
      if (key in updates) {
        setClauses.push(`${column} = $${paramIdx}`)
        if (key === 'verifiedAt' && updates[key] === 'now') {
          values.push(new Date().toISOString())
        } else if (key === 'verifiedAt' && updates[key] === null) {
          values.push(null)
        } else if (key === 'premiumDocuments') {
          values.push(JSON.stringify(updates[key] || []))
        } else {
          values.push(updates[key] ?? null)
        }
        paramIdx++
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    values.push(manufacturerId)
    const result = await pool.query(
      `UPDATE manufacturers SET ${setClauses.join(', ')} WHERE id = $${paramIdx}
       RETURNING id, name, tier, verified_at, premium_video_url, premium_documents,
                 premium_tagline, premium_featured_since, premium_cta_text, premium_cta_url`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 })
    }

    // Revalidate caches
    revalidateTag('manufacturers')
    const name = result.rows[0].name
    if (name) {
      revalidateTag(`manufacturer:${slugify(name)}`)
    }

    return NextResponse.json({ manufacturer: mapPremiumManufacturer(result.rows[0]) })
  } catch (error) {
    console.error('Failed to update premium tier:', error)
    return NextResponse.json({ error: 'Failed to update premium tier' }, { status: 500 })
  }
}
