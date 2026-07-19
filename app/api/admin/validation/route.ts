import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server'
import { ensureSchema, pool } from '@/lib/db'
import {
  validateSpecs,
  summarizeBulkValidation,
  type YachtValidationEntry,
} from '@/lib/spec-validation'

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
  max_occupancy: number | null
  engine_hp: string | number | null
  engine_type: string | null
  fuel_capacity: string | number | null
  water_capacity: string | number | null
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
        y.max_occupancy,
        y.engine_hp,
        y.engine_type,
        y.fuel_capacity,
        y.water_capacity
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      ORDER BY y.id
    `)

    const entries: YachtValidationEntry[] = result.rows.map((row: YachtRow) => {
      const specs = {
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
        maxOccupancy: row.max_occupancy,
        engineHp: row.engine_hp,
        engineType: row.engine_type,
        fuelCapacity: row.fuel_capacity,
        waterCapacity: row.water_capacity,
      }

      const validation = validateSpecs(specs)

      return {
        id: row.id,
        modelName: row.model_name,
        manufacturer: row.manufacturer_name ?? 'Unknown',
        year: row.year,
        slug: row.slug,
        issues: validation.issues,
        derivedSpecs: validation.derivedSpecs,
        issueCount: validation.issueCount,
        isValid: validation.isValid,
      }
    })

    // Yachts with issues sorted by severity
    const yachtsWithIssues = entries
      .filter((e) => e.issues.length > 0)
      .sort((a, b) => {
        // Errors first, then by issue count desc
        if (a.issueCount.error !== b.issueCount.error) return b.issueCount.error - a.issueCount.error
        return b.issues.length - a.issues.length
      })

    const summary = summarizeBulkValidation(entries)

    return NextResponse.json({
      summary,
      yachtsWithIssues,
      totalEntries: entries.length,
    })
  } catch (error) {
    console.error('Failed to run spec validation:', error)
    return NextResponse.json(
      { error: 'Failed to run spec validation' },
      { status: 500 }
    )
  }
}
