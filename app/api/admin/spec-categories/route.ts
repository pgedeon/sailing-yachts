import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  const categories = [
    { id: 59, name: 'Length Overall', dataType: 'numeric', unit: 'm', description: 'Total length of the yacht' },
    { id: 60, name: 'Beam', dataType: 'numeric', unit: 'm', description: 'Width of the yacht at its widest point' },
    { id: 61, name: 'Draft', dataType: 'numeric', unit: 'm', description: 'Depth of hull below waterline' },
    { id: 62, name: 'Displacement', dataType: 'numeric', unit: 'kg', description: 'Weight of the yacht in water' },
    { id: 63, name: 'Sail Area - Main', dataType: 'numeric', unit: 'm²', description: 'Area of the main sail' }
  ]

  return NextResponse.json({ categories })
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  const body = await request.json()

  // Mock creation
  const newId = Math.floor(Math.random() * 1000) + 200
  const category = {
    id: newId,
    name: body.name,
    dataType: body.dataType,
    unit: body.unit,
    description: body.description,
    group: body.group,
    filterable: body.filterable ?? false
  }

  return NextResponse.json({ category }, { status: 201 })
}
