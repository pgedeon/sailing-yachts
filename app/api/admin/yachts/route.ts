import { NextResponse } from 'next/server'
import { ensureSchema, pool } from '@/lib/db'
import { mapYachtToListDto } from '@/lib/mappers/yacht'
import { revalidateTag } from 'next/cache'
import { slugify } from '@/lib/utils/slugify'
import { validate, createYachtModelSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic';

function mapYacht(row: any) {
  return {
    id: row.id,
    modelName: row.model_name,
    manufacturer: row.manufacturer_name ?? row.manufacturer ?? undefined,
    year: row.year ?? undefined,
    slug: row.slug ?? undefined,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function GET(request: Request) {

  try {
    await ensureSchema()
    const result = await pool.query(`
      SELECT
        y.id,
        y.model_name,
        y.manufacturer_id,
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
        y.water_capacity,
        y.design_notes,
        y.description,
        y.created_at,
        y.updated_at,
        m.name AS manufacturer_name
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      ORDER BY y.id
    `)
    const yachts = result.rows.map((row) => mapYachtToListDto(row))
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

  try {
    await ensureSchema()
    const body = await request.json()

    const validation = validate(createYachtModelSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Ensure slug is present: derive from modelName if missing
    let slug = data.slug?.trim()
    if (!slug) {
      slug = slugify(data.modelName)
    } else {
      slug = slugify(slug)
    }
    if (!slug) {
      return NextResponse.json(
        { error: 'Invalid slug generated' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `
        INSERT INTO yacht_models (
          model_name, manufacturer_id, year, slug,
          length_overall, beam, draft, displacement, ballast, sail_area_main,
          rig_type, keel_type, hull_material,
          cabins, berths, heads, max_occupancy,
          engine_hp, engine_type, fuel_capacity, water_capacity,
          design_notes, description
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23
        )
        RETURNING id, model_name, manufacturer_id, year, slug,
                  length_overall, beam, draft, displacement, ballast,
                  sail_area_main, rig_type, keel_type, hull_material,
                  cabins, berths, heads, max_occupancy, engine_hp,
                  engine_type, fuel_capacity, water_capacity, design_notes,
                  description, created_at, updated_at
      `,
      [
        data.modelName,
        data.manufacturerId,
        data.year,
        slug,
        data.lengthOverall ?? null,
        data.beam ?? null,
        data.draft ?? null,
        data.displacement ?? null,
        data.ballast ?? null,
        data.sailAreaMain ?? null,
        data.rigType ?? null,
        data.keelType ?? null,
        data.hullMaterial ?? null,
        data.cabins ?? null,
        data.berths ?? null,
        data.heads ?? null,
        data.maxOccupancy ?? null,
        data.engineHp ?? null,
        data.engineType ?? null,
        data.fuelCapacity ?? null,
        data.waterCapacity ?? null,
        data.designNotes ?? null,
        data.description ?? null,
      ]
    )
    const yacht = result.rows[0]
    revalidateTag('yachts');
    if (yacht.slug) {
      revalidateTag(`yacht:${yacht.slug}`);
    }
    const mappedYacht = mapYacht(yacht)
    return NextResponse.json({ yacht: mappedYacht }, { status: 201 })
  } catch (error) {
    console.error('Failed to create yacht:', error)
    return NextResponse.json(
      { error: 'Failed to create yacht' },
      { status: 500 }
    )
  }
}
