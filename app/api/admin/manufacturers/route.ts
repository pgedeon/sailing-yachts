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

  const manufacturers = [
    { id: 26, name: 'Jeanneau', country: 'France', foundedYear: 1954 },
    { id: 27, name: 'Beneteau', country: 'France', foundedYear: 1884 },
    { id: 28, name: 'Hanse', country: 'Germany', foundedYear: 1990 },
    { id: 29, name: 'Catalina', country: 'USA', foundedYear: 1969 }
  ]

  return NextResponse.json({ manufacturers })
}
