import { NextResponse } from 'next/server'

// Legacy login route — now handled by next-auth credentials provider
// Redirect to admin page which shows the next-auth powered login form
export async function POST(request: Request) {
  // Redirect to admin page — the AdminLoginForm uses next-auth signIn()
  return NextResponse.redirect(new URL('/admin', request.url))
}

export async function GET() {
  return NextResponse.redirect(new URL('/admin', new URL('https://info.sailboats.fr')), 302)
}
