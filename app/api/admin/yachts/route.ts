import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
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
