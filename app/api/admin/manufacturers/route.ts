import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ensureSchema, pool } from '@/lib/db'
import { validate, createManufacturerSchema, updateManufacturerSchema } from '@/lib/validations'
import { revalidateTag } from 'next/cache'

function mapManufacturer(row: any) {
  return {
    id: row.id,
    name: row.name,
    country: row.country ?? undefined,
    foundedYear: row.founded_year ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    logoUrl: row.logo_url ?? undefined,
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
      SELECT id, name, country, founded_year, website_url, logo_url, description
      FROM manufacturers
      ORDER BY id
    `)
    const manufacturers = result.rows.map(mapManufacturer)
    return NextResponse.json({ manufacturers })
  } catch (error) {
    console.error('Failed to fetch manufacturers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch manufacturers' },
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

    const validation = validate(createManufacturerSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const result = await pool.query(
      `
        INSERT INTO manufacturers (
          name, country, founded_year, website_url, logo_url, description
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, country, founded_year, website_url, logo_url, description
      `,
      [
        data.name,
        data.country ?? null,
        data.foundedYear ?? null,
        data.websiteUrl && data.websiteUrl !== "" ? data.websiteUrl : null,
        data.logoUrl && data.logoUrl !== "" ? data.logoUrl : null,
        data.description ?? null,
      ]
    )
    const manufacturer = mapManufacturer(result.rows[0])
    revalidateTag('manufacturers');
    return NextResponse.json({ manufacturer }, { status: 201 })
  } catch (error) {
    console.error('Failed to create manufacturer:', error)
    return NextResponse.json(
      { error: 'Failed to create manufacturer' },
      { status: 500 }
    )
  }
}
