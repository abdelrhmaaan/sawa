# UI Contract: `/welcome`

Stable structure the e2e tests (and future changes) rely on.

## Route

| Path | Auth | Element | Notes |
|---|---|---|---|
| `/welcome` | public | `LandingPage` | sibling of `/login`, inside `AuthProvider`, outside `RequireAuth` |
| `/`, others | unchanged | — | signed-out → `/login` (unchanged) |

## Document

- `document.title` = `landing.meta.title` (current language); previous title restored on leave.
- Root wrapper: `<div class="landing-root">` (gets `data-reveal="on"` only when reveal animation is active).

## Landmarks & headings (in DOM order)

| Element | Attributes | Content |
|---|---|---|
| `a` skip link | `href="#main"`, visible on focus | `landing.skipToContent` |
| `header` | sticky | `nav[aria-label=landing.nav.label]` |
| `main#main` | — | sections below |
| `section#hero` | `aria-labelledby="hero-title"` | `h1#hero-title` (only `h1` on page) |
| `section#problem` | `aria-labelledby="problem-title"` | `h2#problem-title` = `landing.pain.title` |
| `section#shift` | `aria-labelledby="shift-title"` | `h2#shift-title` = `landing.shift.title` |
| `section#how-it-works` | `aria-labelledby="how-title"` | `h2#how-title`; steps are `ol > li` with `h3` |
| `section#roles` | `aria-labelledby="roles-title"` | `h2#roles-title`; 3 cards with `h3` |
| `section#trust` | `aria-labelledby="trust-title"` | `h2#trust-title` (may be visually small) |
| `section#cta` | `aria-labelledby="cta-title"` | `h2#cta-title` = `landing.cta.title` |
| `footer` | — | mono logo, `common.tagline`, `landing.footer.copyright` |

All `section` elements carry `scroll-mt-20`.

## Navigation

- Desktop (≥768px): links `#problem`, `#how-it-works`, `#roles`; `LanguageSwitch`; `ButtonLink` "Sign in" → `/login`.
- Mobile (<768px): `button[aria-expanded][aria-controls="landing-menu"]`, accessible name `landing.nav.openMenu` / `landing.nav.closeMenu`. Panel `#landing-menu` holds the 3 links, `LanguageSwitch`, full-width "Sign in". Closes on link click, Escape (focus → button), and when the viewport reaches 768px.

## Calls to action

- Every element with accessible name `auth.signIn` on the page is an `<a href="/login">`. Count: header (1, desktop or mobile panel), hero (1), CTA band (1).
- Hero secondary link: `<a href="#how-it-works">` = `landing.hero.secondary`.
- Login page: `<a href="/welcome">` = `auth.whatIsSawa`.

## Network

- The page issues no request to `/api/` other than what `AuthProvider` already does on app start (token refresh / `me` when a refresh token exists). It renders no user data even when signed in.

## Sizing

- Every interactive element on the page has a hit box ≥ 44×44px.
- No horizontal document scroll at 360, 375, 768, 1024, 1280px in `ltr` and `rtl`.
