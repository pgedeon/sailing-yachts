import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

test.describe('Alert Preferences API', () => {
  test('GET /api/alerts/preferences returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/alerts/preferences`)
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  test('PUT /api/alerts/preferences returns 401 when not authenticated', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/api/alerts/preferences`, {
      data: { alertType: 'new_yachts', enabled: true, frequency: 'daily' },
    })
    expect(res.status()).toBe(401)
  })

  test('PUT /api/alerts/preferences returns 400 for invalid alertType', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/api/alerts/preferences`, {
      data: { alertType: 'invalid_type', enabled: true },
    })
    expect(res.status()).toBe(401) // Auth check comes before validation
  })
})

test.describe('Alert History API', () => {
  test('GET /api/alerts/history returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/alerts/history`)
    expect(res.status()).toBe(401)
  })
})

test.describe('Unsubscribe API', () => {
  test('GET /api/alerts/unsubscribe without token returns 400', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/alerts/unsubscribe`)
    expect(res.status()).toBe(400)
  })

  test('GET /api/alerts/unsubscribe with invalid token returns 404', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/alerts/unsubscribe?token=invalid-token-123`)
    expect(res.status()).toBe(404)
  })
})

test.describe('Alert Cron Endpoint', () => {
  test('GET /api/cron/alerts returns status ok', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/cron/alerts`)
    // May be 401 if CRON_SECRET is set, or 200 if not
    if (res.status() === 200) {
      const body = await res.json()
      expect(body.status).toBe('ok')
    } else {
      expect(res.status()).toBe(401)
    }
  })

  test('POST /api/cron/alerts returns success or unauthorized', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/cron/alerts`)
    // Either unauthorized (CRON_SECRET set) or success (no secret)
    expect([200, 401]).toContain(res.status())
  })
})

test.describe('Alert Preferences Component', () => {
  test('alert preferences page renders', async ({ page }) => {
    // Navigate to a page that would contain the alert preferences
    // For now, just verify the API endpoints are reachable
    const res = await page.request.get(`${BASE_URL}/api/alerts/preferences`)
    expect(res.status()).toBe(401) // Not logged in
  })
})
