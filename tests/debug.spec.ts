import { test, expect } from '@playwright/test';

const BASE_URL = 'https://sailing-yachts.vercel.app';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'SailBoatAdmin!';

test('debug cookie persistence', async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/admin`);
  await page.fill('input[name="username"]', ADMIN_USER);
  await page.fill('input[name="password"]', ADMIN_PASS);
  await page.click('button:has-text("Login")');
  await page.waitForURL(`${BASE_URL}/admin`);
  
  console.log('\n=== After login, before navigation ===');
  let cookies = await page.context().cookies();
  cookies.forEach(c => console.log(`${c.name}=${c.value}`));
  
  console.log('\n=== Navigate to yachts ===');
  await page.goto(`${BASE_URL}/admin/yachts`);
  await page.waitForLoadState('networkidle');
  
  console.log('\n=== On yachts page ===');
  cookies = await page.context().cookies();
  cookies.forEach(c => console.log(`${c.name}=${c.value}`));
  
  console.log('\n=== Click edit ===');
  const firstEditLink = page.locator('a[href*="/edit"]').first();
  await Promise.all([
    page.waitForNavigation({ timeout: 10000 }),
    firstEditLink.click()
  ]);
  
  console.log('\n=== On edit page, before fetch completes ===');
  cookies = await page.context().cookies();
  cookies.forEach(c => console.log(`${c.name}=${c.value}`));
});
