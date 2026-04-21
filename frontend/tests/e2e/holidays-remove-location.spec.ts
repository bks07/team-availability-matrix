// Requires a running stack: docker-compose up (see apps/team-availability-matrix/docker-compose.yml)
import { expect, test } from '@playwright/test';
import { adminLogin } from './helpers/auth';
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

test.describe('T5 - Remove location from holiday', () => {
  let locationAName: string;
  let locationBName: string;
  let holidayWithMultipleLocationsName: string;
  let holidayWithSingleLocationName: string;

  test.beforeEach(async ({ request }) => {
    const id = uniqueId();
    locationAName = `Location-Remove-A-${id}`;
    locationBName = `Location-Remove-B-${id}`;
    holidayWithMultipleLocationsName = `Holiday-Remove-Multi-${id}`;
    holidayWithSingleLocationName = `Holiday-Remove-Single-${id}`;

    const locationA = await createLocation(request, locationAName);
    const locationB = await createLocation(request, locationBName);
    const holidayWithMultipleLocations = await createHoliday(
      request,
      '2030-09-15',
      holidayWithMultipleLocationsName
    );
    const holidayWithSingleLocation = await createHoliday(
      request,
      '2030-09-16',
      holidayWithSingleLocationName
    );

    await addLocationToHoliday(request, holidayWithMultipleLocations.id, locationA.id);
    await addLocationToHoliday(request, holidayWithMultipleLocations.id, locationB.id);
    await addLocationToHoliday(request, holidayWithSingleLocation.id, locationA.id);
  });

  test.afterEach(async ({ request }) => {
    await deleteHolidayByName(request, holidayWithMultipleLocationsName);
    await deleteHolidayByName(request, holidayWithSingleLocationName);
    await deleteLocationByName(request, locationAName);
    await deleteLocationByName(request, locationBName);
  });

  test('admin confirms removal and location is removed while holiday remains', async ({ page }) => {
    await adminLogin(page);
    await openHolidaysPage(page);

    const holidayRow = page.getByRole('row', { name: new RegExp(holidayWithMultipleLocationsName) });

    const dialogPromise = page.waitForEvent('dialog');
    await holidayRow
      .getByRole('button', {
        name: `Remove ${locationAName} from ${holidayWithMultipleLocationsName}`
      })
      .click();
    const dialog = await dialogPromise;

    await dialog.accept();

    await expect(holidayRow.getByText(locationAName)).toHaveCount(0);
    await expect(page.getByRole('row', { name: new RegExp(holidayWithMultipleLocationsName) })).toBeVisible();
  });

  test('admin cancels location removal and location stays visible', async ({ page }) => {
    await adminLogin(page);
    await openHolidaysPage(page);

    const holidayRow = page.getByRole('row', { name: new RegExp(holidayWithMultipleLocationsName) });

    const dialogPromise = page.waitForEvent('dialog');
    await holidayRow
      .getByRole('button', {
        name: `Remove ${locationBName} from ${holidayWithMultipleLocationsName}`
      })
      .click();
    const dialog = await dialogPromise;

    await dialog.dismiss();

    await expect(holidayRow.getByText(locationBName)).toBeVisible();
  });

  test('admin removes last location and holiday still exists with zero locations', async ({ page }) => {
    await adminLogin(page);
    await openHolidaysPage(page);

    const holidayRow = page.getByRole('row', { name: new RegExp(holidayWithSingleLocationName) });

    const dialogPromise = page.waitForEvent('dialog');
    await holidayRow
      .getByRole('button', {
        name: `Remove ${locationAName} from ${holidayWithSingleLocationName}`
      })
      .click();
    const dialog = await dialogPromise;

    await dialog.accept();

    await expect(page.getByRole('row', { name: new RegExp(holidayWithSingleLocationName) })).toBeVisible();
    await expect(holidayRow.getByText('No locations')).toBeVisible();
  });
});
