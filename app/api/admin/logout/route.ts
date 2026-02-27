import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/admin', request.url), 302)
  response.cookies.set('auth', '', {
    expires: new Date(0),
    path: '/',
    sameSite: 'lax',
  })
  return response
}

export async function GET() {
  return NextResponse.redirect(new URL('/admin', new URL('https://sailing-yachts.vercel.app')), 302)
}
