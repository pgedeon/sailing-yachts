import { NextResponse } from 'next/server'
import { ensureSchema, pool } from '@/lib/db'
import {
  calculateCompletenessScore,
  getCompletenessLevel,
  getMissingFields,
  calculateAverageScore,
  SPEC_CATEGORIES,
} from '@/lib/completeness'

export const dynamic = 'force-dynamic'

interface YachtRow {
  id: number
  model_name: string
  manufacturer_name: string | null
  year: number | null
  slug: string | null
  length_overall: string | number | null
  beam: string | number | null
  draft: string | number | null
  displacement: string | number | null
  ballast: string | number | null
  sail_area_main: string | number | null
  rig_type: string | null
  keel_type: string | null
  hull_material: string | null
  cabins: number | null
  berths: number | null
  heads: number | null
  engine_hp: string | number | null
  engine_type: string | null
  fuel_capacity: string | number | null
  water_capacity: string | number | null
  description: string | null
  design_notes: string | null
  source_url: string | null
  completeness_score: number | null
  media_count: number | null
}

export async function GET() {
  try {
    await ensureSchema()

    const result = await pool.query(`
      SELECT
        y.id,
        y.model_name,
        m.name AS manufacturer_name,
        y.year,
        y.slug,
        y.length_overall,
        y.beam,
        y.draft,
        y.displacement,
        y.ballast,
        y.sail_area_main,
        y.rig_type,
        y.keel_type,
        y.hull_material,
        y.cabins,
        y.berths,
        y.heads,
        y.engine_hp,
        y.engine_type,
        y.fuel_capacity,
        y.water_capacity,
        y.description,
        y.design_notes,
        y.source_url,
        y.completeness_score,
        COALESCE(y.media_count, 0) AS media_count
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      ORDER BY y.id
    `)

    const yachts = result.rows.map((row: YachtRow) => {
      const mapped = {
        lengthOverall: row.length_overall,
        beam: row.beam,
        draft: row.draft,
        displacement: row.displacement,
        ballast: row.ballast,
        sailAreaMain: row.sail_area_main,
        rigType: row.rig_type,
        keelType: row.keel_type,
        hullMaterial: row.hull_material,
        cabins: row.cabins,
        berths: row.berths,
        heads: row.heads,
        engineHp: row.engine_hp,
        engineType: row.engine_type,
        fuelCapacity: row.fuel_capacity,
        waterCapacity: row.water_capacity,
        description: row.description,
        designNotes: row.design_notes,
      }

      const score = calculateCompletenessScore(mapped)
      const missingFields = getMissingFields(mapped)
      const level = getCompletenessLevel(score)

      return {
        id: row.id,
        modelName: row.model_name,
        manufacturer: row.manufacturer_name ?? 'Unknown',
        year: row.year,
        slug: row.slug,
        score,
        level,
        missingFields,
        missingCount: missingFields.length,
        mediaCount: Number(row.media_count) || 0,
        storedScore: row.completeness_score,
      }
    })

    // Compute stats
    const totalYachts = yachts.length
    const averageScore = calculateAverageScore(
      yachts.map((y) => ({
        lengthOverall: 1, beam: 1, draft: 1, displacement: 1, ballast: 1,
        sailAreaMain: 1, rigType: 'x', keelType: 'x', hullMaterial: 'x',
        cabins: 1, berths: 1, heads: 1, engineHp: 1, engineType: 'x',
        fuelCapacity: 1, waterCapacity: 1, description: 'x', designNotes: 'x',
        // Override with actual score
        _score: y.score,
      }))
    )

    const scoreDistribution = {
      comprehensive: yachts.filter((y) => y.score >= 80).length,
      good: yachts.filter((y) => y.score >= 60 && y.score < 80).length,
      partial: yachts.filter((y) => y.score >= 40 && y.score < 60).length,
      basic: yachts.filter((y) => y.score >= 20 && y.score < 40).length,
      minimal: yachts.filter((y) => y.score < 20).length,
    }

    // Most commonly missing fields across all yachts
    const missingFieldCounts: Record<string, number> = {}
    for (const yacht of yachts) {
      for (const field of yacht.missingFields) {
        missingFieldCounts[field] = (missingFieldCounts[field] || 0) + 1
      }
    }
    const topMissingFields = Object.entries(missingFieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([field, count]) => ({ field, count, percentage: Math.round((count / totalYachts) * 100) }))

    // Yachts needing the most attention (lowest scores)
    const needsAttention = [...yachts]
      .sort((a, b) => a.score - b.score)
      .slice(0, 50)

    // Recalculate average properly
    const avgScore = totalYachts > 0
      ? Math.round(yachts.reduce((sum, y) => sum + y.score, 0) / totalYachts)
      : 0

    // Category completion rates
    const categoryCompletion: Record<string, { label: string; completionRate: number; weight: number }> = {}
    for (const [key, category] of Object.entries(SPEC_CATEGORIES)) {
      const label = key.charAt(0).toUpperCase() + key.slice(1)
      let populated = 0
      let total = yachts.length * category.fields.length
      for (const yacht of yachts) {
        for (const field of category.fields) {
          if (!yacht.missingFields.includes(field)) {
            populated++
          }
        }
      }
      categoryCompletion[key] = {
        label,
        completionRate: total > 0 ? Math.round((populated / total) * 100) : 0,
        weight: category.weight,
      }
    }

    return NextResponse.json({
      stats: {
        totalYachts,
        averageScore: avgScore,
        scoreDistribution,
        topMissingFields,
        categoryCompletion,
      },
      needsAttention,
    })
  } catch (error) {
    console.error('Failed to compute completeness audit:', error)
    return NextResponse.json(
      { error: 'Failed to compute completeness audit' },
      { status: 500 }
    )
  }
}
