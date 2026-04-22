// Requires a running stack: docker-compose up (see apps/team-availability-matrix/docker-compose.yml)
import { expect, test } from "@playwright/test";
import { adminLogin, nonAdminLogin } from "./helpers/auth";
import {
  addLocationToHoliday,
  createHoliday,
  createLocation,
  deleteHolidayByName,
  deleteLocationByName,
} from "./helpers/data";

function uniqueId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

async function openHolidaysPage(
  page: Parameters<typeof adminLogin>[0],
): Promise<void> {
  await page.goto("/workspace");
  await page.getByRole("button", { name: "Navigation menu" }).click();
  await page.getByRole("link", { name: "Public Holidays" }).click();
  await expect(
    page.getByRole("heading", { name: "Public Holiday Management" }),
  ).toBeVisible();
}

test.describe("T4 - Add location to holiday", () => {
  let holidayName: string;
  let locationName: string;
  let holidayId: number;
  let locationId: number;

  test.beforeEach(async ({ request }) => {
    const id = uniqueId();
    holidayName = `Holiday-Add-Location-${id}`;
    locationName = `Location-Add-${id}`;

    const holiday = await createHoliday(request, "2030-08-10", holidayName);
    const location = await createLocation(request, locationName);

    holidayId = holiday.id;
    locationId = location.id;
  });

  test.afterEach(async ({ request }) => {
    await deleteHolidayByName(request, holidayName);
    await deleteLocationByName(request, locationName);
  });

  test("admin assigns location and sees it in holiday location list", async ({
    page,
  }) => {
    await adminLogin(page);
    await openHolidaysPage(page);

    await page
      .getByRole("button", { name: `Add location to ${holidayName}` })
      .click();
    await page
      .getByLabel("Select location to add")
      .selectOption({ label: locationName });
    await page.getByRole("button", { name: "Assign location" }).click();

    await expect(page.getByText(locationName)).toBeVisible();
  });

  test("admin sees duplicate error when assigning same location again", async ({
    page,
    request,
  }) => {
    await adminLogin(page);
    await openHolidaysPage(page);

    await page
      .getByRole("button", { name: `Add location to ${holidayName}` })
      .click();
    await page
      .getByLabel("Select location to add")
      .selectOption({ label: locationName });

    // Keep stale form state open, then assign through API so the UI submit hits duplicate protection.
    await addLocationToHoliday(request, holidayId, locationId);
    await page.getByRole("button", { name: "Assign location" }).click();

    await expect(page.getByText(/already assigned/i)).toBeVisible();
  });

  test("non-admin cannot perform add location action", async ({ page }) => {
    await nonAdminLogin(page);
    await page.goto("/admin/public-holidays");

    await expect(
      page.getByRole("heading", { name: "403 - Access denied" }),
    ).toBeVisible();
  });
});
