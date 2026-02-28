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

  // In a real app, fetch yachts from database
  const yachts = [
    {
      id: 26,
      modelName: 'Oceanis 30.1',
      manufacturer: { name: 'Jeanneau' },
      year: 2023,
      lengthOverall: 9.11,
      beam: 3.19,
      draft: 1.83
    },
    {
      id: 27,
      modelName: 'Sun Odyssey 349',
      manufacturer: { name: 'Jeanneau' },
      year: 2022,
      lengthOverall: 10.49,
      beam: 3.83,
      draft: 1.95
    },
    {
      id: 28,
      modelName: 'Oceanis 38.1',
      manufacturer: { name: 'Jeanneau' },
      year: 2024,
      lengthOverall: 11.18,
      beam: 3.97,
      draft: 1.98
    }
  ]

  return NextResponse.json({ yachts })
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
  const newId = Math.floor(Math.random() * 1000) + 100
  const yacht = {
    id: newId,
    modelName: body.modelName,
    manufacturer: body.manufacturer || { id: 0, name: '' },
    year: body.year,
    lengthOverall: body.lengthOverall,
    beam: body.beam,
    draft: body.draft,
    displacement: body.displacement,
    ballast: body.ballast,
    mainSailArea: body.mainSailArea,
    rigType: body.rigType,
    keelType: body.keelType,
    hullMaterial: body.hullMaterial,
    cabins: body.cabins,
    berths: body.berths,
    heads: body.heads,
    maxOccupancy: body.maxOccupancy,
    engineHP: body.engineHP,
    engineType: body.engineType,
    fuelCapacity: body.fuelCapacity,
    waterCapacity: body.waterCapacity,
    designNotes: body.designNotes,
    description: body.description
  }

  return NextResponse.json({ yacht }, { status: 201 })
}
