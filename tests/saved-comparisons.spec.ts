import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://sailing-yachts.vercel.app';

test.describe('Saved Comparisons', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should show Share and Save buttons when 2+ yachts selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2`);
    await page.waitForLoadState('networkidle');
    const shareBtn = page.locator('button:has-text("Share")');
    const saveBtn = page.locator('button:has-text("Save")');
    const savedBtn = page.locator('button:has-text("Saved")');
    await expect(shareBtn).toBeVisible();
    await expect(saveBtn).toBeVisible();
    await expect(savedBtn).toBeVisible();
  });

  test('should not show Share/Save buttons with no yachts', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare`);
    await page.waitForLoadState('networkidle');
    const shareBtn = page.locator('button:has-text("Share")');
    const saveBtn = page.locator('button:has-text("Save")');
    await expect(shareBtn).toHaveCount(0);
    await expect(saveBtn).toHaveCount(0);
  });

  test('should open save name input on Save click', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2`);
    await page.waitForLoadState('networkidle');
    const saveBtn = page.locator('button:has-text("Save")');
    await saveBtn.click();
    const nameInput = page.locator('input[placeholder*="Name this comparison"], input[placeholder*="Family cruisers"]');
    await expect(nameInput).toBeVisible();
    const saveSubmit = page.locator('button:has-text("Save")').last();
    await expect(saveSubmit).toBeVisible();
  });

  test('should open saved comparisons panel on Saved click', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2`);
    await page.waitForLoadState('networkidle');
    const savedBtn = page.locator('button:has-text("Saved")');
    await savedBtn.click();
    // Panel header should appear
    const panelHeader = page.locator('h3:has-text("Saved Comparisons")');
    await expect(panelHeader).toBeVisible();
  });

  test('should show empty state in saved panel when nothing saved', async ({ page }) => {
    // Use a fresh context to ensure no localStorage
    await page.goto(`${BASE_URL}/compare?ids=1,2`);
    await page.waitForLoadState('networkidle');
    // Clear localStorage to ensure clean state
    await page.evaluate(() => localStorage.removeItem('sailing-yachts-saved-comparisons'));
    const savedBtn = page.locator('button:has-text("Saved")');
    await savedBtn.click();
    const emptyMsg = page.locator('text=No saved comparisons yet');
    await expect(emptyMsg).toBeVisible();
  });

  test('should copy share link and show Copied! feedback', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2`);
    await page.waitForLoadState('networkidle');
    const shareBtn = page.locator('button:has-text("Share")');
    await shareBtn.click();
    // Should briefly show "Copied!" text
    const copied = page.locator('text=Copied!');
    await expect(copied).toBeVisible({ timeout: 3000 });
  });

  test('should save a comparison to localStorage', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2`);
    await page.waitForLoadState('networkidle');
    // Click Save
    await page.locator('button:has-text("Save")').click();
    // Type name
    const nameInput = page.locator('input[placeholder*="Family cruisers"]');
    await nameInput.fill('Test comparison E2E');
    // Submit
    await page.locator('button:has-text("Save")').last().click();
    // Open saved panel
    await page.locator('button:has-text("Saved")').click();
    // Should show the saved comparison
    const savedItem = page.locator('text=Test comparison E2E');
    await expect(savedItem).toBeVisible();
    // Verify in localStorage
    const stored = await page.evaluate(() => localStorage.getItem('sailing-yachts-saved-comparisons'));
    expect(stored).toContain('Test comparison E2E');
    // Clean up
    await page.evaluate(() => localStorage.removeItem('sailing-yachts-saved-comparisons'));
  });

  test('should delete a saved comparison', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2`);
    await page.waitForLoadState('networkidle');
    // Save one first
    await page.locator('button:has-text("Save")').click();
    await page.locator('input[placeholder*="Family cruisers"]').fill('To be deleted');
    await page.locator('button:has-text("Save")').last().click();
    // Open panel
    await page.locator('button:has-text("Saved")').click();
    await expect(page.locator('text=To be deleted')).toBeVisible();
    // Click delete (trash icon in the list item)
    const listItem = page.locator('li').filter({ hasText: 'To be deleted' });
    await listItem.locator('button[title="Delete"]').click();
    // Should be gone
    await expect(page.locator('text=To be deleted')).toHaveCount(0);
    // Clean up
    await page.evaluate(() => localStorage.removeItem('sailing-yachts-saved-comparisons'));
  });

  test('should load a saved comparison when clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2`);
    await page.waitForLoadState('networkidle');
    // Save a comparison with IDs 1,2
    await page.locator('button:has-text("Save")').click();
    await page.locator('input[placeholder*="Family cruisers"]').fill('Load test');
    await page.locator('button:has-text("Save")').last().click();
    // Navigate away (clear selection)
    await page.goto(`${BASE_URL}/compare`);
    await page.waitForLoadState('networkidle');
    // Open saved panel
    await page.locator('button:has-text("Saved")').click();
    // Click the saved item to load it
    await page.locator('text=Load test').click();
    // URL should now have ids=1,2
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('ids=1%2C2');
    // Clean up
    await page.evaluate(() => localStorage.removeItem('sailing-yachts-saved-comparisons'));
  });

  test('saved button badge shows count', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare?ids=1,2`);
    await page.waitForLoadState('networkidle');
    // Save two comparisons
    await page.locator('button:has-text("Save")').click();
    await page.locator('input[placeholder*="Family cruisers"]').fill('First save');
    await page.locator('button:has-text("Save")').last().click();
    // Small delay
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Save")').click();
    await page.locator('input[placeholder*="Family cruisers"]').fill('Second save');
    await page.locator('button:has-text("Save")').last().click();
    // Badge should show 2
    const badge = page.locator('button:has-text("Saved") span.rounded-full');
    await expect(badge).toHaveText('2');
    // Clean up
    await page.evaluate(() => localStorage.removeItem('sailing-yachts-saved-comparisons'));
  });
});
