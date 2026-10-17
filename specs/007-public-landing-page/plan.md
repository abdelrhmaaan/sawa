# Implementation Plan: Public Landing Page (`/welcome`)

**Branch**: `007-public-landing-page` | **Date**: 2026-10-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-public-landing-page/spec.md`. Depends on feature 006 Phases 1–3 (catalogs, `LanguageSwitch`, logical utilities, Arabic font).

## Summary

One new public route `/welcome` renders `LandingPage`, a frontend-only page composed of nine sections built from existing design-system components, tokens, lucide icons, and inline-SVG/HTML product mocks. All copy comes from a new `landing.*` group in `en.json`/`ar.json` (status, request-type, and role labels reuse existing keys). The design system gains three small, reusable pieces: a `Logo` component (inline SVG, never mirrored), a `ButtonLink` (router link styled exactly like `Button`), and a `.text-display-hero` responsive type token plus `.reveal` motion utilities in `index.css`. The login page gets one secondary "What is SAWA?" link. No backend change, no new dependency. Details: [research.md](research.md), [data-model.md](data-model.md) (copy catalog), [contracts/ui-contract.md](contracts/ui-contract.md), [quickstart.md](quickstart.md).

## Technical Context

**Language/Version**: TypeScript 5.7 / React 19

**Primary Dependencies**: existing only — React Router 7, Tailwind CSS v4, lucide-react, react-i18next (feature 006). No additions.

**Storage**: N/A (reads/writes only the existing `sawa.lang` localStorage preference via i18next).

**Testing**: Playwright e2e (new `frontend/e2e/landing.spec.ts`), `npm run typecheck`, `npm run build`, `npm run i18n:check`. Existing `smoke.spec.ts` and `responsive.spec.ts` must stay green.

**Target Platform**: evergreen mobile and desktop browsers.

**Project Type**: web application (`frontend/` React SPA; backend untouched).

**Performance Goals**: no image files; product visuals are DOM/inline SVG; no extra network requests besides the app bundle and the already-loaded font (SC-004).

**Constraints**: WCAG 2.1 AA; tap targets ≥ 44px; LTR and RTL; `prefers-reduced-motion`; no horizontal scroll at 360/375/768/1024/1280; no session-requiring API calls (FR-014).

**Scale/Scope**: 1 page (~9 sections), ~70 catalog keys per language, 3 small design-system additions, 1 route, 1 link on the login page.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* Checked against constitution **v1.1.0**.

| Principle | Status | Evidence |
|---|---|---|
| I. Product Scope Discipline | PASS (with recorded change) | Not in MVP modules today → recorded as module 12 "Public welcome page" in `docs/discovery/mvp-scope.md` (task T-007-01). Solves the documented problems (fragmented channels, no visibility, no audit trail) by explaining the product; purely informational, smallest coherent slice (no sign-up, pricing, forms) |
| II. UX State Completeness | PASS | Static page: no async data, so no loading/empty/error states apply. Core flows unaffected |
| III. Design System First (LTR + RTL) | PASS | Reuses `Button` styles, `Badge`/`StatusBadge`, `Card`, tokens. New pieces are added *to the system* (`components/Logo.tsx`, `ButtonLink` in `ui.tsx`, `.text-display-hero` / `.reveal` in `index.css`) rather than one-offs. Logical utilities only (`ms/me/ps/pe/start/end/text-start`). Verified at 360/375/768/1024/1280 in both directions |
| IV. Server-Side Authority | PASS | No endpoint, no permission change. Page is public but static; protected routes still guarded by `RequireAuth` |
| V. Migration-Only Schema | N/A | No schema change |
| VI. Security by Default | PASS | No data shown, no session calls, no secrets. External links: none |
| VII. Tested Critical Flows | PASS | e2e: public access, CTA targets, responsive LTR/RTL, mobile menu, reduced motion. **Attack test**: visiting `/welcome` (signed out and signed in) issues zero `/api/` requests that need auth and shows no user data; protected routes reached from the page still redirect signed-out visitors to `/login` |
| Workflow gates | PASS (planned) | Task IDs `T-007-nn` in commits; `docs/ai-usage.md` row; Arabic copy reviewed by a fluent speaker before release |

**Post-design re-check (after Phase 1)**: unchanged, PASS.

## Project Structure

### Documentation (this feature)

```text
specs/007-public-landing-page/
├── spec.md
├── plan.md               # this file
├── research.md
├── data-model.md         # landing copy catalog (en + ar)
├── quickstart.md
├── contracts/
│   └── ui-contract.md    # route, landmarks, ids, test hooks
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
frontend/
├── e2e/
│   └── landing.spec.ts                 # NEW
└── src/
    ├── App.tsx                         # + <Route path="/welcome"> outside RequireAuth
    ├── index.css                       # + .text-display-hero, .reveal*, landing smooth-scroll
    ├── components/
    │   ├── Logo.tsx                    # NEW inline-SVG logo (color | mono), never mirrored
    │   ├── LanguageSwitch.tsx          # + optional className passthrough (44px tap target)
    │   └── ui.tsx                      # + export buttonClass(), ButtonLink
    ├── i18n/locales/{en,ar}.json       # + landing.* group, + auth.whatIsSawa
    └── pages/
        ├── LandingPage.tsx             # NEW page composition + document.title
        ├── LoginPage.tsx               # + "What is SAWA?" link to /welcome
        └── landing/                    # NEW
            ├── LandingNav.tsx          # sticky header, desktop links, mobile menu
            ├── mocks.tsx               # HeroMock, ChannelsMock, SawaListMock (product UI mocks)
            ├── sections.tsx            # Pain, Shift, HowItWorks, Roles, Trust, FinalCta, Footer
            └── useReveal.ts            # IntersectionObserver reveal hook
docs/discovery/mvp-scope.md             # + module 12 (scope change)
docs/ai-usage.md                        # + row for feature 007
```

**Structure Decision**: Frontend-only. Page-specific pieces live under `pages/landing/`; anything reusable (logo, link-button, type token) goes into the design system so later screens can use it.

## Key Design Decisions

1. **Routing** — `<Route path="/welcome" element={<LandingPage />} />` sits next to `/login`, inside `AuthProvider` (so the login link behaviour stays consistent) but outside `RequireAuth`. `/` and `*` unchanged.
2. **CTAs** — `ButtonLink` = React Router `<Link>` with the same classes as `Button` (`buttonClass(variant, size, fullWidth)` extracted from `Button`, `Button` refactored to call it with identical output). All landing CTAs use `size="lg"` (44px). Label = existing `auth.signIn`.
3. **Header** — `sticky top-0 z-40 bg-surface/80 backdrop-blur border-b border-border`; height 64px. Desktop (`md:` ≥768px): inline anchor links + `LanguageSwitch` + primary "Sign in". Mobile (<768px): logo + menu button only; the menu panel contains links, language switch, and full-width "Sign in". Menu button: `aria-expanded`, `aria-controls`, label from `landing.nav.openMenu/closeMenu`; Escape closes and refocuses button; link click closes; closes when resizing to `md`.
4. **Anchors** — section ids `problem`, `how-it-works`, `roles` (plus `shift`, `trust`); every section gets `scroll-mt-20` (80px > 64px header). Smooth scrolling only via `@media (prefers-reduced-motion: no-preference) { html:has(.landing-root) { scroll-behavior: smooth; } }` so the rest of the app is unaffected.
5. **Hero type** — new `.text-display-hero` in `index.css`: same weight/line-height/letter-spacing as `.text-display`, `font-size: clamp(2.25rem, 1.6rem + 2.2vw, 3.5rem)` (36px at 360px → 56px at ≥1280px). Accent word "Together." in `text-brand-900` (deep accent; not action blue).
6. **Hero background shape** — two overlapping circles (`brand-50` and `brand-100` at partial opacity) absolutely positioned at the mock's `end` side, `aria-hidden`, `overflow-hidden` on the hero to prevent horizontal scroll.
7. **Product mocks** — built with real components where they exist (`Card`, `StatusBadge`/`Badge`, lucide icons) and plain markup otherwise. Hero: leave request card (type badge, title, dates, requester avatar, vertical timeline Submitted → Approved with timestamps), overlapping "3 pending approvals" stat tile and a timesheet row (`Mon · 09:00–17:30 · 8.5 h` with Submitted badge). Mocks are `role="img"`-free figures: wrap in `<figure aria-label=…>` with inner text `aria-hidden="true"` to avoid a noisy reading of fake data. Direction icons (arrows in Shift strip, timeline connector) get `rtl:-scale-x-100`.
8. **Status colours** — text on subtle backgrounds always uses the semantic `*-text` tokens (base `info`/`warning` fail AA as small text on white); base colours only for icons/dots.
9. **Pain cards** — muted tone: icon in `text-warning`/`text-error` on `bg-warning-subtle`/`bg-error-subtle` circles, card body neutral. Icons: `EyeOff` (visibility), `ShieldQuestion` (accountability), `Hourglass` (time). Verify names exist in the installed lucide version; fall back to `HelpCircle`/`Clock`.
10. **Shift strip** — two columns (stack on mobile): "Before" shows four channel chips (`Mail`, `MessageCircle`, `FileText`, `Sheet`) slightly rotated/scattered via small transforms (no overflow); an arrow (`ArrowRight`, mirrored in RTL; `ArrowDown` on mobile); "With SAWA" shows one card listing 3 requests with Approved/Submitted/Returned badges. h2 "Everything, together."
11. **Roles** — three `Card`s side by side at `lg`, 1 column below `md`, 2+1 or 3 at `md` (use `md:grid-cols-3` only if text fits; otherwise `md:grid-cols-2 lg:grid-cols-3`). Each: icon (`User`, `Users`, `Building2`), role name from `role.*` (but HR shown as `landing.roles.hr.name` = "HR" since `role.hr` is "HR Admin"), 3 benefit bullets with `Check` icons. No tabs.
12. **Final CTA band** — documented brand exception: `bg-brand-600`, heading and body `text-white`, button white with `text-brand-700`, hover `bg-brand-50`, focus ring white (`focus-visible:ring-white focus-visible:ring-offset-brand-600`). Never use `brand-100` text on `brand-600` (4.1:1, fails).
13. **Contrast rules** — `text-muted` (#64748B) is allowed on `surface`/`page` only (≥4.55:1), never on `brand-50` (4.4:1) — use `text-secondary` there.
14. **Motion** — `useReveal()` attaches one IntersectionObserver to elements with `.reveal`, adds `.is-visible` once (threshold 0.15) and unobserves. The hiding CSS applies only under `.landing-root[data-reveal="on"]`, which is set by the hook after it attaches; if `IntersectionObserver` is missing or reduced motion is preferred, the attribute is never set → everything visible. CSS: `opacity 0 → 1`, `translateY(12px) → 0`, 400ms ease-out; `@media (prefers-reduced-motion: reduce)` forces visible with no transition.
15. **Title** — `LandingPage` sets `document.title = t("landing.meta.title")` in an effect keyed on language, restoring the previous title on unmount.
16. **Login link** — under the form on `LoginPage`: `<Link to="/welcome" className="text-small text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline">` with `auth.whatIsSawa`. Must be ≥44px tall tap area (`inline-flex min-h-11 items-center`).

## Complexity Tracking

No violations.
