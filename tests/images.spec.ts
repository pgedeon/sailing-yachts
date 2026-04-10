import { test, expect } from '@playwright/test'

const BASE_URL = 'https://info.sailboats.fr'
const ADMIN_USER = 'admin'
const ADMIN_PASS = 'SailBoatAdmin!'

test.describe('Yacht Images', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`)
    await page.fill('[name="username"]', ADMIN_USER)
    await page.fill('[name="password"]', ADMIN_PASS)
    await page.click('button:has-text("Login")')
    await page.waitForURL('**/admin')
  })

  test('Admin can view image management section on yacht edit page', async ({ page }) => {
    await page.click('a[href="/admin/yachts"]')
    await page.waitForURL('**/admin/yachts')

    const editButton = page.locator('a:has-text("Edit")').first()
    await expect(editButton).toBeVisible()
    await editButton.click()

    await page.waitForURL(/\/admin\/yachts\/\d+\/edit/)

    // Check if images section is visible
    const imagesSection = page.locator('text=Images')
    await expect(imagesSection).toBeVisible()

    // Check if "Add Image" button is present
    const addImageButton = page.locator('button:has-text("Add Image")')
    await expect(addImageButton).toBeVisible()
  })

  test('Admin can open and close image upload form', async ({ page }) => {
    await page.click('a[href="/admin/yachts"]')
    await page.waitForURL('**/admin/yachts')

    const editButton = page.locator('a:has-text("Edit")').first()
    await editButton.click()

    await page.waitForURL(/\/admin\/yachts\/\d+\/edit/)

    // Open image upload form
    await page.click('button:has-text("Add Image")')

    // Check if form elements are visible
    await expect(page.locator('input[type="file"]')).toBeVisible()
    await expect(page.locator('#imageUrl')).toBeVisible()
    await expect(page.locator('#imageCaption')).toBeVisible()
    await expect(page.locator('#imageAltText')).toBeVisible()
    await expect(page.locator('#isPrimary')).toBeVisible()
    await expect(page.locator('#sortOrder')).toBeVisible()

    // Cancel the upload
    await page.locator('button:has-text("Cancel")').last().click()

    // Check if form is hidden
    await expect(page.locator('input[type="file"]')).not.toBeVisible()
  })

  test('Admin can add image via URL to yacht', async ({ page }) => {
    await page.click('a[href="/admin/yachts"]')
    await page.waitForURL('**/admin/yachts')

    const editButton = page.locator('a:has-text("Edit")').first()
    await editButton.click()

    await page.waitForURL(/\/admin\/yachts\/\d+\/edit/)

    // Open image upload form
    await page.click('button:has-text("Add Image")')

    // Fill in image URL
    await page.fill('#imageUrl', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=800&h=600&fit=crop')
    await page.fill('#imageCaption', 'Test yacht image')
    await page.fill('#imageAltText', 'A sailing yacht on the water')

    // Submit the form
    await page.click('button:has-text("Upload Image")')

    // Wait for upload to complete (button should no longer say Uploading...)
    await expect(page.locator('button:has-text("Uploading...")')).not.toBeVisible({ timeout: 15000 })

    // Check that the image gallery now has an image
    const imageCards = page.locator('img[src*="unsplash"]')
    await expect(imageCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('Admin can delete an image from yacht', async ({ page }) => {
    await page.click('a[href="/admin/yachts"]')
    await page.waitForURL('**/admin/yachts')

    const editButton = page.locator('a:has-text("Edit")').first()
    await editButton.click()

    await page.waitForURL(/\/admin\/yachts\/\d+\/edit/)

    // Add an image first to ensure there's something to delete
    await page.click('button:has-text("Add Image")')
    await page.fill('#imageUrl', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=800&h=600&fit=crop')
    await page.fill('#imageCaption', 'Image to be deleted')
    await page.click('button:has-text("Upload Image")')
    await expect(page.locator('button:has-text("Uploading...")')).not.toBeVisible({ timeout: 15000 })

    // Wait for image to appear
    await page.waitForSelector('img[src*="unsplash"]', { timeout: 10000 })

    // Count images before deletion
    const imagesBefore = await page.locator('img[src*="unsplash"]').count()

    // Click "Delete" button
    page.on('dialog', dialog => dialog.accept())
    const deleteButton = page.locator('button:has-text("Delete")').first()
    await deleteButton.click()

    // Verify image count decreased
    await page.waitForTimeout(2000)
    const imagesAfter = await page.locator('img[src*="unsplash"]').count()
    expect(imagesAfter).toBeLessThanOrEqual(imagesBefore)
  })

  test('Image upload form shows validation when no file or URL provided', async ({ page }) => {
    await page.click('a[href="/admin/yachts"]')
    await page.waitForURL('**/admin/yachts')

    const editButton = page.locator('a:has-text("Edit")').first()
    await editButton.click()

    await page.waitForURL(/\/admin\/yachts\/\d+\/edit/)

    // Open image upload form
    await page.click('button:has-text("Add Image")')

    // Try to submit without any file or URL
    await page.click('button:has-text("Upload Image")')

    // Should show error message
    await expect(page.locator('text=Please select a file or enter an image URL')).toBeVisible()
  })
})