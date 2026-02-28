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
    return NextResponse.redirect(new URL('/admin/manufacturers', request.url))
  } catch (error) {
    console.error('Failed to delete manufacturer:', error)
    return NextResponse.json(
      { error: 'Failed to delete manufacturer' },
      { status: 500 }
    )
  }
}
