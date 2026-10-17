# Quickstart: Validate the Landing Page

## Prerequisites

- Feature 006 Phases 1–3 merged (catalogs, `LanguageSwitch`, logical utilities).
- Frontend deps installed (`cd frontend && npm ci`). Backend only needed for the existing smoke/responsive suites.

## Static checks

```bash
cd frontend
npm run typecheck
npm run i18n:check
npm run build
```

All must pass; `build` must not emit any new image assets.

## Manual walkthrough

1. `npm run dev` (port 5180), open `http://localhost:5180/welcome` in a private window → page renders, no redirect.
2. Click each "Sign in" (header, hero, band) → `/login`. On `/login`, click "What is SAWA?" → `/welcome`.
3. Open `/` signed out → still `/login`.
4. DevTools device toolbar at 360, 375, 768, 1024, 1280 → no horizontal scrollbar; mobile menu below 768.
5. At 360: open menu → pick "How it works" → menu closes, heading visible under the bar. Reopen → Escape → focus on menu button.
6. Tab through the whole page → visible focus ring everywhere, logical order; skip link appears first.
7. Switch to العربية → all text Arabic, layout mirrored, logo not mirrored, arrows point left; click "Sign in" → login page is Arabic.
8. Enable "Emulate CSS prefers-reduced-motion: reduce" → reload → no fade/slide, anchor jumps are instant.

## Automated

```bash
cd frontend
npx playwright test e2e/landing.spec.ts
npx playwright test e2e/smoke.spec.ts e2e/responsive.spec.ts   # regression (needs backend + seed)
```

Expected: all green.
