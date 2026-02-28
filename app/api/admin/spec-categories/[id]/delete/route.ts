import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ensureSchema, pool } from '@/lib/db'

function parseId(id: string) {
  const value = Number(id)
  return Number.isFinite(value) ? value : null
}

export async function POST(
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
    return NextResponse.redirect(new URL('/admin/spec-categories', request.url))
  } catch (error) {
    console.error('Failed to delete spec category:', error)
    return NextResponse.json(
      { error: 'Failed to delete spec category' },
      { status: 500 }
    )
  }
}
