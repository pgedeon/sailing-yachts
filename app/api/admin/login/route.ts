import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  
  const AUTH_USER = "admin"
  const AUTH_PASS = "SailBoatAdmin!"
  
  if (username === AUTH_USER && password === AUTH_PASS) {
    // Set auth cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600, // 1 hour
      path: '/admin'
    })
    return response
  }
  
  return NextResponse.json({ success: false }, { status: 401 })
}
