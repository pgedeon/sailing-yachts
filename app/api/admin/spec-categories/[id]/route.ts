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

  const category = {
    59: { id: 59, name: 'Length Overall', dataType: 'numeric', unit: 'm', description: 'Total length of the yacht' },
    60: { id: 60, name: 'Beam', dataType: 'numeric', unit: 'm', description: 'Width of the yacht at its widest point' },
    61: { id: 61, name: 'Draft', dataType: 'numeric', unit: 'm', description: 'Depth of hull below waterline' },
    62: { id: 62, name: 'Displacement', dataType: 'numeric', unit: 'kg', description: 'Weight of the yacht in water' },
    63: { id: 63, name: 'Sail Area - Main', dataType: 'numeric', unit: 'm²', description: 'Area of the main sail' }
  }[id]

  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  return NextResponse.json({ category })
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

  console.log(`Updating category ${id} with:`, body)

  return NextResponse.json({
    success: true,
    category: { id, ...body }
  })
}
