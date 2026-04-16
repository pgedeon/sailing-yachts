import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, alertLog, alertPreferences } from '@/lib/db'

// GET /api/alerts/unsubscribe?token=xxx — one-click unsubscribe
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return new Response('Missing unsubscribe token', { status: 400 })
  }

  try {
    // Find the alert log entry by token
    const logs = await db
      .select()
      .from(alertLog)
      .where(eq(alertLog.unsubscribeToken, token))
      .limit(1)

    if (logs.length === 0) {
      return new Response('Invalid or expired unsubscribe token.', { status: 404 })
    }

    const log = logs[0]

    // Disable the alert type for this user
    const existing = await db
      .select()
      .from(alertPreferences)
      .where(eq(alertPreferences.userId, log.userId))
      .limit(10)

    const matchingPref = existing.find((p: any) => p.alertType === log.alertType)

    if (matchingPref) {
      await db
        .update(alertPreferences)
        .set({ enabled: false, updatedAt: new Date() })
        .where(eq(alertPreferences.id, matchingPref.id))
    } else {
      // Create a disabled preference
      await db.insert(alertPreferences).values({
        userId: log.userId,
        alertType: log.alertType,
        enabled: false,
        frequency: 'daily',
      })
    }

    // Return a friendly HTML page
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 500px; margin: 40px auto; padding: 20px; text-align: center;">
  <h1 style="color: #16a34a;">✓ Unsubscribed</h1>
  <p>You've been unsubscribed from <strong>${escapeHtml(log.alertType.replace(/_/g, ' '))}</strong> alerts.</p>
  <p style="color: #6b7280; font-size: 14px;">
    You can re-enable alerts in your account settings at 
    <a href="https://info.sailboats.fr">${escapeHtml(request.nextUrl.hostname)}</a>.
  </p>
</body>
</html>`

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('[unsubscribe] Error:', error)
    return new Response('An error occurred. Please try again.', { status: 500 })
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
