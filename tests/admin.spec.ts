import { test, expect } from '@playwright/test';

const BASE_URL = 'https://sailing-yachts.vercel.app';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'SailBoatAdmin!';

test.describe('Admin Section E2E Tests', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies before each test
    await context.clearCookies();
  });

  test('should show login page when accessing admin without auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    // Should redirect to login or show error
    await expect(page).toHaveURL(/\/admin(\?error=invalid)?/);
    await expect(page.locator('text=Admin Login, or username/password field')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${BASE_URL}/admin`);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${BASE_URL}/admin`);

    // Click logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(`${BASE_URL}/admin?error=invalid`);
  });

  test('should protect admin routes without auth', async ({ page }) => {
    // Try to access admin yachts directly
    await page.goto(`${BASE_URL}/admin/yachts`);
    // Should redirect to login or show unauthorized
    await expect(page).toHaveURL(/\/admin(\?error=invalid)?/);
  });

  test('should display manufacturers listing after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.goto(`${BASE_URL}/admin/manufacturers`);
    await expect(page).toHaveURL(`${BASE_URL}/admin/manufacturers`);
    await expect(page.locator('text=Manufacturers List')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display yacht listings after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.goto(`${BASE_URL}/admin/yachts`);
    await expect(page).toHaveURL(`${BASE_URL}/admin/yachts`);
    await expect(page.locator('text=Yacht Listings')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display spec categories listing after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.goto(`${BASE_URL}/admin/spec-categories`);
    await expect(page).toHaveURL(`${BASE_URL}/admin/spec-categories`);
    await expect(page.locator('text=Specification Categories')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should open yacht edit page without error', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.goto(`${BASE_URL}/admin/yachts`);
    // Click first edit link
    await page.click('a[href^="/admin/yachts/"][href$="/edit"]:first-child');
    await expect(page).toHaveURL(/\/admin\/yachts\/\d+\/edit/);
    await expect(page.locator('text=Edit Yacht')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('should open manufacturer edit page without error', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.goto(`${BASE_URL}/admin/manufacturers`);
    await page.click('a[href^="/admin/manufacturers/"][href$="/edit"]:first-child');
    await expect(page).toHaveURL(/\/admin\/manufacturers\/\d+\/edit/);
    await expect(page.locator('text=Edit Manufacturer')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('should open spec category edit page without error', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.goto(`${BASE_URL}/admin/spec-categories`);
    await page.click('a[href^="/admin/spec-categories/"][href$="/edit"]:first-child');
    await expect(page).toHaveURL(/\/admin\/spec-categories\/\d+\/edit/);
    await expect(page.locator('text=Edit Spec Category')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('should create a new yacht via form', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.goto(`${BASE_URL}/admin/yachts/new`);
    await expect(page.locator('text=Create New Yacht')).toBeVisible();

    // Fill the form
    await page.fill('input[name="modelName"]', 'Test Yacht Model');
    await page.fill('select[name="manufacturerId"]', '1'); // Assuming first manufacturer exists
    await page.fill('input[name="year"]', '2025');
    await page.fill('input[name="slug"]', 'test-yacht-model');
    await page.fill('input[name="lengthOverall"]', '10.00');
    await page.fill('input[name="beam"]', '3.50');
    await page.click('button[type="submit"]');

    // Should redirect back to yachts list
    await expect(page).toHaveURL(`${BASE_URL}/admin/yachts`);
    await expect(page.locator('text=Yacht Listings')).toBeVisible();
  });

  test('should create a new manufacturer via form', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.goto(`${BASE_URL}/admin/manufacturers/new`);
    await expect(page.locator('text=Create New Manufacturer')).toBeVisible();

    await page.fill('input[name="name"]', 'Test Manufacturer');
    await page.fill('input[name="country"]', 'Test Country');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${BASE_URL}/admin/manufacturers`);
    await expect(page.locator('text=Manufacturers List')).toBeVisible();
  });

  test('should create a new spec category via form', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.goto(`${BASE_URL}/admin/spec-categories/new`);
    await expect(page.locator('text=Create New Spec Category')).toBeVisible();

    await page.fill('input[name="name"]', 'Test Category');
    await page.fill('input[name="dataType"]', 'numeric');
    await page.fill('input[name="unit"]', 'm');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${BASE_URL}/admin/spec-categories`);
    await expect(page.locator('text=Specification Categories')).toBeVisible();
  });

  test('should edit yacht and save changes', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.goto(`${BASE_URL}/admin/yachts`);
    await page.click('a[href^="/admin/yachts/"][href$="/edit"]:first-child');
    await expect(page).toHaveURL(/\/admin\/yachts\/\d+\/edit/);

    // Modify a field
    const yearInput = page.locator('input[name="year"]');
    await yearInput.clear();
    await yearInput.fill('2026');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${BASE_URL}/admin/yachts`);

    // Check for success message (if any) or verify the list loaded
    await expect(page.locator('table')).toBeVisible();
  });

  test('should have no console errors on admin pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to each admin page and check for errors
    const pages = ['/admin/yachts', '/admin/manufacturers', '/admin/spec-categories'];
    for (const p of pages) {
      await page.goto(`${BASE_URL}${p}`);
      await page.waitForLoadState('networkidle');
      console.log(`Checked ${p}, errors: ${errors.length}`);
    }

    expect(errors.filter(e => !e.includes('favicon')).length).toBe(0);
  });

});
