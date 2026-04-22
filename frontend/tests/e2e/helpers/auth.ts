import type { Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? "admin@test.com";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "admin123";
const NON_ADMIN_EMAIL = process.env.TEST_NON_ADMIN_EMAIL ?? "user@test.com";
const NON_ADMIN_PASSWORD = process.env.TEST_NON_ADMIN_PASSWORD ?? "user123";

async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");

  // Ensure previous sessions do not leak into the current test run.
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();

  await page.waitForURL("**/workspace");
}

export async function adminLogin(page: Page): Promise<void> {
  await loginWithCredentials(page, ADMIN_EMAIL, ADMIN_PASSWORD);
}

export async function nonAdminLogin(page: Page): Promise<void> {
  await loginWithCredentials(page, NON_ADMIN_EMAIL, NON_ADMIN_PASSWORD);
}

export function adminCredentials(): { email: string; password: string } {
  return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
}
