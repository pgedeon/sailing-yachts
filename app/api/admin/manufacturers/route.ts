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

  const manufacturers = [
    { id: 26, name: 'Jeanneau', country: 'France', foundedYear: 1954 },
    { id: 27, name: 'Beneteau', country: 'France', foundedYear: 1884 },
    { id: 28, name: 'Hanse', country: 'Germany', foundedYear: 1990 },
    { id: 29, name: 'Catalina', country: 'USA', foundedYear: 1969 }
  ]

  return NextResponse.json({ manufacturers })
}
