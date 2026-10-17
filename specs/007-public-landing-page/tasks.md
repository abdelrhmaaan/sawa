# Tasks: Public Landing Page (`/welcome`)

**Input**: Design documents from `/specs/007-public-landing-page/` (spec.md, plan.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md)

**Prerequisites**: feature 006 Phases 1–3 complete (catalogs, `LanguageSwitch`, logical utilities, Arabic font). Do not start while 006 is still editing `en.json`/`ar.json`, `LoginPage.tsx`, `App.tsx`, `ui.tsx`.

**Commit rule**: Every commit message must include the task ID(s) (e.g. `T-007-03`).

**Tests**: required by constitution VII; includes one attack test (T-007-05 f).

**Organization**: US1 = page renders publicly with all sections and CTAs (P1, MVP); US2 = navigation, responsive, accessibility (P2); US3 = Arabic/RTL (P3). No new dependencies; no backend change; English output of existing screens unchanged.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

## Phase 1: Setup

- [X] T-007-01 [P] Record the scope change: add module **12. Public welcome page** to `docs/discovery/mvp-scope.md` (bullets: public `/welcome` page explaining SAWA; informational only — no sign-up, pricing, or forms; link from the sign-in page; `specs/007-public-landing-page/`), with the same "*(scope change 2026-10-17 …)*" style as module 11
- [X] T-007-02 [P] Catalogs: add `auth.whatIsSawa` and the whole `landing` group to `frontend/src/i18n/locales/en.json` and `ar.json` exactly as listed in `data-model.md` (additions only; existing keys untouched). `npm run i18n:check` and `npm run typecheck` pass

## Phase 2: Foundational (design-system additions)

- [X] T-007-03 [P] `frontend/src/components/ui.tsx`: extract `export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", fullWidth?: boolean, className?: string)` from `Button` (Button output must be identical); add `export function ButtonLink({ to, variant, size, fullWidth, iconLeft, iconRight, className, children, ...rest }: LinkProps & { variant?; size?; fullWidth?; iconLeft?; iconRight? })` rendering React Router `<Link>` with `buttonClass(...)`. Export the `ButtonVariant`/`ButtonSize` types if needed
- [X] T-007-04 [P] `frontend/src/components/Logo.tsx`: `Logo({ variant = "color", wordmark = true, className, decorative = false })` — inline SVG copied from `docs/brand/logo.svg` (viewBox `0 0 180 64`) or `icon.svg` (viewBox `0 0 64 64`) when `wordmark={false}`; `mono` variant uses `#0F172A` for the square (per `logo-mono.svg`). Accessible: `role="img"` + `aria-label={t("common.appName")}` unless `decorative` (then `aria-hidden`). Height controlled by `className` (e.g. `h-8 w-auto`). Never mirrored (no rtl classes). Also `frontend/src/components/LanguageSwitch.tsx`: accept optional `className` and pass it to `Button` (no visual change where it's used today)
- [X] T-007-05 [P] `frontend/src/index.css`: add after `.text-display`: `.text-display-hero` (weight 800, line-height 1.1, letter-spacing -0.03em, `font-size: clamp(2.25rem, 1.6rem + 2.2vw, 3.5rem)`); reveal utilities: `.landing-root[data-reveal="on"] .reveal { opacity: 0; transform: translateY(12px); transition: opacity 400ms ease-out, transform 400ms ease-out; }` `.landing-root[data-reveal="on"] .reveal.is-visible { opacity: 1; transform: none; }` and `@media (prefers-reduced-motion: reduce) { .landing-root .reveal { opacity: 1 !important; transform: none !important; transition: none !important; } }`; smooth scroll scoped to the landing page: `@media (prefers-reduced-motion: no-preference) { html:has(.landing-root) { scroll-behavior: smooth; } }`

**Checkpoint**: typecheck + build green; existing screens look identical.

## Phase 3: User Story 1 — Public page with all sections and CTAs (P1) 🎯 MVP

**Goal**: `/welcome` renders signed out with the nine sections in order; every "Sign in" goes to `/login`; the sign-in page links back.

**Independent Test**: private window → `/welcome` renders; click each "Sign in" → `/login`; "What is SAWA?" → `/welcome`; `/` still → `/login`.

### Tests for User Story 1

- [X] T-007-06 [US1] `frontend/e2e/landing.spec.ts` (no login needed; set `page.emulateMedia({ reducedMotion: "reduce" })` in tests that check visibility): (a) fresh context `goto("/welcome")` → URL stays `/welcome`, exactly one `h1`, sections `#hero, #problem, #shift, #how-it-works, #roles, #trust, #cta` exist in this DOM order and each has `aria-labelledby` pointing at an existing heading; (b) every link named "Sign in" has `href="/login"`, and clicking the hero one lands on `/login`; (c) on `/login`, link "What is SAWA?" → `/welcome`; (d) `goto("/")` signed out → `/login` (unchanged); (e) `document.title` contains "Every request"; (f) **attack test**: record all requests while loading `/welcome` in a fresh context and scrolling to the bottom → zero requests to `/api/`; then `goto("/requests")` → redirected to `/login`

### Implementation for User Story 1

- [X] T-007-07 [US1] Route: in `frontend/src/App.tsx` import `LandingPage` and add `<Route path="/welcome" element={<LandingPage />} />` directly after the `/login` route (outside `RequireAuth`). No other change to routes or `pageTitles`
- [X] T-007-08 [US1] `frontend/src/pages/landing/mocks.tsx`: `HeroMock` (leave `Card` with `requestType.leave` badge, `landing.mock.leaveTitle`, dates, requester `Avatar`; vertical timeline: Submitted (info dot, `landing.mock.submittedAt`) → Approved (success dot, `landing.mock.approvedAt` + comment), using `StatusBadge` or `Badge` with semantic `*-text` tokens; overlapping stat tile "3 / pending approvals" and a timesheet row (`landing.mock.timesheetDay`, `timesheetHours`, Submitted badge); wrapped in `<figure aria-label={t("landing.hero.mockLabel")}>` with the inner mock `aria-hidden="true"`), `ChannelsMock` (4 chips: `Mail`, `MessageCircle`, `FileText`, `Sheet` + `landing.shift.*` labels, small rotations, no overflow), `SawaListMock` (one card, 3 rows: leave/Approved, equipment/Submitted, wfh/Returned). Logical classes only; `rounded-lg` cards, `rounded-md` buttons, shadows `sm|md|lg` only
- [X] T-007-09 [US1] `frontend/src/pages/landing/sections.tsx`: `PainSection` (3 cards: icons `EyeOff`, `ShieldQuestion`, `Hourglass` — verify they exist in the installed lucide-react, else `HelpCircle`/`Clock` — in `bg-warning-subtle text-warning` / `bg-error-subtle text-error` circles; title, quote, body), `ShiftSection` (before/after two columns stacking on mobile, arrow `ArrowRight` with `rtl:-scale-x-100` on ≥md and `ArrowDown` below, `h2` `landing.shift.title`, body), `HowItWorksSection` (`ol` of 3 steps with icons `Send`, `CheckCircle2`, `Activity`, "Step n" label, `h3` title, body; connector line between steps on ≥md), `RolesSection` (3 `Card`s: `User`/`role.employee`, `Users`/`role.manager`, `Building2`/`landing.roles.hr.name`, each with 3 `Check` bullets; grid 1 col → `md:grid-cols-3` if it fits at 768, else `md:grid-cols-2 lg:grid-cols-3`), `TrustSection` (3 items: `ShieldCheck`, `History`, `Languages`, small title + one line), `FinalCtaSection` (`bg-brand-600`, white `h2` + body, one white `ButtonLink` to `/login` with `text-brand-700 hover:bg-brand-50` and white focus ring with brand-600 offset), `LandingFooter` (`Logo variant="mono"`, `common.tagline`, `landing.footer.copyright` with current year). Every section: `id`, `aria-labelledby`, `scroll-mt-20`, centred container `mx-auto max-w-6xl px-4 md:px-6`, generous vertical spacing (`py-16 md:py-24`); content blocks carry `className="reveal"`. At most one primary CTA per section (only hero and CTA band have one)
- [X] T-007-10 [US1] `frontend/src/pages/LandingPage.tsx`: `<div className="landing-root min-h-screen bg-page text-text-primary">` with skip link (`href="#main"`, `sr-only focus:not-sr-only` styled, `landing.skipToContent`), `<LandingNav />`, `<main id="main">` with hero + sections, `<LandingFooter />`. Hero: two columns at `lg` (text start, mock end), stacked below; eyebrow (`text-overline text-brand-900`? use `text-secondary` if contrast on page), `h1#hero-title.text-display-hero` = `titleLead` + line break + `titleAccent` in `text-brand-900`; subtitle `text-body text-text-secondary max-w-xl`; primary `ButtonLink size="lg"` "Sign in" + secondary text link `#how-it-works` (≥44px tall); decorative two overlapping circles (`bg-brand-50`, `bg-brand-100`, `rounded-full`, `aria-hidden`, positioned with `end-*`) inside `overflow-hidden`. Sets `document.title = t("landing.meta.title")` on mount/language change and restores the previous title on unmount. Calls `useReveal()` (T-007-12) — until T-007-12 lands, sections simply render visible
- [X] T-007-11 [US1] `frontend/src/pages/LoginPage.tsx`: below the form card, a `Link to="/welcome"` with `auth.whatIsSawa`, `inline-flex min-h-11 items-center text-small text-brand-600 hover:text-brand-700 hover:underline underline-offset-2`. No other change

**Checkpoint**: US1 tests green; page complete on desktop.

## Phase 4: User Story 2 — Navigation, responsive, accessibility (P2)

**Goal**: sticky nav with mobile menu; no horizontal scroll at any target width; keyboard and screen-reader friendly; subtle motion that respects reduced motion.

**Independent Test**: quickstart steps 4–6 and 8.

### Tests for User Story 2

- [X] T-007-12a [US2] Extend `frontend/e2e/landing.spec.ts`: (g) for widths 360, 375, 768, 1024, 1280 → `document.documentElement.scrollWidth <= width` (same helper as `responsive.spec.ts`); (h) at 360: menu button visible with `aria-expanded="false"`, desktop links hidden; click → `aria-expanded="true"` and `#landing-menu` visible; click "How it works" → menu hidden and `#how-title` in viewport and not covered by the header (heading `boundingBox().y >= header height`); reopen, press Escape → closed and menu button focused; (i) at 1280: links visible, no menu button; (j) every visible `a, button` in the page has a bounding box ≥ 44×44 (at 360 and 1280); (k) with `reducedMotion: "reduce"` every `.reveal` element has computed opacity `1` right after load; (l) first Tab focuses the skip link

### Implementation for User Story 2

- [X] T-007-12 [US2] `frontend/src/pages/landing/useReveal.ts`: `useReveal(rootRef)` — if `IntersectionObserver` is undefined or `matchMedia("(prefers-reduced-motion: reduce)").matches`, do nothing; else observe all `.reveal` under the root (threshold 0.15, rootMargin `0px 0px -10% 0px`), add `is-visible` and unobserve on first intersection, then set `root.dataset.reveal = "on"` (after observing, so elements already in view get `is-visible` on the first callback). Disconnect on unmount. Wire it in `LandingPage`
- [X] T-007-13 [US2] `frontend/src/pages/landing/LandingNav.tsx`: `header.sticky.top-0.z-40` with `bg-surface/80 backdrop-blur border-b border-border`, height `h-16`; `nav aria-label={t("landing.nav.label")}`; start: `Link to="/welcome"` with `Logo` (`aria-label` `landing.nav.home`); ≥md: anchor links (`min-h-11 inline-flex items-center px-3 rounded-md text-body-sm text-text-secondary hover:text-text-primary hover:bg-surface-alt`), `LanguageSwitch className="min-h-11"`, `ButtonLink size="lg"` "Sign in"; <md: `IconButton` (or button) `Menu`/`X`, `h-11 w-11`, `aria-expanded`, `aria-controls="landing-menu"`, label open/close; panel `#landing-menu` below the bar (full width, `bg-surface border-b shadow-md`), with links (block, `min-h-11`), `LanguageSwitch`, full-width "Sign in". Close on link click, on Escape (return focus to button via ref), and on `matchMedia("(min-width: 768px)")` change
- [X] T-007-14 [US2] Responsive/a11y pass on all landing files: verify at 360/375/768/1024/1280 (devtools) that nothing overflows (decorative shapes clipped, mock widths `max-w-full`, long words wrap), headings order h1 → h2 → h3, contrast rules from `research.md` R8 (no `text-muted` on `brand-50`, semantic `*-text` for coloured text), focus ring visible on every control including the CTA band button

**Checkpoint**: US1 + US2 tests green.

## Phase 5: User Story 3 — Arabic / RTL (P3)

**Goal**: whole page in Arabic, mirrored; preference shared with the rest of SAWA.

**Independent Test**: quickstart step 7.

- [X] T-007-15 [US3] Extend `frontend/e2e/landing.spec.ts`: (m) on `/welcome` click the language switch (desktop width) → `html[lang=ar][dir=rtl]`, `h1` contains "معًا", no element on the page still shows the English hero title; (n) repeat test (g) widths in Arabic; (o) click "تسجيل الدخول"/the hero sign-in link → `/login` still `lang=ar`; (p) the logo SVG has no mirroring transform (computed `transform` is `none`)
- [X] T-007-16 [US3] RTL review of landing files: only logical classes (`ms/me/ps/pe/start/end/text-start/text-end/border-s/e/rounded-s/e`) — grep `pages/landing`, `LandingPage.tsx`, `Logo.tsx` for `\b(ml|mr|pl|pr|left|right)-|text-left|text-right` and fix; direction icons (`ArrowRight`, step connectors) mirrored with `rtl:-scale-x-100`; non-directional icons not mirrored; hero shape positioned with `end-*`; channel chip rotations still look intentional in RTL

**Checkpoint**: all landing tests green in both languages.

## Phase 6: Polish & Cross-Cutting

- [X] T-007-17 [P] `docs/ai-usage.md`: add a row for feature 007 (tool, what was generated — page, mocks, catalog copy incl. AI-drafted Arabic pending fluent review —, what was corrected, how verified)
- [X] T-007-18 Final gate: `npm run typecheck`, `npm run i18n:check`, `npm run build` (confirm no new image assets in `dist/assets`), `npx playwright test e2e/landing.spec.ts`, then regression `e2e/smoke.spec.ts` and `e2e/responsive.spec.ts` (backend + seed running, high local throttle rates per 006 quickstart). Walk `quickstart.md` manually and tick the spec checklist

## Dependencies & Execution Order

- 006 Phases 1–3 → Phase 1 → Phase 2 → US1 → US2 → US3 → Polish.
- Within Phase 1/2, tasks marked [P] touch different files and can run in parallel.
- T-007-06 is written before T-007-07..11 and must fail first (route missing).
- T-007-12a before T-007-12/13; T-007-15 before T-007-16.

## Parallel Opportunities

- T-007-01, T-007-02, T-007-03, T-007-04, T-007-05 (different files).
- T-007-08 and T-007-09 after Phase 2 (different files); T-007-11 independent of the page files.
