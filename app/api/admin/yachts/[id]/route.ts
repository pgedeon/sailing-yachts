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
  const yacht = db.getYachtById(Number(id))

  if (!yacht) {
    return NextResponse.json({ error: 'Yacht not found' }, { status: 404 })
  }

  return NextResponse.json({ yacht })
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

  console.log(`Updating yacht ${id} with:`, body)

  // In a real app, update the database
  return NextResponse.json({
    success: true,
    yacht: { id: Number(id), ...body }
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
  const deleted = db.deleteYacht(Number(id))

  if (!deleted) {
    return NextResponse.json({ error: 'Yacht not found' }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
