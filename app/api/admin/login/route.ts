import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  
  const AUTH_USER = "admin"
  const AUTH_PASS = "SailBoatAdmin!"
  
  if (username === AUTH_USER && password === AUTH_PASS) {
    // Set auth cookie and redirect to admin dashboard
    const response = NextResponse.redirect(new URL('/admin', request.url))
    response.cookies.set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600, // 1 hour
      path: '/'
    })
    return response
  }
  
  // On failure, redirect back to admin page with error
  const response = NextResponse.redirect(new URL('/admin?error=invalid', request.url))
  response.cookies.set('auth', '', { 
    expires: new Date(0),
    path: '/admin'
  })
  return response
}
