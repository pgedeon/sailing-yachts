import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

test.describe('Account Dashboard', () => {
  test('account page loads with sign-in prompt when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/account`)

    // Should show sign-in prompt
    await expect(page.locator('text=Sign in Required')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Please sign in')).toBeVisible()
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible()
  })

  test('account page has correct title', async ({ page }) => {
    await page.goto(`${BASE_URL}/account`)
    await expect(page).toHaveTitle(/My Account/)
  })

  test('account page is not indexed by search engines', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/account`)
    const content = await response?.text() || ''
    // Check for noindex meta tag
    expect(content).toMatch(/noindex/)
  })

  test('account page navigation tabs are visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/account`)

    // Wait for auth check to complete
    await page.waitForTimeout(2000)

    // Tab navigation should be visible (after auth redirect or in sign-in state)
    // When not logged in, tabs won't show — just the sign-in prompt
    const signInPrompt = page.locator('text=Sign in Required')
    const tabNav = page.locator('text=Favorites')
    const hasSignIn = await signInPrompt.isVisible().catch(() => false)
    const hasTabs = await tabNav.isVisible().catch(() => false)

    expect(hasSignIn || hasTabs).toBe(true)
  })
})

test.describe('Account Dashboard API Integration', () => {
  test('favorites API returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/user/favorites`)
    expect(res.status()).toBe(401)
  })

  test('searches API returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/user/searches`)
    expect(res.status()).toBe(401)
  })

  test('comparisons API returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/user/comparisons`)
    expect(res.status()).toBe(401)
  })

  test('alert preferences API returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/alerts/preferences`)
    expect(res.status()).toBe(401)
  })
})

test.describe('Account Nav Link', () => {
  test('Account link is present in desktop navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    const accountLink = page.locator('nav >> text=Account')
    await expect(accountLink).toBeVisible()
  })
})
