import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as db from '@/lib/mock-db'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value

  if (!authCookie) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    )
  }

  const categories = db.getSpecCategories()
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
  const category = db.createSpecCategory(body)
  return NextResponse.json({ category }, { status: 201 })
}
