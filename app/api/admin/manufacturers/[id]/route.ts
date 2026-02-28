import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ensureSchema, pool } from '@/lib/db'

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
    const result = await pool.query(
      `
        UPDATE manufacturers
        SET name = $1,
            country = $2,
            founded_year = $3,
            website_url = $4,
            logo_url = $5,
            description = $6
        WHERE id = $7
        RETURNING id, name, country, founded_year, website_url, logo_url, description
      `,
      [
        body.name ?? null,
        body.country ?? null,
        body.foundedYear ?? null,
        body.websiteUrl ?? null,
        body.logoUrl ?? null,
        body.description ?? null,
        manufacturerId,
      ]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 })
    }
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
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete manufacturer:', error)
    return NextResponse.json(
      { error: 'Failed to delete manufacturer' },
      { status: 500 }
    )
  }
}
