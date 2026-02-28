import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  const { id } = await params

  // Find yacht by ID in mock data
  const yacht = {
    26: { id: 26, modelName: 'Oceanis 30.1', manufacturer: { id: 1, name: 'Jeanneau' }, year: 2023, lengthOverall: 9.11, beam: 3.19, draft: 1.83 },
    27: { id: 27, modelName: 'Sun Odyssey 349', manufacturer: { id: 1, name: 'Jeanneau' }, year: 2022, lengthOverall: 10.49, beam: 3.83, draft: 1.95 },
    28: { id: 28, modelName: 'Oceanis 38.1', manufacturer: { id: 1, name: 'Jeanneau' }, year: 2024, lengthOverall: 11.18, beam: 3.97, draft: 1.98 }
  }[id]

  if (!yacht) {
    return NextResponse.json({ error: 'Yacht not found' }, { status: 404 })
  }

  return NextResponse.json({ yacht })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  const { id } = await params
  const body = await request.json()

  // In a real app, update the database
  console.log(`Updating yacht ${id} with:`, body)

  return NextResponse.json({
    success: true,
    yacht: { id, ...body }
  })
}
