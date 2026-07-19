import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server'
import { ensureSchema, pool } from '@/lib/db'
import { validate, createSpecCategorySchema } from '@/lib/validations'

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

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureSchema()
    const result = await pool.query(`
      SELECT id, name, data_type, unit, description, category_group, is_filterable
      FROM spec_categories
      ORDER BY id
    `)
    const categories = result.rows.map(mapCategory)
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Failed to fetch spec categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spec categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureSchema()
    const body = await request.json()

    const validation = validate(createSpecCategorySchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const result = await pool.query(
      `
        INSERT INTO spec_categories (
          name, data_type, unit, description, category_group, is_filterable
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, data_type, unit, description, category_group, is_filterable
      `,
      [
        data.name,
        data.dataType,
        data.unit ?? null,
        data.description ?? null,
        data.categoryGroup ?? null,
        data.isFilterable ?? false,
      ]
    )
    const category = mapCategory(result.rows[0])
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Failed to create spec category:', error)
    return NextResponse.json(
      { error: 'Failed to create spec category' },
      { status: 500 }
    )
  }
}
