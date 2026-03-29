import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ensureSchema, pool } from '@/lib/db'
import { validate, updateSpecCategorySchema } from '@/lib/validations'

function mapCategory(row: any) {
  return {
    id: row.id,
    name: row.name,
    dataType: row.data_type ?? undefined,
    unit: row.unit ?? undefined,
    description: row.description ?? undefined,
    categoryGroup: row.category_group ?? undefined,
    isFilterable: row.is_filterable ?? false,
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
  const categoryId = parseId(id)
  if (!categoryId) {
    return NextResponse.json({ error: 'Invalid category id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const result = await pool.query(
      `
        SELECT id, name, data_type, unit, description, category_group, is_filterable
        FROM spec_categories
        WHERE id = $1
      `,
      [categoryId]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    const category = mapCategory(result.rows[0])
    return NextResponse.json({ category })
  } catch (error) {
    console.error('Failed to fetch spec category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spec category' },
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
  const categoryId = parseId(id)
  if (!categoryId) {
    return NextResponse.json({ error: 'Invalid category id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const body = await request.json()

    const validation = validate(updateSpecCategorySchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const result = await pool.query(
      `
        UPDATE spec_categories
        SET name = COALESCE($1, name),
            data_type = COALESCE($2, data_type),
            unit = COALESCE($3, unit),
            description = COALESCE($4, description),
            category_group = COALESCE($5, category_group),
            is_filterable = COALESCE($6, is_filterable)
        WHERE id = $7
        RETURNING id, name, data_type, unit, description, category_group, is_filterable
      `,
      [
        data.name ?? null,
        data.dataType ?? null,
        data.unit ?? null,
        data.description ?? null,
        data.categoryGroup ?? null,
        data.isFilterable ?? null,
        categoryId,
      ]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    const category = mapCategory(result.rows[0])
    return NextResponse.json({ category })
  } catch (error) {
    console.error('Failed to update spec category:', error)
    return NextResponse.json(
      { error: 'Failed to update spec category' },
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
  const categoryId = parseId(id)
  if (!categoryId) {
    return NextResponse.json({ error: 'Invalid category id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const result = await pool.query('DELETE FROM spec_categories WHERE id = $1', [categoryId])
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete spec category:', error)
    return NextResponse.json(
      { error: 'Failed to delete spec category' },
      { status: 500 }
    )
  }
}
