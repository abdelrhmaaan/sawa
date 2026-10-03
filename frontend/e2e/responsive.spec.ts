import { expect, test, type Locator, type Page } from "@playwright/test";

// Responsive UX pass (constitution II/III): every key page must render without
// horizontal scroll at 375 / 768 / 1280 px, with its main landmark and primary
// content visible. Runs against the shared dev DB — read-only except for the
// 375px log-time test, which creates its own uniquely-noted entry.

const PASSWORD = "demo1234";
const SARA = "sara@sawa.demo"; // employee
const MANAGER_A = "manager.a@sawa.demo";

const uid = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: /Welcome back/ })
  ).toBeVisible();
}

/** The classic overflow bug: document wider than the viewport. */
async function expectNoHScroll(page: Page, width: number) {
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth
  );
  expect(
    scrollWidth,
    `horizontal overflow: scrollWidth ${scrollWidth} > viewport ${width}`
  ).toBeLessThanOrEqual(width);
}

/** Visible and actually laid out (not zero-width, not wider than the screen). */
async function expectVisibleContent(locator: Locator, width: number) {
  await expect(locator.first()).toBeVisible();
  const box = await locator.first().boundingBox();
  expect(box, "primary content has no box").not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.width).toBeLessThanOrEqual(width);
}

function fmtTime(totalMin: number) {
  return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(
    totalMin % 60
  ).padStart(2, "0")}`;
}

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Log a 2.00 h entry via the "Log time" modal; returns the entry's date.
 * Copied from smoke.spec.ts — retries random slots on recent dates because
 * the backend rejects entries overlapping an existing same-day entry.
 */
async function logTime(page: Page, note: string): Promise<string> {
  await page.getByRole("button", { name: "Log time" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Note").fill(note);

  const today = new Date();
  for (let attempt = 0; attempt < 8; attempt++) {
    const date = new Date(today);
    if (attempt > 0) date.setDate(date.getDate() - Math.floor(Math.random() * 14));
    const startMin =
      attempt === 0 ? 9 * 60 : Math.floor(Math.random() * (24 * 60 - 120));
    await dialog.getByLabel("Date").fill(isoDay(date));
    await dialog.getByLabel("Start").fill(fmtTime(startMin));
    await dialog.getByLabel("End").fill(fmtTime(startMin + 120));
    const [res] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/timesheets/") &&
          r.request().method() === "POST"
      ),
      dialog.getByRole("button", { name: "Save entry" }).click(),
    ]);
    if (res.ok()) {
      await expect(dialog).toBeHidden();
      return isoDay(date);
    }
    const body = await res.json().catch(() => null);
    if (res.status() !== 400 || !JSON.stringify(body).includes("overlaps")) {
      throw new Error(`Log time failed: ${res.status()} ${JSON.stringify(body)}`);
    }
  }
  throw new Error("Could not find a free 2-hour slot for the timesheet entry");
}

const VIEWPORTS = [375, 768, 1280] as const;

for (const width of VIEWPORTS) {
  test.describe(`viewport ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await login(page, SARA);
    });

    test("dashboard renders without horizontal scroll", async ({ page }) => {
      await page.goto("/");
      const main = page.locator("main");
      await expect(main).toBeVisible();
      await expect(
        main.getByRole("heading", { name: /Welcome back/ })
      ).toBeVisible();
      await expectVisibleContent(main.getByText("Hours this week"), width);
      await expectNoHScroll(page, width);
    });

    test("requests list renders without horizontal scroll", async ({ page }) => {
      await page.goto("/requests");
      const main = page.locator("main");
      await expect(main).toBeVisible();
      await expect(
        main.getByRole("heading", { name: "My requests" })
      ).toBeVisible();
      await expect(
        main.getByRole("button", { name: "New request" }).first()
      ).toBeVisible();
      // Rows when data exists, the empty state otherwise.
      await expect(
        main.locator("tbody tr").first().or(main.getByText("No requests found"))
      ).toBeVisible();
      await expectNoHScroll(page, width);
    });

    test("new request form renders without horizontal scroll", async ({
      page,
    }) => {
      await page.goto("/requests/new");
      const main = page.locator("main");
      await expect(main).toBeVisible();
      await expect(
        main.getByRole("heading", { name: "New request" })
      ).toBeVisible();
      await expectVisibleContent(main.getByLabel("Type"), width);
      await expectVisibleContent(main.getByLabel("Title"), width);
      await expectVisibleContent(main.getByLabel("Description"), width);
      await expect(
        main.getByRole("button", { name: "Create draft" })
      ).toBeVisible();
      await expectNoHScroll(page, width);
    });

    test("timesheets renders without horizontal scroll", async ({ page }) => {
      await page.goto("/timesheets");
      const main = page.locator("main");
      await expect(main).toBeVisible();
      await expect(
        main.getByRole("heading", { name: "My timesheets" })
      ).toBeVisible();
      await expect(
        main.getByRole("button", { name: "Log time" }).first()
      ).toBeVisible();
      // Entry rows (div[role=button]) when data exists, empty state otherwise.
      await expect(
        main
          .locator('div[role="button"]')
          .first()
          .or(main.getByText("No time entries"))
      ).toBeVisible();
      await expectNoHScroll(page, width);
    });

    if (width < 1024) {
      test("mobile bottom nav reaches key destinations", async ({ page }) => {
        await page.goto("/");
        const bottomNav = page.locator("nav").last();
        await expect(bottomNav).toBeVisible();
        await expect(
          bottomNav.getByRole("link", { name: "Dashboard" })
        ).toBeVisible();
        await bottomNav.getByRole("link", { name: "My requests" }).click();
        await expect(page).toHaveURL(/\/requests$/);
        await bottomNav.getByRole("link", { name: "My timesheets" }).click();
        await expect(page).toHaveURL(/\/timesheets$/);
        await expectNoHScroll(page, width);
      });
    }
  });
}

// SC-001: logging a time entry on a phone-sized screen must work end to end.
test.describe("viewport 375px — mobile time logging", () => {
  test("log a time entry end to end at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await login(page, SARA);
    await page.goto("/timesheets");

    const note = uid();
    const date = await logTime(page, note);
    await expectNoHScroll(page, 375);

    // The new entry shows up in the list when filtered to its day.
    await page.getByLabel("From date").fill(date);
    await page.getByLabel("To date").fill(date);
    const row = page.locator('div[role="button"]').filter({ hasText: note });
    await expect(row).toBeVisible();
    await expect(row).toContainText("2.00 h");
    await expectNoHScroll(page, 375);
  });
});

// Manager-only queues, checked at desktop width.
test.describe("viewport 1280px — approver queues", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page, MANAGER_A);
  });

  test("approvals queue renders without horizontal scroll", async ({
    page,
  }) => {
    await page.goto("/approvals");
    const main = page.locator("main");
    await expect(main).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "Approvals" })
    ).toBeVisible();
    await expect(
      main.locator("tbody tr").first().or(main.getByText("All caught up"))
    ).toBeVisible();
    await expectNoHScroll(page, 1280);
  });

  test("timesheet review renders without horizontal scroll", async ({
    page,
  }) => {
    await page.goto("/timesheets/review");
    const main = page.locator("main");
    await expect(main).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "Timesheet review" })
    ).toBeVisible();
    await expect(
      main.locator("tbody tr").first().or(main.getByText("All caught up"))
    ).toBeVisible();
    await expectNoHScroll(page, 1280);
  });
});
