import { NextResponse } from 'next/server'

// Simple token generation (in production, use a proper JWT or random secret)
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  const AUTH_USER = "admin"
  const AUTH_PASS = "SailBoatAdmin!"

  if (username === AUTH_USER && password === AUTH_PASS) {
    const token = generateToken()

    // Set the auth cookie with the token, readable by JS
    const response = NextResponse.redirect(new URL('/admin', request.url))
    response.cookies.set('auth', token, {
      httpOnly: false, // Accessible to client-side JavaScript
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600, // 1 hour
      path: '/',
      sameSite: 'lax', // Better browser compatibility
    })
    return response
  }

  // On failure, clear cookie and redirect
  const response = NextResponse.redirect(new URL('/admin?error=invalid', request.url))
  response.cookies.set('auth', '', {
    expires: new Date(0),
    path: '/',
    sameSite: 'none',
  })
  return response
}
