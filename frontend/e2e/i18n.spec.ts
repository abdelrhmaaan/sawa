import { expect, test, type Page } from "@playwright/test";

// Arabic-localization E2E (feature 006, US1). Runs against the shared dev
// environment. The language switch is the button labelled "Switch language"
// (English UI) / "تغيير اللغة" (Arabic UI); the choice persists in
// localStorage under "sawa.lang".

const PASSWORD = "demo1234";
const SARA = "sara@sawa.demo";

const LANG_SWITCH = /switch language|تغيير اللغة/i;
const EMAIL_LABEL = /email|البريد الإلكتروني/i;
const PASSWORD_LABEL = /password|كلمة المرور/i;
const SIGN_IN_BTN = /sign in|تسجيل الدخول/i;

async function htmlAttrs(page: Page) {
  return page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
  }));
}

async function setLanguage(page: Page, lang: "ar" | "en") {
  await expect
    .poll(
      async () => {
        if ((await htmlAttrs(page)).lang !== lang) {
          // Click may land before React hydration completes — retry.
          await page
            .getByRole("button", { name: LANG_SWITCH })
            .click()
            .catch(() => {});
        }
        return (await htmlAttrs(page)).lang;
      },
      { timeout: 15000 }
    )
    .toBe(lang);
}

async function switchToArabic(page: Page) {
  await setLanguage(page, "ar");
}

async function expectNoHScroll(page: Page, width: number) {
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth
  );
  expect(
    scrollWidth,
    `horizontal overflow: scrollWidth ${scrollWidth} > viewport ${width}`
  ).toBeLessThanOrEqual(width);
}

test.describe("i18n — language switching and RTL", () => {
  test("first visit is English LTR; switch to Arabic; persists; switch back", async ({
    page,
  }) => {
    // (a) Fresh context → English LTR on the login page.
    await page.goto("/login");
    expect(await htmlAttrs(page)).toEqual({ lang: "en", dir: "ltr" });
    await expect(
      page.getByRole("heading", { name: "Sign in" })
    ).toBeVisible();

    // (b) Type an email, switch to Arabic without reload — input is kept.
    const email = "partial@sawa.demo";
    await page.getByLabel("Email").fill(email);
    await switchToArabic(page);
    expect((await htmlAttrs(page)).dir).toBe("rtl");
    await expect(
      page.getByRole("heading", { name: SIGN_IN_BTN })
    ).toBeVisible();
    await expect(page.getByLabel(EMAIL_LABEL)).toHaveValue(email);

    // (c) Reload → still Arabic.
    await page.reload();
    expect(await htmlAttrs(page)).toEqual({ lang: "ar", dir: "rtl" });
    await expect(
      page.getByRole("heading", { name: SIGN_IN_BTN })
    ).toBeVisible();

    // (f) Sign in as Sara → authenticated UI in Arabic, then sign out and the
    // login page stays Arabic.
    await page.getByLabel(EMAIL_LABEL).fill(SARA);
    await page.getByLabel(PASSWORD_LABEL).fill(PASSWORD);
    await page.getByRole("button", { name: SIGN_IN_BTN }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: "لوحة التحكم" }).first()
    ).toBeVisible();

    // Arabic headings on key pages.
    await page.goto("/requests/new");
    await expect(
      page.getByRole("heading", { name: "طلب جديد" }).first()
    ).toBeVisible();
    await page.goto("/timesheets");
    await expect(
      page.getByRole("heading", { name: "سجلات وقتي" }).first()
    ).toBeVisible();

    // (f cont.) Sign out via the sidebar user menu → Arabic login page.
    await page.getByRole("button", { name: /Sara/ }).click();
    await page.getByRole("button", { name: "تسجيل الخروج" }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect((await htmlAttrs(page)).lang).toBe("ar");
    await expect(
      page.getByRole("heading", { name: SIGN_IN_BTN })
    ).toBeVisible();

    // (e) Switch back → English + LTR.
    await page.getByRole("button", { name: LANG_SWITCH }).click();
    await expect
      .poll(async () => (await htmlAttrs(page)).lang)
      .toBe("en");
    expect((await htmlAttrs(page)).dir).toBe("ltr");
    await expect(
      page.getByRole("heading", { name: "Sign in" })
    ).toBeVisible();
  });

  // US3 (T-006-36): Sara submits a request in English; Manager A reads the
  // notification in Arabic, then in English — same event, reader's language.
  test("notifications render in the reader's language", async ({
    browser,
    request,
  }) => {
    const title = `i18n-notif-${Date.now()}`;

    // Sara submits a request via the API with English as active language.
    const token = await request
      .post("/api/auth/token/", {
        data: { email: SARA, password: PASSWORD },
      })
      .then((r) => r.json())
      .then((b) => b.access as string);
    const created = await request
      .post("/api/requests/", {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          type: "general",
          title,
          description: `Notification i18n test ${title}`,
        },
      })
      .then(async (r) => {
        expect(r.ok()).toBeTruthy();
        return r.json();
      });
    const submitted = await request.post(
      `/api/requests/${created.id}/submit/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(submitted.ok()).toBeTruthy();

    // Manager A logs in (English), switches to Arabic, opens the bell.
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/login");
    await page.getByLabel("Email").fill("manager.a@sawa.demo");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/$/);
    await switchToArabic(page);

    const bell = page.getByRole("button", { name: /الإشعارات|notifications/i });
    await bell.click();
    const item = page
      .getByRole("button")
      .filter({ hasText: title })
      .first();
    await expect(item).toBeVisible();
    // Arabic template: «title» wrapped in Arabic quotes, verb in Arabic.
    await expect(item).toContainText("قدّم");
    await expect(item).toContainText("Sara Hassan");
    // RTL wraps substituted params in bidi isolates (⁨…⁩) inside the quotes.
    await expect(item).toContainText("«");
    await expect(item).toContainText("»");

    // Close the bell, switch back to English, reopen → English text.
    await page.mouse.click(10, 10);
    await setLanguage(page, "en");
    await page.getByRole("button", { name: /notifications/i }).click();
    const itemEn = page
      .getByRole("button")
      .filter({ hasText: title })
      .first();
    await expect(itemEn).toBeVisible();
    await expect(itemEn).toContainText(
      `Sara Hassan submitted "${title}" for approval.`
    );
    await ctx.close();
  });

  for (const width of [375, 768, 1280]) {
    test(`Arabic RTL pages render without horizontal scroll at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.addInitScript(() => {
        window.localStorage.setItem("sawa.lang", "ar");
      });
      await page.goto("/login");
      await page.getByLabel(EMAIL_LABEL).fill(SARA);
      await page.getByLabel(PASSWORD_LABEL).fill(PASSWORD);
      await page.getByRole("button", { name: SIGN_IN_BTN }).click();
      await expect(page).toHaveURL(/\/$/);

      await expectNoHScroll(page, width);
      await page.goto("/requests/new");
      await expect(
        page.getByRole("heading", { name: "طلب جديد" }).first()
      ).toBeVisible();
      await expectNoHScroll(page, width);
      await page.goto("/timesheets");
      await expect(
        page.getByRole("heading", { name: "سجلات وقتي" }).first()
      ).toBeVisible();
      await expectNoHScroll(page, width);
    });
  }
});
