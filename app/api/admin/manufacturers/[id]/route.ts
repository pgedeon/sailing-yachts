import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as db from '@/lib/mock-db'

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
  const manufacturer = db.getManufacturerById(Number(id))

  if (!manufacturer) {
    return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 })
  }

  return NextResponse.json({ manufacturer })
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
  const body = await request.json()

  console.log(`Updating manufacturer ${id} with:`, body)

  // In a real app, update the DB. Here we just echo back.
  return NextResponse.json({
    success: true,
    manufacturer: { id: Number(id), ...body }
  })
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
  const deleted = db.deleteManufacturer(Number(id))

  if (!deleted) {
    return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 })
  }

  // Respond with 204 No Content, then client can reload
  return new NextResponse(null, { status: 204 })
}
