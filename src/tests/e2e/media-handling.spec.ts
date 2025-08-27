import { test, expect } from '@playwright/test';

test.describe('Media Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'admin-user',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        }),
      });
    });

    // Mock initial data
    await page.route('**/api/admin/authors', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'author-1', name: 'Test Author' }]),
      });
    });

    await page.route('**/api/admin/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'cat-1', name: 'Technology' }]),
      });
    });

    await page.route('**/api/admin/tags', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'tag-1', name: 'React' }]),
      });
    });
  });

  test('should upload image and display in article form', async ({ page }) => {
    let uploadedImageUrl = '';

    // Mock image upload API
    await page.route('**/api/upload-image', async (route) => {
      uploadedImageUrl =
        'https://res.cloudinary.com/demo/image/upload/v1234567890/test-image.jpg';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: uploadedImageUrl }),
      });
    });

    await page.goto('/admin/articles/new');

    // Upload an image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    // Wait for upload to complete
    await page.waitForTimeout(2000);

    // Check that image preview is displayed
    const imagePreview = page.locator('[data-testid="image-preview"]');
    await expect(imagePreview).toBeVisible();
    await expect(imagePreview).toHaveAttribute('src', uploadedImageUrl);
  });

  test('should handle image upload errors gracefully', async ({ page }) => {
    // Mock failed image upload
    await page.route('**/api/upload-image', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid file format' }),
      });
    });

    await page.goto('/admin/articles/new');

    // Try to upload an invalid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not-an-image'),
    });

    // Wait for error to appear
    await page.waitForTimeout(2000);

    // Check that error message is displayed
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid file format');
  });

  test('should remove image when delete button is clicked', async ({
    page,
  }) => {
    // Mock successful image upload first
    await page.route('**/api/upload-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/test-image.jpg',
        }),
      });
    });

    await page.goto('/admin/articles/new');

    // Upload an image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    // Wait for upload to complete
    await page.waitForTimeout(2000);

    // Verify image is displayed
    const imagePreview = page.locator('[data-testid="image-preview"]');
    await expect(imagePreview).toBeVisible();

    // Click remove button
    const removeButton = page.locator('[data-testid="remove-image"]');
    await removeButton.click();

    // Verify image is removed
    await expect(imagePreview).not.toBeVisible();
  });

  test('should delete associated image when article is deleted', async ({
    page,
  }) => {
    let imageDeleteCalled = false;

    // Mock articles list with image
    await page.route('**/api/admin/articles', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'article-1',
              title: 'Test Article',
              status: 'DRAFT',
              image:
                'https://res.cloudinary.com/demo/image/upload/v1234567890/test-image.jpg',
            },
          ]),
        });
      }
    });

    // Mock article deletion with image cleanup
    await page.route('**/api/admin/articles/article-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        imageDeleteCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Article and associated image deleted successfully',
          }),
        });
      }
    });

    await page.goto('/admin/articles');

    // Delete the article
    await page.click('[data-testid="delete-article-article-1"]');

    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');

    // Wait for deletion to complete
    await page.waitForTimeout(1000);

    // Verify that the delete API was called
    expect(imageDeleteCalled).toBe(true);
  });

  test('should validate image file types', async ({ page }) => {
    await page.goto('/admin/articles/new');

    // Try to upload a non-image file
    const fileInput = page.locator('input[type="file"]');

    // Check if file input has accept attribute for images
    const acceptAttribute = await fileInput.getAttribute('accept');
    expect(acceptAttribute).toContain('image/');
  });

  test('should show upload progress during image upload', async ({ page }) => {
    // Mock slow image upload
    await page.route('**/api/upload-image', async (route) => {
      // Simulate slow upload
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/test-image.jpg',
        }),
      });
    });

    await page.goto('/admin/articles/new');

    // Upload an image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    // Check that loading indicator is shown
    const loadingIndicator = page.locator('[data-testid="upload-loading"]');
    await expect(loadingIndicator).toBeVisible();

    // Wait for upload to complete
    await page.waitForTimeout(3000);

    // Check that loading indicator is hidden
    await expect(loadingIndicator).not.toBeVisible();
  });
});
