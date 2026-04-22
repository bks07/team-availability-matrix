// Requires a running stack: docker-compose up (see apps/team-availability-matrix/docker-compose.yml)
import { expect, test } from "@playwright/test";
import { adminLogin } from "./helpers/auth";
import { createHoliday, deleteHolidayByName } from "./helpers/data";

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

test.describe("T1 - Create public holiday", () => {
  let duplicateDate: string;
  let duplicateName: string;
  let createdName: string;

  test.beforeEach(async ({ request }) => {
    const id = uniqueId();
    duplicateDate = "2030-01-01";
    duplicateName = `Holiday-Duplicate-${id}`;
    createdName = `Holiday-Create-${id}`;

    await createHoliday(request, duplicateDate, duplicateName);
  });

  test.afterEach(async ({ request }) => {
    await deleteHolidayByName(request, duplicateName);
    await deleteHolidayByName(request, createdName);
  });

  test("admin creates holiday with date and name and sees it in the list", async ({
    page,
  }) => {
    await adminLogin(page);
    await openHolidaysPage(page);

    await page.getByLabel("Holiday date").fill("2030-04-18");
    await page.getByLabel("Holiday name").fill(createdName);
    await page.getByRole("button", { name: "Add" }).click();

    await expect(
      page.getByText("Public holiday created successfully."),
    ).toBeVisible();
    await expect(
      page.getByRole("row", { name: new RegExp(createdName) }),
    ).toBeVisible();
  });

  test("admin sees duplicate error for same date and name", async ({
    page,
  }) => {
    await adminLogin(page);
    await openHolidaysPage(page);

    await page.getByLabel("Holiday date").fill(duplicateDate);
    await page.getByLabel("Holiday name").fill(duplicateName);
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
  });

  test("admin sees validation error when holiday name is empty", async ({
    page,
  }) => {
    await adminLogin(page);
    await openHolidaysPage(page);

    await page.getByLabel("Holiday date").fill("2030-06-30");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Holiday name is required.")).toBeVisible();
  });
});
