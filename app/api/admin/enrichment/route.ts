import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getEnrichmentStatus } from '@/lib/enrichment/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    const status = await getEnrichmentStatus()
    return NextResponse.json(status)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Enrichment status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrichment status' },
      { status: 500 }
    )
  }
}
