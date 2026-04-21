// Requires a running stack: docker-compose up (see apps/team-availability-matrix/docker-compose.yml)
import { expect, test } from '@playwright/test';
import { adminLogin, nonAdminLogin } from './helpers/auth';
import {
  addLocationToHoliday,
  createHoliday,
  createLocation,
  deleteHolidayByName,
  deleteLocationByName
} from './helpers/data';

function uniqueId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

async function openHolidaysPage(page: Parameters<typeof adminLogin>[0]): Promise<void> {
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Navigation menu' }).click();
  await page.getByRole('link', { name: 'Public Holidays' }).click();
  await expect(page.getByRole('heading', { name: 'Public Holiday Management' })).toBeVisible();
}

test.describe('T3 - Delete public holiday', () => {
  let locationName: string;
  let deleteHolidayName: string;
  let cancelHolidayName: string;

  test.beforeEach(async ({ request }) => {
    const id = uniqueId();
    locationName = `Location-Delete-${id}`;
    deleteHolidayName = `Holiday-Delete-Confirm-${id}`;
    cancelHolidayName = `Holiday-Delete-Cancel-${id}`;

    const location = await createLocation(request, locationName);
    const holidayToDelete = await createHoliday(request, '2030-07-01', deleteHolidayName);
    await createHoliday(request, '2030-07-02', cancelHolidayName);

    await addLocationToHoliday(request, holidayToDelete.id, location.id);
  });

  test.afterEach(async ({ request }) => {
    await deleteHolidayByName(request, deleteHolidayName);
    await deleteHolidayByName(request, cancelHolidayName);
    await deleteLocationByName(request, locationName);
  });

  test('admin confirms deletion and holiday disappears', async ({ page }) => {
    await adminLogin(page);
    await openHolidaysPage(page);

    const dialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: `Delete ${deleteHolidayName}` }).click();
    const dialog = await dialogPromise;

    expect(dialog.message()).toContain(`Delete public holiday "${deleteHolidayName}"?`);
    await dialog.accept();

    await expect(page.getByText('Public holiday deleted successfully.')).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(deleteHolidayName) })).toHaveCount(0);

    await page.getByRole('button', { name: `Add location to ${cancelHolidayName}` }).click();
    const locationSelect = page.getByLabel('Select location to add');
    await expect(locationSelect.locator('option', { hasText: locationName })).toBeVisible();
  });

  test('admin cancels deletion and holiday remains', async ({ page }) => {
    await adminLogin(page);
    await openHolidaysPage(page);

    const dialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: `Delete ${cancelHolidayName}` }).click();
    const dialog = await dialogPromise;

    await dialog.dismiss();

    await expect(page.getByRole('row', { name: new RegExp(cancelHolidayName) })).toBeVisible();
  });

  test('non-admin cannot access admin holiday management', async ({ page }) => {
    await nonAdminLogin(page);
    await page.goto('/admin/public-holidays');

    await expect(page.getByRole('heading', { name: '403 - Access denied' })).toBeVisible();
    await expect(page.getByText('You do not have permission to view administration pages.')).toBeVisible();
  });
});
