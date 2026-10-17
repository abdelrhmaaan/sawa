# Research: Public Landing Page

## R1. Where the copy lives

- **Decision**: `landing.*` keys in `frontend/src/i18n/locales/en.json` and `ar.json`; reuse `auth.signIn`, `status.*`, `requestType.*`, `role.employee`, `role.manager`, `common.appName`, `common.tagline`, `dashboard.hoursThisWeek`.
- **Rationale**: Constitution "no hardcoded display text"; feature 006 ships the catalogs and the `i18n:check` parity gate.
- **Alternatives**: a local `const copy = {...}` (brief's original idea) — rejected: would be migrated again by 006's sweep (T-006-21) and fails the constitution.

## R2. Making `/welcome` discoverable

- **Decision**: keep `/` → `/login` for signed-out users; add a "What is SAWA?" link on the login page.
- **Rationale**: `AuthProvider.logout` (manual sign-out and the API auth-failure handler) leaves the user anonymous on the current route; on `/`, a redirect to `/welcome` would send every returning employee whose session expired to the marketing page and break `smoke.spec.ts` ("protected routes redirect to /login").
- **Alternatives**: redirect anonymous `/` → `/welcome` with a "was signed in" ref — rejected: extra auth-state logic for a cosmetic gain; stale-token visits still mis-route.

## R3. CTA wording

- **Decision**: "Sign in" everywhere (reuse `auth.signIn`).
- **Rationale**: accounts are provisioned by HR (`docs/discovery/mvp-scope.md`, no self sign-up); "Get started" implies registration.

## R4. Scroll-reveal without dependencies

- **Decision**: small `useReveal` hook with `IntersectionObserver`, progressive enhancement (content visible unless the hook opts in).
- **Rationale**: CSS scroll-driven animations (`animation-timeline: view()`) are not available in all evergreen browsers (Firefox) — content could stay hidden or unanimated inconsistently.
- **Alternatives**: animation library — rejected (no new dependencies).

## R5. Large hero headline

- **Decision**: new `.text-display-hero` token with `clamp(2.25rem, 1.6rem + 2.2vw, 3.5rem)`.
- **Rationale**: Constitution III forbids arbitrary one-off sizes; a token keeps the scale in one place. 36px floor equals `.text-display`.

## R6. Logo delivery

- **Decision**: `components/Logo.tsx` renders the brand SVG inline (icon: rounded square + two circles; optional "SAWA" wordmark as SVG `<text>` using the loaded font). Variants `color` (`#2563EB` square, `#0F172A` text) and `mono` (`#0F172A` square, `#0F172A` text), matching `docs/brand/logo.svg` and `logo-mono.svg`.
- **Rationale**: files in `docs/brand/` are not served by Vite (no `frontend/public/`); the SVGs are < 500 bytes, so inlining costs nothing and avoids an extra request. SVG content is not affected by `dir="rtl"`, so the logo is never mirrored.
- **Alternatives**: copy SVGs to `frontend/public/` — rejected: extra requests, and the wordmark would not pick up the page font reliably in `<img>`.

## R7. Link-styled buttons

- **Decision**: extract `buttonClass(variant, size, fullWidth?)` from `Button` and add `ButtonLink` (router `Link`) in `ui.tsx`.
- **Rationale**: semantic links for navigation (not `<button onClick={navigate}>`), identical visuals; reusable by other screens.

## R8. Accessibility verification without new tools

- **Decision**: contrast verified by computing token pairs (recorded in plan decisions 8, 12, 13); structure verified by Playwright assertions (one `h1`, section `aria-labelledby`, menu `aria-expanded`, focus return, tap target sizes ≥ 44px).
- **Rationale**: `@axe-core/playwright` / Lighthouse would be new dependencies.

Key contrast results (WCAG relative luminance):

| Foreground | Background | Ratio | Use |
|---|---|---|---|
| `#FFFFFF` | `brand-600 #2563EB` | 5.17 | CTA band text, primary buttons ✓ |
| `brand-600` | `#FFFFFF` | 5.17 | links ✓ |
| `brand-700 #1D4ED8` | `#FFFFFF` | 6.70 | band button text ✓ |
| `text-muted #64748B` | `#FFFFFF` / `#F8FAFC` | 4.76 / 4.55 | captions ✓ |
| `text-muted` | `brand-50 #EFF6FF` | 4.40 | ✗ — use `text-secondary` |
| `brand-100 #DBEAFE` | `brand-600` | 4.1 | ✗ — never |
| `info #0284C7` | `#FFFFFF` | 4.1 | ✗ as text — use `info-text` |
