import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ensureSchema, pool } from '@/lib/db'

function parseId(id: string) {
  const value = Number(id)
  return Number.isFinite(value) ? value : null
}

function mapYachtDetail(row: any) {
  return {
    id: row.id,
    modelName: row.model_name,
    manufacturer: row.manufacturer_id
      ? { id: row.manufacturer_id, name: row.manufacturer_name ?? '' }
      : undefined,
    year: row.year ?? undefined,
    lengthOverall: row.length_overall ?? undefined,
    beam: row.beam ?? undefined,
    draft: row.draft ?? undefined,
    displacement: row.displacement ?? undefined,
    ballast: row.ballast ?? undefined,
    sailAreaMain: row.sail_area_main ?? undefined,
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

async function fetchYachtById(yachtId: number) {
  const result = await pool.query(
    `
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
        y.water_capacity,
        y.design_notes,
        y.description,
        m.name AS manufacturer_name
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      WHERE y.id = $1
    `,
    [yachtId]
  )
  return result.rows[0] ?? null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  const { id } = await params
  const yachtId = parseId(id)
  if (!yachtId) {
    return NextResponse.json({ error: 'Invalid yacht id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const row = await fetchYachtById(yachtId)
    if (!row) {
      return NextResponse.json({ error: 'Yacht not found' }, { status: 404 })
    }
    const yacht = mapYachtDetail(row)
    return NextResponse.json({ yacht })
  } catch (error) {
    console.error('Failed to fetch yacht:', error)
    return NextResponse.json(
      { error: 'Failed to fetch yacht' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  const { id } = await params
  const yachtId = parseId(id)
  if (!yachtId) {
    return NextResponse.json({ error: 'Invalid yacht id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const body = await request.json()
    const updateResult = await pool.query(
      `
        UPDATE yacht_models
        SET model_name = $1,
            manufacturer_id = $2,
            year = $3,
            length_overall = $4,
            beam = $5,
            draft = $6,
            displacement = $7,
            ballast = $8,
            sail_area_main = $9,
            rig_type = $10,
            keel_type = $11,
            hull_material = $12,
            cabins = $13,
            berths = $14,
            heads = $15,
            max_occupancy = $16,
            engine_hp = $17,
            engine_type = $18,
            fuel_capacity = $19,
            water_capacity = $20,
            design_notes = $21,
            description = $22
        WHERE id = $23
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
        yachtId,
      ]
    )
    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: 'Yacht not found' }, { status: 404 })
    }
    const row = await fetchYachtById(yachtId)
    const yacht = row ? mapYachtDetail(row) : { id: yachtId }
    return NextResponse.json({ yacht })
  } catch (error) {
    console.error('Failed to update yacht:', error)
    return NextResponse.json(
      { error: 'Failed to update yacht' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  const { id } = await params
  const yachtId = parseId(id)
  if (!yachtId) {
    return NextResponse.json({ error: 'Invalid yacht id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const result = await pool.query('DELETE FROM yacht_models WHERE id = $1', [yachtId])
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Yacht not found' }, { status: 404 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete yacht:', error)
    return NextResponse.json(
      { error: 'Failed to delete yacht' },
      { status: 500 }
    )
  }
}
