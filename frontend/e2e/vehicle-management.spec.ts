import { test, expect } from '@playwright/test';

test.describe('Vehicle Management', () => {
  // 테스트용 기관 ID (시드 데이터에서 가져옴)
  const testInstitutionId = 'test-institution-uuid';

  test.beforeEach(async ({ page }) => {
    // Navigate to vehicles page
    await page.goto(`/institutions/${testInstitutionId}/vehicles`);
  });

  test('should display vehicles page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '차량 관리' })).toBeVisible();
  });

  test('should create a new vehicle', async ({ page }) => {
    // Click "차량 등록" button
    await page.getByRole('button', { name: '차량 등록' }).click();

    // Fill form
    await page.getByLabel('차량번호 뒤 4자리').fill('1234');
    await page.getByLabel('승객 정원').fill('10');

    // Submit form
    await page.getByRole('button', { name: '등록' }).click();

    // Check success toast
    await expect(page.getByText('차량이 등록되었습니다')).toBeVisible();

    // Verify vehicle appears in table
    await expect(page.getByText('1234')).toBeVisible();
    await expect(page.getByText('10명')).toBeVisible();
  });

  test('should validate lastFourDigits format', async ({ page }) => {
    // Click "차량 등록" button
    await page.getByRole('button', { name: '차량 등록' }).click();

    // Fill invalid lastFourDigits (3 digits)
    await page.getByLabel('차량번호 뒤 4자리').fill('123');
    await page.getByLabel('승객 정원').fill('10');

    // Submit form
    await page.getByRole('button', { name: '등록' }).click();

    // Check validation error
    await expect(
      page.getByText('차량번호는 4자리 숫자여야 합니다'),
    ).toBeVisible();
  });

  test('should validate passengerCapacity range', async ({ page }) => {
    // Click "차량 등록" button
    await page.getByRole('button', { name: '차량 등록' }).click();

    // Fill invalid capacity (< 5)
    await page.getByLabel('차량번호 뒤 4자리').fill('5678');
    await page.getByLabel('승객 정원').fill('3');

    // Submit form
    await page.getByRole('button', { name: '등록' }).click();

    // Check validation error
    await expect(
      page.getByText('승객 정원은 5명 이상 15명 이하여야 합니다'),
    ).toBeVisible();
  });

  test('should edit vehicle capacity', async ({ page }) => {
    // Create a vehicle first
    await page.getByRole('button', { name: '차량 등록' }).click();
    await page.getByLabel('차량번호 뒤 4자리').fill('7777');
    await page.getByLabel('승객 정원').fill('10');
    await page.getByRole('button', { name: '등록' }).click();

    // Wait for success toast to disappear
    await page.waitForTimeout(1000);

    // Click edit button on the newly created vehicle
    await page
      .locator('tr', { hasText: '7777' })
      .getByRole('button', { name: '수정' })
      .click();

    // Update capacity
    await page.getByLabel('승객 정원').clear();
    await page.getByLabel('승객 정원').fill('15');

    // Submit
    await page.getByRole('button', { name: '저장' }).click();

    // Check success toast
    await expect(page.getByText('차량 정보가 수정되었습니다')).toBeVisible();

    // Verify updated capacity
    await expect(
      page.locator('tr', { hasText: '7777' }).getByText('15명'),
    ).toBeVisible();
  });

  test('should delete vehicle with confirmation', async ({ page }) => {
    // Create a vehicle first
    await page.getByRole('button', { name: '차량 등록' }).click();
    await page.getByLabel('차량번호 뒤 4자리').fill('9999');
    await page.getByLabel('승객 정원').fill('12');
    await page.getByRole('button', { name: '등록' }).click();

    // Wait for success toast
    await page.waitForTimeout(1000);

    // Click delete button
    await page
      .locator('tr', { hasText: '9999' })
      .getByRole('button', { name: '삭제' })
      .click();

    // Confirm deletion
    await page.getByRole('button', { name: '확인' }).click();

    // Check success toast
    await expect(page.getByText('차량이 삭제되었습니다')).toBeVisible();

    // Verify vehicle is removed from table
    await expect(page.getByText('9999')).not.toBeVisible();
  });

  test('should display vehicle list with pagination', async ({ page }) => {
    // This test assumes there are more than 10 vehicles in the database
    // Check if pagination controls are visible
    const vehicleRows = await page.locator('tbody tr').count();

    if (vehicleRows >= 10) {
      await expect(
        page.getByRole('button', { name: '다음 페이지' }),
      ).toBeVisible();
    }
  });

  test('should filter vehicles by search term', async ({ page }) => {
    // Create test vehicles
    await page.getByRole('button', { name: '차량 등록' }).click();
    await page.getByLabel('차량번호 뒤 4자리').fill('1111');
    await page.getByLabel('승객 정원').fill('10');
    await page.getByRole('button', { name: '등록' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: '차량 등록' }).click();
    await page.getByLabel('차량번호 뒤 4자리').fill('2222');
    await page.getByLabel('승객 정원').fill('12');
    await page.getByRole('button', { name: '등록' }).click();
    await page.waitForTimeout(500);

    // Search for specific vehicle
    await page.getByPlaceholder('차량번호 검색').fill('1111');

    // Verify only matching vehicle is visible
    await expect(page.getByText('1111')).toBeVisible();
    await expect(page.getByText('2222')).not.toBeVisible();
  });

  test('should show empty state when no vehicles exist', async ({ page }) => {
    // This test assumes a fresh institution with no vehicles
    // Navigate to a new institution
    await page.goto('/institutions/new-institution-uuid/vehicles');

    // Check empty state
    await expect(
      page.getByText('등록된 차량이 없습니다'),
    ).toBeVisible();
    await expect(
      page.getByText('차량 등록 버튼을 클릭하여 첫 차량을 등록하세요'),
    ).toBeVisible();
  });
});
