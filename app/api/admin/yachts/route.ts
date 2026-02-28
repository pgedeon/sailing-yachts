import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ensureSchema, pool } from '@/lib/db'

function mapYacht(row: any) {
  return {
    id: row.id,
    modelName: row.model_name,
    manufacturer: row.manufacturer_name ?? row.manufacturer ?? undefined,
    year: row.year ?? undefined,
    lengthOverall: row.length_overall ?? undefined,
    beam: row.beam ?? undefined,
    draft: row.draft ?? undefined,
    displacement: row.displacement ?? undefined,
    ballast: row.ballast ?? undefined,
    sailAreaMain: row.main_sail_area ?? undefined,
    rigType: row.rig_type ?? undefined,
    keelType: row.keel_type ?? undefined,
    hullMaterial: row.hull_material ?? undefined,
    cabins: row.cabins ?? undefined,
    berths: row.berths ?? undefined,
    heads: row.heads ?? undefined,
    maxOccupancy: row.max_occupancy ?? undefined,
    engineHp: row.engine_hp ?? undefined,
    engineType: row.engine_type ?? undefined,
    fuelCapacity: row.fuel_capacity ?? undefined,
    waterCapacity: row.water_capacity ?? undefined,
    designNotes: row.design_notes ?? undefined,
    description: row.description ?? undefined,
  }
}

export async function GET(request: Request) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  try {
    await ensureSchema()
    const result = await pool.query(`
      SELECT
        y.id,
        y.model_name,
        y.manufacturer_id,
        y.year,
        y.length_overall,
        y.beam,
        y.draft,
        y.displacement,
        y.ballast,
        y.main_sail_area,
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
        y.water_capacity,
        y.design_notes,
        y.description,
        m.name AS manufacturer_name
      FROM yachts y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      ORDER BY y.id
    `)
    const yachts = result.rows.map(mapYacht)
    return NextResponse.json({ yachts })
  } catch (error) {
    console.error('Failed to fetch yachts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch yachts' },
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
    await ensureSchema()
    const body = await request.json()
    const result = await pool.query(
      `
        INSERT INTO yachts (
          model_name,
          manufacturer_id,
          year,
          length_overall,
          beam,
          draft,
          displacement,
          ballast,
          main_sail_area,
          rig_type,
          keel_type,
          hull_material,
          cabins,
          berths,
          heads,
          max_occupancy,
          engine_hp,
          engine_type,
          fuel_capacity,
          water_capacity,
          design_notes,
          description
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        )
        RETURNING id, model_name, manufacturer_id, year, length_overall, beam, draft,
                  displacement, ballast, main_sail_area, rig_type, keel_type, hull_material,
                  cabins, berths, heads, max_occupancy, engine_hp, engine_type, fuel_capacity,
                  water_capacity, design_notes, description
      `,
      [
        body.modelName ?? null,
        body.manufacturerId ?? null,
        body.year ?? null,
        body.lengthOverall ?? null,
        body.beam ?? null,
        body.draft ?? null,
        body.displacement ?? null,
        body.ballast ?? null,
        body.sailAreaMain ?? null,
        body.rigType ?? null,
        body.keelType ?? null,
        body.hullMaterial ?? null,
        body.cabins ?? null,
        body.berths ?? null,
        body.heads ?? null,
        body.maxOccupancy ?? null,
        body.engineHp ?? null,
        body.engineType ?? null,
        body.fuelCapacity ?? null,
        body.waterCapacity ?? null,
        body.designNotes ?? null,
        body.description ?? null,
      ]
    )
    const yacht = mapYacht(result.rows[0])
    return NextResponse.json({ yacht }, { status: 201 })
  } catch (error) {
    console.error('Failed to create yacht:', error)
    return NextResponse.json(
      { error: 'Failed to create yacht' },
      { status: 500 }
    )
  }
}
