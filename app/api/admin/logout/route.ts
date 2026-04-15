import { NextResponse } from 'next/server'

// Legacy logout route — redirects to next-auth signout
export async function POST() {
  return NextResponse.redirect(new URL('/api/auth/signout?callbackUrl=/admin', new URL('https://info.sailboats.fr')), 302)
}

export async function GET() {
  return NextResponse.redirect(new URL('/api/auth/signout?callbackUrl=/admin', new URL('https://info.sailboats.fr')), 302)
}
