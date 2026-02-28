import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as db from '@/lib/mock-db'

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
  const deleted = db.deleteManufacturer(Number(id))

  if (!deleted) {
    return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 })
  }

  // Redirect back to the manufacturers list
  return NextResponse.redirect(new URL('/admin/manufacturers', request.url))
}
