import { expect, test, type Browser, type Page } from "@playwright/test";

// Smoke tests run against the shared dev DB — every test creates its own
// data with unique titles/notes and only asserts on things it created, so
// the suite is safe to re-run.

const PASSWORD = "demo1234";
const SARA = "sara@sawa.demo"; // employee, manager: manager.a
const KARIM = "karim@sawa.demo"; // employee, manager: manager.a
const MANAGER_A = "manager.a@sawa.demo";
const HR2 = "hr2@sawa.demo";

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

/** A second user gets its own browser context (tokens live in localStorage). */
async function loginAs(browser: Browser, email: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, email);
  return { ctx, page };
}

/**
 * My requests → New request → fill the form → Create draft.
 * Lands on the new request's detail page; returns its id.
 */
async function createRequest(page: Page, title: string): Promise<number> {
  await page.goto("/requests");
  await page.getByRole("button", { name: "New request" }).first().click();
  await expect(page).toHaveURL(/\/requests\/new$/);
  await page.getByLabel("Type").selectOption("general");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill(`Smoke-test request ${title}`);
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/requests\/\d+$/);
  return Number(page.url().match(/\/requests\/(\d+)/)![1]);
}

/** Approve the request currently open on `page` via the decision dialog. */
async function approveOpenRequest(page: Page) {
  await page.getByRole("button", { name: "Approve" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Approve" }).click();
  await expect(dialog).toBeHidden();
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
 * The backend rejects entries overlapping an existing same-day entry, and
 * submitted/approved entries can't be deleted — so re-runs fill "today" up.
 * We try today 09:00–11:00 first, then random slots on recent dates.
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

/** The entry row on /timesheets is a div with role="button" containing the note. */
function entryRow(page: Page, note: string) {
  return page.locator('div[role="button"]').filter({ hasText: note });
}

test("login as sara renders the dashboard", async ({ page }) => {
  await login(page, SARA);
  await expect(
    page.getByRole("heading", { name: /Welcome back/ })
  ).toBeVisible();
  await expect(page.getByText("Hours this week")).toBeVisible();
});

test("employee request flow: draft → submit → manager approve → notified", async ({
  page,
  browser,
}) => {
  const title = uid();
  await login(page, SARA);

  const id = await createRequest(page, title);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("Submitted", { exact: true })).toBeVisible();

  const mgr = await loginAs(browser, MANAGER_A);
  try {
    await mgr.page.goto("/approvals");
    const row = mgr.page.getByRole("row", { name: title });
    await expect(row).toBeVisible();
    await row.click();
    await expect(mgr.page).toHaveURL(new RegExp(`/requests/${id}$`));
    await approveOpenRequest(mgr.page);
    await expect(
      mgr.page.getByText("Approved", { exact: true })
    ).toBeVisible();
  } finally {
    await mgr.ctx.close();
  }

  // Reload so the bell re-fetches the unread count (it only polls on mount).
  await page.goto("/requests");
  const row = page.getByRole("row", { name: title });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Approved");

  const bell = page.getByRole("button", { name: "Notifications" });
  await expect(bell.locator("span")).toBeVisible(); // unread badge
  await bell.click();
  await expect(page.getByText(`"${title}" was approved`)).toBeVisible();
});

test("employee cannot see the approvals queue or a teammate's request", async ({
  page,
  browser,
}) => {
  await login(page, SARA);

  // Employees have no approval queue — the page renders its empty state.
  await page.goto("/approvals");
  await expect(page.getByText("All caught up")).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(0);

  // A submitted request owned by sara 404s for a coworker.
  const title = uid();
  const id = await createRequest(page, title);
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("Submitted", { exact: true })).toBeVisible();

  const karim = await loginAs(browser, KARIM);
  try {
    await karim.page.goto(`/requests/${id}`);
    await expect(karim.page.getByText("Request not found")).toBeVisible();
  } finally {
    await karim.ctx.close();
  }
});

/** Narrow the timesheets list to a single day so our entry is always on page 1. */
async function filterTimesheetsTo(page: Page, date: string) {
  await page.getByLabel("From date").fill(date);
  await page.getByLabel("To date").fill(date);
}

test("timesheet: log time → submit → manager approves", async ({
  page,
  browser,
}) => {
  const note = uid();
  await login(page, SARA);
  await page.goto("/timesheets");

  const date = await logTime(page, note);
  await filterTimesheetsTo(page, date);
  const row = entryRow(page, note);
  await expect(row).toBeVisible();
  await expect(row).toContainText("2.00 h");
  await row.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("Entry submitted for review.")).toBeVisible();
  await expect(row).toContainText("Submitted");

  const mgr = await loginAs(browser, MANAGER_A);
  try {
    await mgr.page.goto("/timesheets/review");
    const reviewRow = mgr.page
      .locator("tbody tr")
      .filter({ hasText: note });
    await expect(reviewRow).toBeVisible();
    await reviewRow.getByRole("button", { name: "Approve" }).click();
    await expect(mgr.page.getByText("Entry approved.")).toBeVisible();
    await expect(reviewRow).toHaveCount(0);
  } finally {
    await mgr.ctx.close();
  }
});

test("submitted timesheet entry is read-only (no Edit button)", async ({
  page,
}) => {
  const note = uid();
  await login(page, SARA);
  await page.goto("/timesheets");

  const date = await logTime(page, note);
  await filterTimesheetsTo(page, date);
  const row = entryRow(page, note);
  await row.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("Entry submitted for review.")).toBeVisible();
  await expect(row).toContainText("Submitted");

  await expect(
    row.getByRole("button", { name: "Edit", exact: true })
  ).toHaveCount(0);
});

test("hr sees submitted requests and can approve them", async ({
  page,
  browser,
}) => {
  const title = uid();
  await login(page, KARIM);
  await createRequest(page, title);
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("Submitted", { exact: true })).toBeVisible();

  const hr = await loginAs(browser, HR2);
  try {
    await hr.page.goto("/approvals");
    const row = hr.page.getByRole("row", { name: title });
    await expect(row).toBeVisible();
    await row.click();
    await approveOpenRequest(hr.page);
    // Approved requests leave the pending queue.
    await hr.page.goto("/approvals");
    await expect(
      hr.page.getByRole("row", { name: title })
    ).toHaveCount(0);
  } finally {
    await hr.ctx.close();
  }
});

test("logout lands on /login and protected routes redirect there", async ({
  page,
}) => {
  await login(page, SARA);
  await page.locator("aside").getByRole("button", { name: /Employee/ }).click();
  // The menu flips above the sidebar-bottom trigger (viewport edge fix).
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Sign in" })
  ).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
