import { test, expect } from '@playwright/test';

test.describe('Passenger Management', () => {
  const institutionId = 'test-institution-id';
  const baseUrl = `http://localhost:3000/institutions/${institutionId}/passengers`;

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  test('should display passengers page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /passengers/i })).toBeVisible();
  });

  test('should create a new passenger', async ({ page }) => {
    // Click "New Passenger" button
    await page.getByRole('button', { name: /new passenger/i }).click();

    // Fill in the form
    await page.getByLabel(/name/i).fill('홍길동');
    await page.getByLabel(/phone number/i).fill('010-1234-5678');
    await page.getByLabel(/pickup address/i).fill('서울시 강남구 테헤란로 123');
    await page.getByLabel(/dropoff address/i).fill('서울시 서초구 서초대로 456');
    await page.getByLabel(/shuttle type/i).selectOption('MORNING');

    // Submit the form
    await page.getByRole('button', { name: /create/i }).click();

    // Verify success message
    await expect(page.getByText(/passenger created successfully/i)).toBeVisible();

    // Verify passenger appears in the table
    await expect(page.getByText('홍길동')).toBeVisible();
    await expect(page.getByText('010-1234-5678')).toBeVisible();
  });

  test('should show validation error for invalid phone number', async ({ page }) => {
    await page.getByRole('button', { name: /new passenger/i }).click();

    await page.getByLabel(/name/i).fill('홍길동');
    await page.getByLabel(/phone number/i).fill('123-456-7890');
    await page.getByLabel(/pickup address/i).fill('서울시 강남구');
    await page.getByLabel(/dropoff address/i).fill('서울시 서초구');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(/invalid.*phone number/i)).toBeVisible();
  });

  test('should edit passenger information', async ({ page }) => {
    // Assume a passenger exists
    await page.getByRole('row', { name: /홍길동/i }).getByRole('button', { name: /edit/i }).click();

    // Update name
    await page.getByLabel(/name/i).fill('김철수');
    await page.getByRole('button', { name: /save/i }).click();

    // Verify update
    await expect(page.getByText(/passenger updated successfully/i)).toBeVisible();
    await expect(page.getByText('김철수')).toBeVisible();
  });

  test('should delete passenger', async ({ page }) => {
    // Create a passenger first
    await page.getByRole('button', { name: /new passenger/i }).click();
    await page.getByLabel(/name/i).fill('테스트');
    await page.getByLabel(/phone number/i).fill('010-0000-0000');
    await page.getByLabel(/pickup address/i).fill('서울시 강남구');
    await page.getByLabel(/dropoff address/i).fill('서울시 서초구');
    await page.getByLabel(/shuttle type/i).selectOption('MORNING');
    await page.getByRole('button', { name: /create/i }).click();

    // Delete the passenger
    await page.getByRole('row', { name: /테스트/i }).getByRole('button', { name: /delete/i }).click();

    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify deletion
    await expect(page.getByText(/passenger deleted successfully/i)).toBeVisible();
    await expect(page.getByText('테스트')).not.toBeVisible();
  });

  test('should filter by shuttle type', async ({ page }) => {
    // Filter by MORNING
    await page.getByLabel(/shuttle type/i).selectOption('MORNING');

    // Verify only morning passengers are visible
    const rows = await page.getByRole('row').all();
    for (const row of rows) {
      const text = await row.textContent();
      if (text?.includes('EVENING') || text?.includes('TEMPORARY')) {
        throw new Error('Non-morning shuttle type found in filtered results');
      }
    }
  });

  test('should search by name', async ({ page }) => {
    // Search for "홍길동"
    await page.getByPlaceholder(/search/i).fill('홍길동');

    // Verify only matching passengers are visible
    await expect(page.getByText('홍길동')).toBeVisible();
  });

  test('should assign passenger to group', async ({ page }) => {
    await page.getByRole('button', { name: /new passenger/i }).click();

    await page.getByLabel(/name/i).fill('홍길동');
    await page.getByLabel(/phone number/i).fill('010-1234-5678');
    await page.getByLabel(/pickup address/i).fill('서울시 강남구');
    await page.getByLabel(/dropoff address/i).fill('서울시 서초구');
    await page.getByLabel(/shuttle type/i).selectOption('MORNING');
    await page.getByLabel(/group/i).selectOption('GRP001');
    await page.getByRole('button', { name: /create/i }).click();

    // Verify group assignment
    const row = page.getByRole('row', { name: /홍길동/i });
    await expect(row.getByText('GRP001')).toBeVisible();
  });

  test('should paginate passenger list', async ({ page }) => {
    // Navigate to page 2
    await page.getByRole('button', { name: /next/i }).click();

    // Verify page changed
    await expect(page.getByText(/page 2/i)).toBeVisible();
  });
});
