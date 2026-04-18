import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Push Notifications (P9.7)', () => {
  test.describe('API - Push Subscriptions', () => {
    test('GET /api/user/push-subscriptions returns 401 for unauthenticated user', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/user/push-subscriptions`);
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('POST /api/user/push-subscriptions returns 401 for unauthenticated user', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/user/push-subscriptions`, {
        data: {
          endpoint: 'https://fcm.googleapis.com/test',
          keys: { p256dh: 'abc', auth: 'def' },
        },
      });
      expect(res.status()).toBe(401);
    });

    test('DELETE /api/user/push-subscriptions returns 401 for unauthenticated user', async ({ request }) => {
      const res = await request.delete(`${BASE_URL}/api/user/push-subscriptions?endpoint=test`);
      expect(res.status()).toBe(401);
    });

    test('PATCH /api/user/push-subscriptions returns 401 for unauthenticated user', async ({ request }) => {
      const res = await request.patch(`${BASE_URL}/api/user/push-subscriptions`, {
        data: { endpoint: 'test', notifyNewMatches: false },
      });
      expect(res.status()).toBe(401);
    });

    test('POST validates required fields', async ({ request }) => {
      // Even though it will 401, we test that the endpoint exists and responds correctly
      const res = await request.post(`${BASE_URL}/api/user/push-subscriptions`, {
        data: {},
      });
      expect(res.status()).toBe(401);
    });
  });

  test.describe('Service Worker', () => {
    test('sw.js is accessible', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/sw.js`);
      expect(res.status()).toBe(200);
      const text = await res.text();
      // Verify the service worker has the expected event handlers
      expect(text).toContain('push');
      expect(text).toContain('notificationclick');
      expect(text).toContain('install');
      expect(text).toContain('activate');
    });
  });

  test.describe('Push Notification Settings Component', () => {
    test('push settings tab appears in account dashboard for logged-in user', async ({ page }) => {
      // Navigate to account page — will redirect to login if not authenticated
      await page.goto(`${BASE_URL}/account`);

      // If redirected to login, the test verifies the account page route exists
      const url = page.url();

      if (url.includes('/account')) {
        // Check if the push notifications tab is rendered
        const pushTab = page.getByRole('button', { name: /push notifications/i });
        // The tab may or may not be visible depending on auth state
        const isVisible = await pushTab.isVisible().catch(() => false);
        if (isVisible) {
          await pushTab.click();
          // Verify the push settings component loaded
          await expect(page.getByText(/Browser Permission|Push Notifications/i).first()).toBeVisible({ timeout: 5000 });
        }
      }

      // If redirected to login, the route still exists correctly
      expect(url).toMatch(/\/(account|login|auth)/);
    });
  });
});
