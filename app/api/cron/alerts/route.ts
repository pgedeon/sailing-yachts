import { NextRequest, NextResponse } from 'next/server'
import { runAlertChecks } from '@/lib/alerts'

// POST /api/cron/alerts — triggered by Vercel Cron or manual invocation
// Protected by CRON_SECRET env var
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runAlertChecks()
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[cron/alerts] Fatal error:', error)
    return NextResponse.json(
      { error: 'Alert processing failed', details: error.message },
      { status: 500 },
    )
  }
}

// GET for easy testing / health check
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Alert cron endpoint is ready. Use POST to trigger alert processing.',
  })
}
