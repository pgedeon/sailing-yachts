import { test, expect } from '@playwright/test';

test.describe('Filter Presets', () => {
  test('preset buttons are visible on yachts page', async ({ page }) => {
    await page.goto('/yachts');
    
    // All four preset buttons should be visible
    await expect(page.getByRole('button', { name: /Bluewater Cruisers/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Racing Yachts/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Budget Friendly/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Family Cruisers/ })).toBeVisible();
  });

  test('clicking a preset applies filters and highlights button', async ({ page }) => {
    await page.goto('/yachts');
    
    // Click Budget Friendly preset
    await page.getByRole('button', { name: /Budget Friendly/ }).click();
    
    // URL should contain the preset filter params
    await expect(page).toHaveURL(/filters\[lengthMax\]=9/);
    await expect(page).toHaveURL(/filters\[hullMaterial\]=GRP/);
    
    // Button should be highlighted (active state)
    const budgetBtn = page.getByRole('button', { name: /Budget Friendly/ });
    await expect(budgetBtn).toHaveClass(/bg-blue-600/);
    
    // Description text should appear
    await expect(page.getByText('Clear preset')).toBeVisible();
    
    // Should have yacht results (or empty state if no matches)
    await expect(page.locator('.grid').first()).toBeVisible();
  });

  test('clicking active preset toggles it off', async ({ page }) => {
    await page.goto('/yachts');
    
    // Click Racing Yachts preset
    await page.getByRole('button', { name: /Racing Yachts/ }).click();
    await expect(page).toHaveURL(/filters\[rigType\]=Sloop/);
    
    // Click again to toggle off
    await page.getByRole('button', { name: /Racing Yachts/ }).click();
    
    // URL should be cleared of filters
    await expect(page).toHaveURL(/\/yachts(\?page=1)?$/);
    
    // No preset should be active
    await expect(page.getByText('Clear preset')).not.toBeVisible();
  });

  test('switching presets replaces previous filters', async ({ page }) => {
    await page.goto('/yachts');
    
    // Click Bluewater
    await page.getByRole('button', { name: /Bluewater Cruisers/ }).click();
    await expect(page).toHaveURL(/filters\[lengthMin\]=10\.5/);
    
    // Switch to Family
    await page.getByRole('button', { name: /Family Cruisers/ }).click();
    
    // Should have Family params, not Bluewater
    await expect(page).toHaveURL(/filters\[cabinsMin\]=3/);
    await expect(page).not.toHaveURL(/filters\[lengthMin\]=10\.5/);
    
    // Family button should be active, Bluewater should not
    const familyBtn = page.getByRole('button', { name: /Family Cruisers/ });
    const bluewaterBtn = page.getByRole('button', { name: /Bluewater Cruisers/ });
    await expect(familyBtn).toHaveClass(/bg-blue-600/);
    await expect(bluewaterBtn).not.toHaveClass(/bg-blue-600/);
  });
});
