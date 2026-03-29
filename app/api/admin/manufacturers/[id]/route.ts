import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ensureSchema, pool } from '@/lib/db'
import { validate, updateManufacturerSchema } from '@/lib/validations'
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

function parseId(id: string) {
  const value = Number(id)
  return Number.isFinite(value) ? value : null
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
  const manufacturerId = parseId(id)
  if (!manufacturerId) {
    return NextResponse.json({ error: 'Invalid manufacturer id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const result = await pool.query(
      `
        SELECT id, name, country, founded_year, website_url, logo_url, description
        FROM manufacturers
        WHERE id = $1
      `,
      [manufacturerId]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 })
    }
    const manufacturer = mapManufacturer(result.rows[0])
    return NextResponse.json({ manufacturer })
  } catch (error) {
    console.error('Failed to fetch manufacturer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch manufacturer' },
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
  const manufacturerId = parseId(id)
  if (!manufacturerId) {
    return NextResponse.json({ error: 'Invalid manufacturer id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const body = await request.json()

    const validation = validate(updateManufacturerSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const result = await pool.query(
      `
        UPDATE manufacturers
        SET name = COALESCE($1, name),
            country = COALESCE($2, country),
            founded_year = COALESCE($3, founded_year),
            website_url = COALESCE($4, website_url),
            logo_url = COALESCE($5, logo_url),
            description = COALESCE($6, description)
        WHERE id = $7
        RETURNING id, name, country, founded_year, website_url, logo_url, description
      `,
      [
        data.name ?? null,
        data.country ?? null,
        data.foundedYear ?? null,
        data.websiteUrl ?? null,
        data.logoUrl ?? null,
        data.description ?? null,
        manufacturerId,
      ]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 })
    }
    revalidateTag('manufacturers');
    const manufacturer = mapManufacturer(result.rows[0])
    return NextResponse.json({ manufacturer })
  } catch (error) {
    console.error('Failed to update manufacturer:', error)
    return NextResponse.json(
      { error: 'Failed to update manufacturer' },
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
  const manufacturerId = parseId(id)
  if (!manufacturerId) {
    return NextResponse.json({ error: 'Invalid manufacturer id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const result = await pool.query(
      'DELETE FROM manufacturers WHERE id = $1',
      [manufacturerId]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 })
    }
    revalidateTag('manufacturers');
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete manufacturer:', error)
    return NextResponse.json(
      { error: 'Failed to delete manufacturer' },
      { status: 500 }
    )
  }
}
