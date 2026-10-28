import { expect, test } from "@playwright/test";
import { closeDb, resetFixture } from "./db";

test.beforeEach(async () => {
  await resetFixture();
});

test.afterAll(async () => {
  await closeDb();
});

test("sites overview loads and shows status counts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("site-card")).toHaveCount(1);
  await expect(page.getByTestId("count-available")).toContainText(
    "1 available",
  );
  await expect(page.getByTestId("count-charging")).toContainText(
    "1 charging",
  );
  await expect(page.getByTestId("count-faulted")).toContainText("1 faulted");
});

test("opening a site shows its chargers", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("site-card").click();
  await expect(page.getByTestId("charger-row")).toHaveCount(3);
});

test("filtering by status updates the table", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("site-card").click();
  await page.getByTestId("filter-faulted").click();
  await expect(page.getByTestId("charger-row")).toHaveCount(1);
  await expect(page.getByTestId("charger-status")).toHaveText("faulted");
});

test("starting a session changes the charger to charging", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("site-card").click();
  await page.getByTestId("filter-available").click();
  await page.getByTestId("start-session").click();
  await expect(page.getByTestId("charger-status")).toHaveText("charging");
});

test("stopping a session changes it back to available", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("site-card").click();
  await page.getByTestId("filter-charging").click();
  await page.getByTestId("stop-session").click();
  await expect(page.getByTestId("charger-status")).toHaveText("available");
});

test("changing the date range updates the energy chart", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("site-card").click();
  await expect(page.getByTestId("energy-chart")).toBeVisible();
  await page.getByTestId("date-from").fill("2020-01-01");
  await page.getByTestId("date-to").fill("2020-01-02");
  await expect(page.getByTestId("energy-chart")).toBeVisible();
});
