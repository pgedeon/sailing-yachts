import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEnrichmentStatus } from '@/lib/enrichment/service'

export const dynamic = 'force-dynamic'

async function requireAdminApi() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return null
  }
  return session
}

export async function GET() {
  try {
    const session = await requireAdminApi()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const status = await getEnrichmentStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Enrichment status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrichment status', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
