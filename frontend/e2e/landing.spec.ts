import { expect, test, type Page } from "@playwright/test";

// Public landing page (/welcome). No login or backend needed — the page is
// fully static and must issue zero /api/ requests.

const WIDTHS = [360, 375, 768, 1024, 1280];
const SECTION_IDS = [
  "hero",
  "problem",
  "shift",
  "how-it-works",
  "roles",
  "trust",
  "cta",
];

async function expectNoHScroll(page: Page, width: number) {
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth
  );
  expect(
    scrollWidth,
    `horizontal overflow: scrollWidth ${scrollWidth} > viewport ${width}`
  ).toBeLessThanOrEqual(width);
}

test.describe("landing page — public access & CTAs (US1)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("a: /welcome renders signed out with all sections in order", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/welcome");
    await expect(page).toHaveURL(/\/welcome$/);

    await expect(page.locator("h1")).toHaveCount(1);

    const sections = page.locator("main section");
    const ids = await sections.evaluateAll((els) =>
      els.map((el) => el.id).filter(Boolean)
    );
    expect(ids).toEqual(SECTION_IDS);

    for (const id of SECTION_IDS) {
      const section = page.locator(`section#${id}`);
      await expect(section).toBeVisible();
      const labelledby = await section.getAttribute("aria-labelledby");
      expect(labelledby, `section #${id} has aria-labelledby`).toBeTruthy();
      await expect(
        page.locator(`#${labelledby}`),
        `label target #${labelledby} exists and is a heading`
      ).toBeVisible();
      const tag = await page
        .locator(`#${labelledby}`)
        .evaluate((el) => el.tagName);
      expect(["H1", "H2", "H3"]).toContain(tag);
    }
  });

  test("b: every 'Sign in' is a link to /login; hero CTA navigates", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/welcome");

    const signIns = page.getByRole("link", { name: "Sign in" });
    const count = await signIns.count();
    expect(count).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < count; i++) {
      await expect(signIns.nth(i)).toHaveAttribute("href", "/login");
    }

    await page.locator("section#hero").getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("c: login page links 'What is SAWA?' back to /welcome", async ({
    page,
  }) => {
    await page.goto("/login");
    const link = page.getByRole("link", { name: "What is SAWA?" });
    await expect(link).toHaveAttribute("href", "/welcome");
    await link.click();
    await expect(page).toHaveURL(/\/welcome$/);
  });

  test("d: / still redirects signed-out visitors to /login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("e: document title contains the hero claim", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page).toHaveTitle(/Every request/);
  });

  test("f: attack test — no /api/ requests; protected routes still redirect", async ({
    page,
    context,
  }) => {
    const apiRequests: string[] = [];
    context.on("request", (req) => {
      if (new URL(req.url()).pathname.startsWith("/api/")) {
        apiRequests.push(req.url());
      }
    });

    await page.goto("/welcome");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    expect(apiRequests, "landing page issued /api/ requests").toEqual([]);

    await page.goto("/requests");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("landing page — navigation, responsive, a11y (US2)", () => {
  test("g: no horizontal scroll at any target width", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/welcome");
      await expectNoHScroll(page, width);
    }
  });

  test("h: mobile menu opens, navigates, closes on Escape with focus return", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/welcome");

    const menuButton = page.getByRole("button", { name: "Open menu" });
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");

    // desktop links hidden
    await expect(page.locator("nav a[href='#problem']")).toBeHidden();

    await menuButton.click();
    await expect(
      page.getByRole("button", { name: "Close menu" })
    ).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#landing-menu")).toBeVisible();

    await page.locator("#landing-menu").getByRole("link", { name: "How it works" }).click();
    await expect(page.locator("#landing-menu")).toBeHidden();

    const heading = page.locator("#how-title");
    const hBox = await heading.boundingBox();
    const header = page.locator("header");
    const headBox = await header.boundingBox();
    expect(hBox).not.toBeNull();
    expect(headBox).not.toBeNull();
    expect(
      hBox!.y,
      "section heading is hidden under the sticky header"
    ).toBeGreaterThanOrEqual(headBox!.height);

    // reopen, Escape closes and returns focus
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.locator("#landing-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#landing-menu")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Open menu" })
    ).toBeFocused();
  });

  test("i: at 1280 the inline links show and the menu button is gone", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/welcome");
    await expect(page.locator("nav a[href='#problem']")).toBeVisible();
    await expect(page.locator("nav a[href='#how-it-works']")).toBeVisible();
    await expect(page.locator("nav a[href='#roles']")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /open menu/i })
    ).toBeHidden();
  });

  test("j: every visible link/button has a ≥44×44 hit box", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/welcome");
      const tooSmall = await page.evaluate(() => {
        const bad: string[] = [];
        for (const el of document.querySelectorAll("a, button")) {
          // the skip link is visually hidden (sr-only) until focused
          if (el.classList.contains("sr-only")) continue;
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          const visible =
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none";
          if (visible && (rect.width < 44 || rect.height < 44)) {
            bad.push(
              `${el.tagName} "${(el.textContent ?? "").trim().slice(0, 40)}" ${Math.round(rect.width)}x${Math.round(rect.height)}`
            );
          }
        }
        return bad;
      });
      expect(tooSmall, `tap targets < 44px at width ${width}`).toEqual([]);
    }
  });

  test("k: reduced motion — every .reveal is visible immediately", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/welcome");
    const hidden = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of document.querySelectorAll(".reveal")) {
        if (getComputedStyle(el).opacity !== "1") {
          bad.push(el.className);
        }
      }
      return bad;
    });
    expect(hidden).toEqual([]);
  });

  test("l: first Tab focuses the skip link", async ({ page }) => {
    await page.goto("/welcome");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveText("Skip to content");
    await expect(focused).toHaveAttribute("href", "#main");
    await expect(focused).toBeVisible();
  });
});

test.describe("landing page — Arabic / RTL (US3)", () => {
  test("m: language switch flips to Arabic RTL", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/welcome");

    await page.getByRole("button", { name: /switch language/i }).click();

    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "ar");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(page.locator("h1")).toContainText("معًا");
    await expect(page.locator("h1")).not.toContainText("Every request");
  });

  test("n: no horizontal scroll at target widths in Arabic", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/welcome");
    await page.evaluate(() => localStorage.setItem("sawa.lang", "ar"));
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expectNoHScroll(page, width);
    }
    await page.evaluate(() => localStorage.removeItem("sawa.lang"));
  });

  test("o: Arabic sign-in link reaches /login still in Arabic", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/welcome");
    await page.evaluate(() => localStorage.setItem("sawa.lang", "ar"));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await page
      .locator("section#hero")
      .getByRole("link", { name: "تسجيل الدخول" })
      .click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await page.evaluate(() => localStorage.removeItem("sawa.lang"));
  });

  test("p: the logo SVG is not mirrored in RTL", async ({ page }) => {
    await page.goto("/welcome");
    await page.evaluate(() => localStorage.setItem("sawa.lang", "ar"));
    await page.reload();
    const transforms = await page
      .locator("header svg, footer svg")
      .evaluateAll((svgs) =>
        svgs.map((s) => getComputedStyle(s).transform)
      );
    for (const t of transforms) {
      expect(t).toBe("none");
    }
    // The wordmark must sit after the icon, not over it (SVG <text> would
    // otherwise inherit direction: rtl and anchor its end at x=78).
    const logos = await page.locator("header svg:has(text), footer svg:has(text)").all();
    expect(logos.length).toBeGreaterThan(0);
    for (const svg of logos) {
      const rect = await svg.locator("rect").boundingBox();
      const text = await svg.locator("text").boundingBox();
      expect(rect && text).toBeTruthy();
      expect(text!.x).toBeGreaterThanOrEqual(rect!.x + rect!.width);
    }
    await page.evaluate(() => localStorage.removeItem("sawa.lang"));
  });
});
