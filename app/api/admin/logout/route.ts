import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/admin', request.url))
  const cookieOptions: Cookies.CookieAttributes = {
    expires: new Date(0),
    path: '/',
    sameSite: 'lax',
  }
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.domain = 'sailing-yachts.vercel.app'
  }
  response.cookies.set('auth', '', cookieOptions)
  return response
}

// GET should not log out – just redirect to admin page
export async function GET() {
  return NextResponse.redirect(new URL('/admin', new URL('https://sailing-yachts.vercel.app')))
}
