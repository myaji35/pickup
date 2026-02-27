import { test, expect } from '@playwright/test';

test.describe('Passenger Group Management', () => {
  const institutionId = 'test-institution-id';
  const baseUrl = `http://localhost:3000/institutions/${institutionId}/passenger-groups`;

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  test('should display passenger groups page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /passenger groups/i })).toBeVisible();
  });

  test('should create a new passenger group', async ({ page }) => {
    // Click "New Group" button
    await page.getByRole('button', { name: /new group/i }).click();

    // Fill in the form
    await page.getByLabel(/group code/i).fill('GRP001');
    await page.getByLabel(/group name/i).fill('Morning Group A');

    // Submit the form
    await page.getByRole('button', { name: /create/i }).click();

    // Verify success message
    await expect(page.getByText(/group created successfully/i)).toBeVisible();

    // Verify group appears in the table
    await expect(page.getByText('GRP001')).toBeVisible();
    await expect(page.getByText('Morning Group A')).toBeVisible();
  });

  test('should show validation error for empty group code', async ({ page }) => {
    await page.getByRole('button', { name: /new group/i }).click();

    await page.getByLabel(/group name/i).fill('Test Group');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(/group code.*required/i)).toBeVisible();
  });

  test('should show error for duplicate group code', async ({ page }) => {
    // Create first group
    await page.getByRole('button', { name: /new group/i }).click();
    await page.getByLabel(/group code/i).fill('GRP001');
    await page.getByLabel(/group name/i).fill('Group 1');
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByText(/group created successfully/i)).toBeVisible();

    // Try to create duplicate
    await page.getByRole('button', { name: /new group/i }).click();
    await page.getByLabel(/group code/i).fill('GRP001');
    await page.getByLabel(/group name/i).fill('Group 2');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
  });

  test('should edit passenger group name', async ({ page }) => {
    // Assume a group exists
    await page.getByRole('button', { name: /new group/i }).click();
    await page.getByLabel(/group code/i).fill('GRP001');
    await page.getByLabel(/group name/i).fill('Old Name');
    await page.getByRole('button', { name: /create/i }).click();

    // Click edit button
    await page.getByRole('row', { name: /GRP001/i }).getByRole('button', { name: /edit/i }).click();

    // Update name
    await page.getByLabel(/group name/i).fill('New Name');
    await page.getByRole('button', { name: /save/i }).click();

    // Verify update
    await expect(page.getByText(/group updated successfully/i)).toBeVisible();
    await expect(page.getByText('New Name')).toBeVisible();
  });

  test('should delete passenger group with no passengers', async ({ page }) => {
    // Create a group
    await page.getByRole('button', { name: /new group/i }).click();
    await page.getByLabel(/group code/i).fill('GRP001');
    await page.getByLabel(/group name/i).fill('Test Group');
    await page.getByRole('button', { name: /create/i }).click();

    // Delete the group
    await page.getByRole('row', { name: /GRP001/i }).getByRole('button', { name: /delete/i }).click();

    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify deletion
    await expect(page.getByText(/group deleted successfully/i)).toBeVisible();
    await expect(page.getByText('GRP001')).not.toBeVisible();
  });

  test('should prevent deletion of group with passengers', async ({ page }) => {
    // This test assumes a group with passengers exists (mock or seed data)
    // Try to delete
    await page.getByRole('row', { name: /group with passengers/i }).getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify error message
    await expect(page.getByText(/cannot delete.*passengers/i)).toBeVisible();
  });

  test('should display passenger count for each group', async ({ page }) => {
    // Create group
    await page.getByRole('button', { name: /new group/i }).click();
    await page.getByLabel(/group code/i).fill('GRP001');
    await page.getByLabel(/group name/i).fill('Test Group');
    await page.getByRole('button', { name: /create/i }).click();

    // Verify passenger count is displayed (should be 0 initially)
    const row = page.getByRole('row', { name: /GRP001/i });
    await expect(row.getByText('0')).toBeVisible();
  });

  test('should filter groups by search', async ({ page }) => {
    // Create multiple groups
    const groups = [
      { code: 'GRP001', name: 'Morning Group' },
      { code: 'GRP002', name: 'Evening Group' },
    ];

    for (const group of groups) {
      await page.getByRole('button', { name: /new group/i }).click();
      await page.getByLabel(/group code/i).fill(group.code);
      await page.getByLabel(/group name/i).fill(group.name);
      await page.getByRole('button', { name: /create/i }).click();
    }

    // Search for "Morning"
    await page.getByPlaceholder(/search/i).fill('Morning');

    // Verify only morning group is visible
    await expect(page.getByText('Morning Group')).toBeVisible();
    await expect(page.getByText('Evening Group')).not.toBeVisible();
  });
});
