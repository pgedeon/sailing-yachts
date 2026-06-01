import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { runEnrichmentPipeline, findEnrichmentCandidates } from '@/lib/enrichment/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json().catch(() => ({}))
    const { limit = 20, dryRun = false, rateLimitMs = 3000 } = body

    // Cap limits for safety
    const safeLimit = Math.min(limit, 100)
    const safeRateLimit = Math.max(rateLimitMs, 1000)

    if (dryRun) {
      // Return candidates without actually running
      const candidates = await findEnrichmentCandidates(safeLimit)
      return NextResponse.json({
        dryRun: true,
        candidates: candidates.map((c) => ({
          id: c.id,
          manufacturer: c.manufacturer,
          model: c.modelName,
          missingFields: c.missingFields,
          missingCount: c.missingCount,
        })),
        totalCandidates: candidates.length,
      })
    }

    // Run enrichment pipeline
    const stats = await runEnrichmentPipeline({
      limit: safeLimit,
      rateLimitMs: safeRateLimit,
    })

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Enrichment run error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Enrichment run failed' },
      { status: 500 }
    )
  }
}
