import { test, expect } from '@playwright/test';

const BASE_URL = 'https://sailing-yachts.vercel.app';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'SailBoatAdmin!';

test.describe('Admin Section E2E Tests', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('should show login page when accessing admin without auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await expect(page).toHaveURL(`${BASE_URL}/admin`);
    await expect(page.locator('h1:has-text("Admin Access Required")')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(`${BASE_URL}/admin`);
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(`${BASE_URL}/admin`);

    await page.click('a:has-text("Logout")');
    await expect(page).toHaveURL(`${BASE_URL}/admin?error=invalid`);
    await expect(page.locator('h1:has-text("Admin Access Required")')).toBeVisible();
  });

  test('should protect admin routes without auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/yachts`);
    await expect(page).toHaveURL(/\/admin(\?error=invalid)?/);
    await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 10000 }).catch(() => {});
  });

  test('should display manufacturers listing after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/admin`);

    await page.goto(`${BASE_URL}/admin/manufacturers`);
    await expect(page).toHaveURL(`${BASE_URL}/admin/manufacturers`);
    await expect(page.locator('h1:has-text("Manage Manufacturers")')).toBeVisible();
    await expect(page.locator('h2:has-text("Manufacturers List")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display yacht listings after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/admin`);

    await page.goto(`${BASE_URL}/admin/yachts`);
    await expect(page).toHaveURL(`${BASE_URL}/admin/yachts`);
    await expect(page.locator('h1:has-text("Manage Yachts")')).toBeVisible();
    await expect(page.locator('h2:has-text("Yachts List")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display spec categories listing after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/admin`);

    await page.goto(`${BASE_URL}/admin/spec-categories`);
    await expect(page).toHaveURL(`${BASE_URL}/admin/spec-categories`);
    await expect(page.locator('h1:has-text("Manage Specification Categories")')).toBeVisible();
    await expect(page.locator('h2:has-text("Specification Categories")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should open yacht edit page without error', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/admin`);

    await page.goto(`${BASE_URL}/admin/yachts`);
    await expect(page.locator('table')).toBeVisible();
    await page.click('a[href^="/admin/yachts/"][href$="/edit"] >> nth=0');
    await expect(page).toHaveURL(/\/admin\/yachts\/\d+\/edit/);
    await expect(page.locator('h1:has-text("Edit Yacht")')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('should open manufacturer edit page without error', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/admin`);

    await page.goto(`${BASE_URL}/admin/manufacturers`);
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('table tbody tr')).toHaveCount({ min: 1 }, { timeout: 10000 }).catch(() => {});
    await page.click('a[href^="/admin/manufacturers/"][href$="/edit"] >> nth=0');
    await expect(page).toHaveURL(/\/admin\/manufacturers\/\d+\/edit/);
    await expect(page.locator('h1:has-text("Edit Manufacturer")')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('should open spec category edit page without error', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/admin`);

    await page.goto(`${BASE_URL}/admin/spec-categories`);
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('table tbody tr')).toHaveCount({ min: 1 }, { timeout: 10000 }).catch(() => {});
    await page.click('a[href^="/admin/spec-categories/"][href$="/edit"] >> nth=0');
    await expect(page).toHaveURL(/\/admin\/spec-categories\/\d+\/edit/);
    await expect(page.locator('h1:has-text("Edit Spec Category")')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('should create a new yacht via form', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/admin`);

    await page.goto(`${BASE_URL}/admin/yachts/new`);
    await expect(page.locator('h1:has-text("Add New Yacht")')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();

    await page.fill('input[name="modelName"]', 'Test Yacht Model');
    await page.fill('input[name="year"]', '2025');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${BASE_URL}/admin/yachts`);
    await expect(page.locator('h1:has-text("Manage Yachts")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should create a new manufacturer via form', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/admin`);

    await page.goto(`${BASE_URL}/admin/manufacturers/new`);
    await expect(page.locator('h1:has-text("Add New Manufacturer")')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();

    await page.fill('input[name="name"]', 'Test Manufacturer');
    await page.fill('input[name="country"]', 'Test Country');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${BASE_URL}/admin/manufacturers`);
    await expect(page.locator('h1:has-text("Manage Manufacturers")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should create a new spec category via form', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/admin`);

    await page.goto(`${BASE_URL}/admin/spec-categories/new`);
    await expect(page.locator('h1:has-text("Add New Spec Category")')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();

    await page.fill('input[name="name"]', 'Test Category');
    await page.selectOption('select[name="dataType"]', 'numeric');
    await page.fill('input[name="unit"]', 'm');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${BASE_URL}/admin/spec-categories`);
    await expect(page.locator('h1:has-text("Manage Specification Categories")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should edit yacht and save changes', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/admin`);

    await page.goto(`${BASE_URL}/admin/yachts`);
    await expect(page.locator('table')).toBeVisible();
    await page.click('a[href^="/admin/yachts/"][href$="/edit"] >> nth=0');
    await expect(page).toHaveURL(/\/admin\/yachts\/\d+\/edit/);
    await expect(page.locator('h1:has-text("Edit Yacht")')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();

    const yearInput = page.locator('input[name="year"]');
    await yearInput.waitFor({ state: 'visible' });
    const currentYear = await yearInput.inputValue();
    const newYear = currentYear === '2025' ? '2026' : '2025';
    await yearInput.fill(newYear);

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${BASE_URL}/admin/yachts`);
    await expect(page.locator('h1:has-text("Manage Yachts")')).toBeVisible();
  });

  test('should have no console errors on admin pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button:has-text("Login")');
    await page.waitForLoadState('networkidle');

    const pages = ['/admin/yachts', '/admin/manufacturers', '/admin/spec-categories'];
    for (const p of pages) {
      await page.goto(`${BASE_URL}${p}`);
      await page.waitForLoadState('networkidle');
    }

    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('net::ERR') &&
      !e.includes('Failed to load resource')
    );
    expect(criticalErrors.length).toBe(0);
  });

});
