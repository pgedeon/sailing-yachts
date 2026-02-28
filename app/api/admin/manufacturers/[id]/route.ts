import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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

  const manufacturer = {
    26: { id: 26, name: 'Jeanneau', country: 'France', foundedYear: 1954 },
    27: { id: 27, name: 'Beneteau', country: 'France', foundedYear: 1884 },
    28: { id: 28, name: 'Hanse', country: 'Germany', foundedYear: 1990 },
    29: { id: 29, name: 'Catalina', country: 'USA', foundedYear: 1969 }
  }[id]

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

  return NextResponse.json({
    success: true,
    manufacturer: { id, ...body }
  })
}
