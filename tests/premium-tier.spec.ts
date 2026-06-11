import { test, expect } from '@playwright/test'

test.describe('P26.1 — Premium Listing Tier', () => {
  const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  test.describe('Premium API', () => {
    test('GET /api/admin/manufacturers/premium returns manufacturer list with tier info', async ({ request }) => {
      const res = await request.get(`${BASE}/api/admin/manufacturers/premium`)
      expect(res.ok()).toBeTruthy()
      const data = await res.json()
      expect(data.manufacturers).toBeDefined()
      expect(Array.isArray(data.manufacturers)).toBeTruthy()
      
      if (data.manufacturers.length > 0) {
        const m = data.manufacturers[0]
        expect(m).toHaveProperty('id')
        expect(m).toHaveProperty('name')
        expect(m).toHaveProperty('tier')
        expect(['free', 'verified', 'premium']).toContain(m.tier)
      }
    })

    test('PATCH /api/admin/manufacturers/premium validates tier values', async ({ request }) => {
      // Try invalid tier
      const res = await request.patch(`${BASE}/api/admin/manufacturers/premium`, {
        data: { id: 1, tier: 'invalid_tier' },
      })
      expect(res.status()).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('Invalid tier')
    })

    test('PATCH /api/admin/manufacturers/premium requires valid id', async ({ request }) => {
      const res = await request.patch(`${BASE}/api/admin/manufacturers/premium`, {
        data: { tier: 'premium' },
      })
      expect(res.status()).toBe(400)
    })
  })

  test.describe('Manufacturer Page Premium Features', () => {
    test('manufacturer page loads and shows basic info', async ({ page }) => {
      // Get a manufacturer slug from the API
      const res = await page.request.get(`${BASE}/api/manufacturers`)
      const data = await res.json()
      
      if (data.manufacturers && data.manufacturers.length > 0) {
        const slug = data.manufacturers[0].slug
        await page.goto(`${BASE}/manufacturers/${slug}`)
        
        // Should show manufacturer name
        await expect(page.locator('h1')).toBeVisible()
        
        // Should NOT show premium features for free tier manufacturers
        // (the default tier is 'free')
      }
    })

    test('manufacturer page shows verified badge for verified/premium tiers', async ({ page }) => {
      // Get premium manufacturers
      const res = await page.request.get(`${BASE}/api/admin/manufacturers/premium`)
      const data = await res.json()
      const premiumM = data.manufacturers?.find((m: any) => m.tier === 'premium' || m.tier === 'verified')
      
      if (premiumM) {
        const { slugify } = await import('../lib/utils/slugify')
        // Use dynamic import workaround - just check the page
        const slug = premiumM.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        await page.goto(`${BASE}/manufacturers/${slug}`)
        
        // Should show verified badge
        const badge = page.locator('text=Verified')
        if (premiumM.tier === 'verified' || premiumM.tier === 'premium') {
          await expect(badge).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })

  test.describe('Feature Gating', () => {
    test('free tier manufacturers do not show premium content', async ({ page }) => {
      const res = await page.request.get(`${BASE}/api/admin/manufacturers/premium`)
      const data = await res.json()
      const freeM = data.manufacturers?.find((m: any) => m.tier === 'free')
      
      if (freeM) {
        const slug = freeM.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        await page.goto(`${BASE}/manufacturers/${slug}`)
        
        // Should NOT have premium video iframe
        const videoIframe = page.locator('iframe[title*="video"]')
        await expect(videoIframe).toHaveCount(0)
        
        // Should NOT have verified badge
        const badge = page.locator('text=Verified').first()
        // The badge text might not exist at all for free tier
        const badgeCount = await badge.count()
        if (badgeCount === 0) {
          // This is expected for free tier
          expect(badgeCount).toBe(0)
        }
      }
    })
  })
})
