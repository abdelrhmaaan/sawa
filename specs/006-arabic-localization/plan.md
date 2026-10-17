# Implementation Plan: Arabic Localization (English + Arabic, RTL)

**Branch**: `006-arabic-localization` | **Date**: 2026-10-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-arabic-localization/spec.md`. Depends on 002–005 (auth, requests, timesheets, dashboard, notifications). Scope approved by constitution v1.1.0.

## Summary

The frontend gets **react-i18next**: bundled `en`/`ar` catalogs, a language switch on the login page and in the top bar saved in `localStorage`, `<html lang dir>` switching, logical (start/end) Tailwind utilities everywhere, the IBM Plex Sans Arabic font, and locale-aware date formatting with Western digits.

The frontend sends `Accept-Language` on every API call. The backend uses Django's `LocaleMiddleware` and a hand-maintained Arabic gettext catalog (compiled with `polib`, `.mo` committed) to translate every user-facing message, including DRF and SimpleJWT messages.

Notifications gain additive `kind` + `params` fields and are rendered **at read time** in the reader's language. The API shape doesn't change. Details: [research.md](research.md), [data-model.md](data-model.md), [contracts/api-language.md](contracts/api-language.md), [quickstart.md](quickstart.md).

## Technical Context

**Language/Version**: Python 3.10 (local; Render uses 3.12) · TypeScript 5.7 / React 19

**Primary Dependencies**:
- Existing: Django 5.2.17, DRF 3.18.1, SimpleJWT 5.5.1, React Router 7, Tailwind CSS v4, Vite 8, lucide-react.
- **New** (pinned, each at least 7 days old): `i18next@26.4.2`, `react-i18next@17.0.16`, `i18next-browser-languagedetector@8.2.1` (frontend); `polib==1.2.0` (backend, catalog compile + tests).

**Storage**: PostgreSQL 16. One additive migration (`core/0002`: `Notification.kind`, `Notification.params`).

**Testing**: pytest-django (backend, tests first). Playwright e2e (frontend, new `e2e/i18n.spec.ts`). `npm run i18n:check` (catalog parity). `makemigrations --check`.

**Target Platform**: modern evergreen browsers (mobile and desktop); Linux server (Render).

**Project Type**: web application (`backend/` Django API + `frontend/` React SPA)

**Performance Goals**: switching language updates the current screen in under 1 s with no reload (SC-005). Catalogs are bundled, so there's no extra request on first paint.

**Constraints**:
- No flash of the wrong language or direction (FR-003).
- English output byte-for-byte unchanged, so all existing tests pass (FR-014).
- No gettext binaries at build or deploy time (R7).
- Permissions and scoping untouched.

**Scale/Scope**:
- About 23 `.tsx` files, a few hundred UI strings, about 220 physical-direction class uses to convert.
- About 25 backend messages plus 8 notification templates.
- 1 model change; 0 new endpoints.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* Checked against constitution **v1.1.0**.

| Principle | Status | Evidence |
|---|---|---|
| I. Product Scope Discipline | PASS | Scope change recorded: constitution v1.1.0 + `docs/discovery/mvp-scope.md` module 11. Out of scope: admin, Swagger, user content |
| II. UX State Completeness | PASS | Existing loading/empty/error/success states kept and translated. Core flows must stay under 2 min on mobile in Arabic (SC-002) |
| III. Design System First (LTR + RTL) | PASS | Logical utilities replace left/right. The new `LanguageSwitch` lives in `frontend/src/components/` and uses existing `Button`/tokens. The Arabic font becomes a token in `index.css`. Visual RTL pass at 375/768/1280 |
| IV. Server-Side Authority | PASS | No permission or queryset change. Translated messages come from the server; the client only picks the language |
| V. Migration-Only Schema | PASS | `core/0002` adds 2 fields with defaults, reversible, no data loss. Recorded in `docs/database.md`. `makemigrations --check` gate guards against accidental choice migrations from lazy labels |
| VI. Security by Default | PASS | Out-of-scope notification still 404 in Arabic. Malformed/unsupported `Accept-Language` falls back to English. Params only substituted (no template or HTML injection). `kind`/`params` not exposed. No secrets |
| VII. Tested Critical Flows | PASS | Attack tests: (1) other user's notification under `Accept-Language: ar` → 404, no content; (2) title containing `%(actor)s` / `<script>` rendered literally; (3) garbage `Accept-Language` → English, request succeeds. Arabic behaviour tests for every US2 message; e2e for switch/persist/RTL |
| Workflow gates | PASS (planned) | Task IDs `T-006-nn` in commits; `docs/ai-usage.md` row; Arabic text review by a fluent speaker (FR-013) before release |

**Post-design re-check (after Phase 1)**: unchanged, PASS. The design adds no endpoints, keeps the API shape, and the only schema change is additive.

## Project Structure

### Documentation (this feature)

```text
specs/006-arabic-localization/
├── spec.md
├── plan.md                  # this file
├── research.md              # R1–R10 decisions
├── data-model.md            # Notification kind/params + event registry
├── quickstart.md            # validation gates + manual walkthrough
├── contracts/
│   └── api-language.md      # Accept-Language / Content-Language contract
├── checklists/
│   └── requirements.md
└── tasks.md                 # /speckit-tasks (next step)
```

### Source Code (repository root)

```text
backend/
├── config/settings.py                 # LANGUAGES, LANGUAGE_CODE, LOCALE_PATHS, LocaleMiddleware,
│                                      #   + "rest_framework_simplejwt" in INSTALLED_APPS
├── requirements.txt                   # + polib==1.2.0
├── locale/ar/LC_MESSAGES/
│   ├── django.po                      # NEW, hand-maintained Arabic catalog (+ overrides of DRF/JWT wording)
│   └── django.mo                      # NEW, compiled, committed
├── core/
│   ├── management/commands/compile_catalog.py   # NEW, polib .po → .mo
│   ├── notifications.py               # NEW, kind registry + render(kind, params, fallback)
│   ├── workflow.py                    # notify(user, kind, params, link); translated transition error
│   ├── models.py                      # Notification.kind, .params
│   ├── migrations/0002_notification_kind_params.py   # NEW
│   ├── serializers.py                 # NotificationSerializer.message → rendered in active language
│   ├── exceptions.py                  # translated "Internal server error"
│   └── tests/test_i18n.py, test_catalog.py           # NEW
├── accounts/ (models.py, serializers.py)            # gettext on messages, lazy Role labels
├── employee_requests/ (models.py, views.py)         # gettext on messages, lazy labels, notify kinds
└── timesheets/ (models.py, serializers.py, views.py)# gettext on messages, lazy labels, notify kinds

frontend/
├── package.json                       # + i18next, react-i18next, detector; + "i18n:check" script
├── scripts/check-i18n.mjs             # NEW, key parity en ↔ ar (plural-aware)
├── src/
│   ├── main.tsx                       # import "./i18n" before createRoot
│   ├── i18n/index.ts                  # NEW, init, localStorage detector, <html lang dir>, document.title
│   ├── i18n/i18next.d.ts              # NEW, typed keys from en.json
│   ├── i18n/locales/en.json, ar.json  # NEW
│   ├── lib/api.ts                     # Accept-Language header
│   ├── lib/format.ts                  # NEW, formatDate/DateTime/Time/Hours (ar-u-nu-latn)
│   ├── lib/types.ts                   # labels → translation keys
│   ├── index.css                      # IBM Plex Sans Arabic import + --font-arabic + html[lang=ar] rule
│   ├── components/LanguageSwitch.tsx  # NEW
│   ├── components/{ui,overlays,DecisionDialog,Timeline}.tsx   # t() + logical classes
│   ├── shell/{Shell,NotificationsBell}.tsx                     # t(), switch in topbar, RTL drawer, refetch on language change
│   └── pages/*.tsx                    # t() + logical classes + format helpers
└── e2e/i18n.spec.ts                   # NEW

docs/database.md, docs/api.md, docs/architecture.md, docs/ai-usage.md, README.md   # updated
```

**Structure Decision**: same web-application layout as features 002–005. No new Django app (i18n infrastructure lives in `core`, like dashboard and notifications in 005). No new frontend top-level folder besides `src/i18n/`.

## Implementation Order (input for /speckit-tasks)

1. **Setup**: pinned dependencies; settings (`LANGUAGES`, `LOCALE_PATHS`, middleware, simplejwt app); `compile_catalog` command; empty catalogs; i18n init + `<html lang dir>`; `check-i18n.mjs`.
2. **Foundational** (blocks all stories): `Accept-Language` in `apiFetch`; `lib/format.ts`; `LanguageSwitch`; Arabic font token; **logical-class conversion across all `.tsx`** plus `rtl:` for drawers and chevrons.
3. **US1 (P1)**: extract every UI string into `en.json`, draft `ar.json`; labels from keys; document title; bell list refetch on `languageChanged`; e2e switch/persist/RTL/responsive.
4. **US2 (P2)**: tests first (Arabic messages for login 401, throttle 429, required field, time-entry rules, edit/delete status rules, comment required, transition error, 500, unsupported language → English); wrap messages in gettext; lazy `TextChoices` labels; Arabic catalog + overrides; compile.
5. **US3 (P3)**: tests first (render ar/en, older rows, missing param fallback, attack: 404 + literal params); migration `core/0002`; registry + `notify` signature; update the 8 call sites; computed serializer `message`.
6. **Polish**: docs (`database.md`, `api.md`, `architecture.md`, README "Languages" section); `ai-usage.md`; full gates from quickstart; fluent-speaker review checkpoint (user).

## Risks

| Risk | Mitigation |
|---|---|
| Missed hard-coded English strings | Screen-by-screen e2e walkthrough in Arabic plus a grep for JSX text literals as a final check |
| RTL visual regressions (drawers, dropdown placement, badges) | e2e at 375/768/1280 in `dir=rtl` asserting no horizontal scroll; manual check of overlays (`Dropdown` placement logic in `overlays.tsx` uses left/right math) |
| Lazy labels trigger choice migrations | `makemigrations --check` gate; if Django emits a no-op `AlterField`, investigate rather than commit it blindly |
| `.mo` out of date | catalog test compares `.po` and `.mo` |
| e2e trips login throttling | documented local env override (quickstart) |
| Arabic quality | AI draft only; FR-013 fluent review is a release gate |

## Complexity Tracking

No constitution violations, so nothing to justify.
