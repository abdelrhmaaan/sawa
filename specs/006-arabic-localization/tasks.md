# Tasks: Arabic Localization (English + Arabic, RTL)

**Input**: Design documents from `/specs/006-arabic-localization/` (spec.md, plan.md, research.md, data-model.md, contracts/api-language.md, quickstart.md)

**Prerequisites**: features 002–005 shipped; constitution v1.1.0 (Arabic in scope).

**Commit rule**: Every commit message must include the task ID(s) (e.g. `T-006-03`).

**Tests**: required by constitution VII. Backend tests are written FIRST and must FAIL before the implementation. Every story has at least one attack test.

**Organization**: US1 = UI in Arabic + RTL (P1, MVP); US2 = server messages in Arabic (P2); US3 = notifications in the reader's language (P3). English output must stay byte-for-byte unchanged (FR-014). The existing 171 backend tests must stay green after every phase.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

## Phase 1: Setup

- [x] T-006-01 [P] Add pinned frontend deps with `npm install --save-exact i18next@26.4.2 react-i18next@17.0.16 i18next-browser-languagedetector@8.2.1` in `frontend/` (updates `frontend/package.json` + `package-lock.json`); do not use newer versions (7-day supply-chain rule)
- [x] T-006-02 [P] Add `polib==1.2.0` to `backend/requirements.txt` (after `pytest-django`) and install it into `backend/.venv`
- [x] T-006-03 Backend i18n settings in `backend/config/settings.py`: `LANGUAGE_CODE = "en"`, `LANGUAGES = [("en", "English"), ("ar", "العربية")]`, `LOCALE_PATHS = [BASE_DIR / "locale"]`; insert `"django.middleware.locale.LocaleMiddleware"` after `SessionMiddleware` and before `CommonMiddleware`; add `"rest_framework_simplejwt"` to `INSTALLED_APPS` (loads its `ar` catalog; no models). Run the full suite and confirm 171 still pass
- [x] T-006-04 [P] Management command `backend/core/management/commands/compile_catalog.py`: for each `LOCALE_PATHS/*/LC_MESSAGES/django.po`, compile it to `django.mo` next to it with `polib` (`polib.pofile(path).save_as_mofile(...)`), skipping fuzzy entries, and print each file written. Create `backend/locale/ar/LC_MESSAGES/django.po` with a valid header (`Language: ar`, `Content-Type: text/plain; charset=UTF-8`, `Plural-Forms: nplurals=6; plural=n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 ? 4 : 5;`) and no entries yet; compile it and commit both files
- [x] T-006-05 [P] Frontend i18n init `frontend/src/i18n/index.ts`: bundled resources from `./locales/en.json` + `./locales/ar.json` (start with `{}`-shaped placeholders containing `common.appName`); `LanguageDetector` with `detection: { order: ["localStorage"], lookupLocalStorage: "sawa.lang", caches: ["localStorage"] }`; `fallbackLng: "en"`, `supportedLngs: ["en","ar"]`, `load: "languageOnly"`, `interpolation.escapeValue: false` (React escapes); on init and on `languageChanged` set `document.documentElement.lang` and `.dir` (`ar` → `rtl`, else `ltr`). Import `./i18n` in `frontend/src/main.tsx` before `createRoot`. Add `frontend/src/i18n/i18next.d.ts` declaring `CustomTypeOptions.resources` from `en.json`
- [x] T-006-06 [P] Catalog parity script `frontend/scripts/check-i18n.mjs` + `"i18n:check": "node scripts/check-i18n.mjs"` in `frontend/package.json`: flatten keys of `en.json` and `ar.json`, strip plural suffixes (`_zero|_one|_two|_few|_many|_other`), exit 1 listing keys missing from `ar` or extra in `ar`; also fail on empty-string values

**Checkpoint**: app builds and behaves exactly as before; `npm run typecheck`, `npm run i18n:check`, `pytest -q` green.

## Phase 2: Foundational (blocks all stories)

- [x] T-006-07 [P] `frontend/src/lib/api.ts` `apiFetch`: send `Accept-Language: i18n.resolvedLanguage ?? "en"` on every request (import the i18n instance from `@/i18n`)
- [x] T-006-08 [P] `frontend/src/lib/format.ts`: `formatDate(iso)`, `formatDateTime(iso)`, `formatTime(hhmm)`, `formatHours(n)` using locale `i18n.language === "ar" ? "ar-u-nu-latn" : "en"` (Western digits per FR-012). Replace the local formatters at `pages/RequestsPage.tsx:64` (`formatDate`, keep its call sites working), `pages/TimesheetReviewPage.tsx:28`, `pages/TimesheetsPage.tsx:68`, `components/Timeline.tsx:3` (`formatDateTime`) and `shell/NotificationsBell.tsx:14` (`formatWhen`); keep identical English output options
- [x] T-006-09 [P] Arabic font in `frontend/src/index.css`: extend the existing Google Fonts `@import` with `IBM+Plex+Sans+Arabic:wght@400;500;600;700`, add `--font-arabic: 'IBM Plex Sans Arabic', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;` to `@theme`, and a rule `html[lang="ar"] body { font-family: var(--font-arabic); }`
- [x] T-006-10 `frontend/src/components/LanguageSwitch.tsx` (design system): a small ghost `Button` that shows `العربية` when the language is `en` and `English` when it is `ar`, with `lang` set on its label, `aria-label` from the `common.switchLanguage` key; calls `i18n.changeLanguage`. Mount it in the `Shell.tsx` top bar (before `NotificationsBell`) and on `pages/LoginPage.tsx` (top end corner). Switching must keep form input (no remount or reload)
- [x] T-006-11 Logical-direction conversion across `frontend/src/**/*.tsx` (excluding nothing; ~220 occurrences): `ml-/mr-`→`ms-/me-`, `pl-/pr-`→`ps-/pe-`, `left-/right-`→`start-/end-` (incl. negative e.g. `-right-0.5`→`-end-0.5`), `text-left/right`→`text-start/end`, `border-l/r`→`border-s/e`, `rounded-l/r`→`rounded-s/e`, `rounded-tl/tr/bl/br`→`rounded-ss/se/es/ee`. Leave centring patterns (`left-1/2 -translate-x-1/2`) unchanged. Add `rtl:-translate-x-full` (or the mirrored value) next to slide-in transforms of drawers/off-canvas sidebar in `components/overlays.tsx` and `shell/Shell.tsx`; add `rtl:-scale-x-100` to every direction icon (`ChevronRight`, 3 uses). Review `Dropdown` placement math in `components/overlays.tsx` (viewport-edge logic) so it aligns to the trigger's end edge in RTL. Must not change LTR rendering; also fix `shell/NotificationsBell.tsx` panel `right-0` → `end-0`

**Checkpoint**: switching language flips `<html dir>`, the font, and the mirrored layout; text is still English (strings not extracted yet); LTR is visually unchanged (run `e2e/responsive.spec.ts`).

## Phase 3: User Story 1 — Switch the interface to Arabic (P1) 🎯 MVP

**Goal**: all fixed UI text comes from `en.json`/`ar.json`; Arabic is fully RTL; the choice persists per browser.

**Independent Test**: fresh browser → switch on login → sign in → submit request, log time, open approvals → every fixed string Arabic, `dir=rtl`; reload keeps Arabic; switch back restores English/LTR.

### Tests for User Story 1

- [x] T-006-12 [P] [US1] `frontend/e2e/i18n.spec.ts` (reuse login helpers from `e2e/smoke.spec.ts`): (a) fresh context opens with `html[lang=en][dir=ltr]`; (b) on `/login` type an email, click the switch → `html[lang=ar][dir=rtl]`, Arabic heading visible, typed email still present; (c) reload → still Arabic; (d) sign in as Sara, open `/requests/new`, `/timesheets`, dashboard → Arabic headings visible, no horizontal scroll at 375/768/1280 (same assertion as `responsive.spec.ts`); (e) switch back → English + `ltr`; (f) logout while Arabic → login page Arabic

### Implementation for User Story 1

- [x] T-006-13 [US1] Build the full English catalog `frontend/src/i18n/locales/en.json` with nested areas `common, nav, auth, dashboard, requests, approvals, timesheets, review, notifications, profile, errors, status, requestType, role, pagination` — every fixed string in `src/pages/*.tsx`, `src/shell/*.tsx`, `src/components/{DecisionDialog,Timeline,overlays,ui}.tsx` (built-in texts like Table empty message, pagination, ConfirmDialog buttons, Toast close), and `App.tsx` (page titles, NotFound). Use interpolation for dynamic parts (`{{name}}`, `{{count}}`) and plural keys `_one/_other` where counts appear. `pages/DesignSystem.tsx` (internal showcase) is excluded
- [x] T-006-14 [US1] Replace hard-coded strings with `useTranslation()`/`t()` in `frontend/src/pages/{LoginPage,DashboardPage,RequestsPage,RequestFormPage,RequestDetailPage,ApprovalsPage}.tsx` (labels, placeholders, buttons, empty/loading/error states, toasts, confirm dialogs, aria-labels)
- [x] T-006-15 [US1] Same for `frontend/src/pages/{TimesheetsPage,TimesheetReviewPage,ProfilePage,TimesheetEntryForm}.tsx`, `frontend/src/components/{DecisionDialog,Timeline}.tsx`, `frontend/src/components/{ui,overlays}.tsx` built-in texts, and `frontend/src/shell/{Shell,NotificationsBell}.tsx` (nav items, user menu, bell texts)
- [x] T-006-16 [US1] Labels from keys: replace `requestTypeLabels` (`frontend/src/lib/types.ts:65`), `roleLabels` (`frontend/src/shell/Shell.tsx:61`), `requestStatusLabels`/`entryStatusLabels` (`frontend/src/pages/DashboardPage.tsx:26,34`) and `StatusBadge` text (`frontend/src/components/ui.tsx:546`) with `t("requestType.<v>")`, `t("role.<v>")`, `t("status.<v>")`; keep the enum values untouched
- [x] T-006-17 [US1] Page titles: `resolvePageTitle` in `frontend/src/App.tsx` returns translation keys, and the topbar title + `document.title` (`"<page> · SAWA"`) update on route and language change
- [x] T-006-18 [US1] Client-side messages in `frontend/src/lib/api.ts` (`"Session expired. Please sign in again."`, generic network/HTTP fallbacks in `ApiError`) and client validations in `frontend/src/pages/TimesheetEntryForm.tsx` (end-after-start, no future date) use `t()` (via `i18n.t` outside components)
- [x] T-006-19 [US1] `frontend/src/shell/NotificationsBell.tsx`: on `languageChanged`, refresh the unread count and, if the panel is open, refetch the list (so server-rendered messages follow the language)
- [x] T-006-20 [US1] Draft `frontend/src/i18n/locales/ar.json` in Modern Standard Arabic covering every key (Arabic plurals `_zero,_one,_two,_few,_many,_other` where `en` uses `_one/_other`); keep `SAWA` and user content untranslated; JSON allows no comments, so the "AI-drafted, pending fluent review (FR-013)" note goes in the `docs/ai-usage.md` row (T-006-38). `npm run i18n:check` must pass
- [x] T-006-21 [US1] Final sweep: grep `frontend/src` (excluding `DesignSystem.tsx`, `i18n/`) for remaining JSX text literals and string props (`title=`, `placeholder=`, `aria-label=`, `description=`, `message=`) with English words; translate any left. Run `npm run typecheck`, `npm run build`, `e2e/i18n.spec.ts`, `e2e/responsive.spec.ts`, `e2e/smoke.spec.ts` (with high local throttle rates per quickstart)

**Checkpoint**: US1 complete; MVP demoable (server messages may still be English).

## Phase 4: User Story 2 — Server messages in the chosen language (P2)

**Goal**: every user-facing API message honours `Accept-Language` (contract `contracts/api-language.md`).

**Independent Test**: trigger each listed error with `Accept-Language: ar` → Arabic; with `en`/none → today's English; with `fr` → English.

### Tests for User Story 2 — write FIRST, ensure they FAIL

- [ ] T-006-22 [P] [US2] `backend/core/tests/test_i18n.py` (use `api_client`/`auth_client` fixtures, pass `HTTP_ACCEPT_LANGUAGE="ar"`): assert the response text equals the Arabic `msgstr` from the catalog (look it up via `translation.override("ar")` + `gettext(msgid)`, and also assert it differs from English) for: login wrong password 401; login throttled 429 (6th attempt; message contains the seconds); request create missing `title` (required) 400; edit submitted request 400 (`Cannot edit a request in status …` with Arabic status label); delete non-draft request 400; reject without comment 400; timesheet end-before-start, future date, overlap 400; timesheet edit/delete wrong status 400; transition from wrong status 400 (`core/workflow.py`); bulk submit bad `ids` 400; manager self-manager validation in `accounts/models.py`; refresh with deactivated user 401. Also assert `Content-Language: ar` header
- [ ] T-006-23 [P] [US2] Same file: English unchanged — the same requests without the header and with `Accept-Language: en` return exactly today's English strings; `Accept-Language: fr` → English + `Content-Language: en`. **Attack**: malformed/huge header (`"x"*5000`, `"ar;q=abc,,,"`, `"../../etc"`) → request succeeds with English, never 500
- [ ] T-006-24 [P] [US2] `backend/core/tests/test_catalog.py`: every entry in `backend/locale/ar/LC_MESSAGES/django.po` (parsed with `polib`) has a non-empty `msgstr` (all plural forms filled for `msgid_plural`), none fuzzy, placeholders (`%(name)s`, `%(count)d`) identical between msgid and msgstr; and the committed `django.mo` (polib `mofile`) contains exactly the same msgid→msgstr pairs as the `.po` (fails if someone forgot `compile_catalog`)

### Implementation for User Story 2

- [ ] T-006-25 [US2] Lazy labels: `TextChoices` labels become `gettext_lazy` in `backend/employee_requests/models.py` (Type, Status), `backend/timesheets/models.py` (Status), `backend/accounts/models.py` (Role). Run `.venv/bin/python manage.py makemigrations --check --dry-run` → must report no changes (if Django emits choice migrations, stop and report instead of committing them)
- [ ] T-006-26 [US2] Wrap every user-facing message with `gettext` (`from django.utils.translation import gettext as _`) using named placeholders, keeping English text identical: `backend/employee_requests/views.py:90-112`, `backend/timesheets/views.py:100-122,183,194`, `backend/timesheets/models.py:41-63` (clean errors), `backend/timesheets/serializers.py:64`, `backend/accounts/models.py:78,83`, `backend/accounts/serializers.py` (`"No active account found"`), `backend/core/workflow.py:93-100` (status names via the model's `Status(value).label`, e.g. `_("Cannot change status from '%(from)s' to '%(to)s'.") % {...}` — keep English output identical to today), `backend/core/exceptions.py:22`
- [ ] T-006-27 [US2] Fill `backend/locale/ar/LC_MESSAGES/django.po` with Arabic for all messages from T-006-26 and the lazy labels from T-006-25, plus overrides: SimpleJWT `"No active account found with the given credentials"` and DRF throttle `"Request was throttled. Expected available in {wait} second."`/plural (copy the exact msgid/msgid_plural from the installed DRF `rest_framework/exceptions.py` and give natural Arabic with all 6 plural forms). Run `python manage.py compile_catalog`; commit `.po` + `.mo`
- [ ] T-006-28 [US2] Run `pytest -q` (all green incl. T-006-22..24) and the US2 rows of `quickstart.md` manually via the UI in Arabic

**Checkpoint**: US1 + US2 — Arabic UI with Arabic server messages.

## Phase 5: User Story 3 — Notifications in the reader's language (P3)

**Goal**: notifications render in the reader's language at read time (data-model.md event registry); older rows keep working.

**Independent Test**: Sara (English) submits → `manager.a` reads the bell in Arabic (Arabic sentence, name/title intact) → switches to English → same notification in English.

### Tests for User Story 3 — write FIRST, ensure they FAIL

- [ ] T-006-29 [P] [US3] `backend/core/tests/test_notifications_i18n.py`: for each of the 8 kinds (`request_submitted|approved|rejected|returned`, `timesheet_submitted|bulk_submitted|approved|returned`) trigger the real transition through the API, then `GET /api/notifications/` as the recipient with `Accept-Language: ar` → Arabic text containing the actor name / title / date / count exactly as stored; with no header → exactly today's English text; `timesheet_bulk_submitted` uses correct singular/plural in English (1 vs 3 entries). Stored row has `kind`, `params`, and English `message`
- [ ] T-006-30 [P] [US3] Same file: legacy row (`kind=""`, `params={}`) returns its stored `message` in both languages; row with unknown `kind` or missing param falls back to stored `message` (no 500). **Attacks**: (1) recipient B requests `POST /api/notifications/{A's id}/read/` with `Accept-Language: ar` → 404 and body contains none of A's params; (2) a request titled `%(actor)s <script>alert(1)</script> {{x}}` submitted → the rendered `message` contains that title literally in both languages; (3) response items expose only `id, message, link, is_read, created_at` (no `kind`/`params`)

### Implementation for User Story 3

- [ ] T-006-31 [US3] `backend/core/models.py` `Notification`: add `kind = models.CharField(max_length=40, blank=True, default="")` and `params = models.JSONField(default=dict, blank=True)`; generate `backend/core/migrations/0002_notification_kind_params.py` (two `AddField` only — verify the file, no other operations)
- [ ] T-006-32 [US3] `backend/core/notifications.py`: registry `KINDS` mapping each kind to its English template exactly as in data-model.md (`gettext_lazy`; `timesheet_bulk_submitted` via `ngettext_lazy` with `%(count)d`), and `render(kind, params, fallback)` → `template % params` in the active language; on unknown kind, `KeyError`, `TypeError`, or `ValueError` return `fallback`
- [ ] T-006-33 [US3] `backend/core/workflow.py` `notify(user, kind, params, link="")`: validate `kind in KINDS`, compute `message` with `translation.override("en")` via `render`, truncate to 300, save `kind`/`params`. Update the 8 call sites: `backend/employee_requests/views.py:127,150` (decision kind from `to_status`, submit) and `backend/timesheets/views.py:134,157,209` (decision, single submit with `date` as ISO string, bulk with `count=len(rows)`) — English `message` must equal today's text
- [ ] T-006-34 [US3] `backend/core/serializers.py` `NotificationSerializer`: `message = serializers.SerializerMethodField()` returning `render(obj.kind, obj.params, obj.message)`; fields list unchanged; read-only
- [ ] T-006-35 [US3] Add Arabic `msgstr` for the 8 templates (all 6 plural forms for the bulk one) to `backend/locale/ar/LC_MESSAGES/django.po`; `compile_catalog`; `pytest -q` green
- [ ] T-006-36 [US3] Extend `frontend/e2e/i18n.spec.ts`: Sara submits a request via API (English), `manager.a` context in Arabic opens the bell → Arabic text contains Sara's name and the title; switch to English → English text

**Checkpoint**: all three stories complete.

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T-006-37 [P] Docs: `docs/database.md` (`Notification.kind`, `params`, change-log row 2026-10-17 for `core/0002`), `docs/api.md` (Accept-Language/Content-Language section linking the contract), `docs/architecture.md` (i18n section: catalogs, `compile_catalog`, committed `.mo`, `LocaleMiddleware`), `README.md` ("Languages" section: switching, adding a string front/back, `npm run i18n:check`, `compile_catalog`, local e2e throttle override)
- [ ] T-006-38 [P] `docs/ai-usage.md`: row for feature 006 (tool, what was generated incl. AI-drafted Arabic text, what was corrected, verification), noting Arabic pending fluent review
- [ ] T-006-39 Full gates from `quickstart.md`: `compile_catalog` (no diff), `makemigrations --check --dry-run`, `pytest -q`, `npm run typecheck`, `npm run i18n:check`, `npm run build`, `npm run test:e2e`
- [ ] T-006-40 Release gate (FR-013, owner: user): fluent Arabic speaker reviews `frontend/src/i18n/locales/ar.json` and `backend/locale/ar/LC_MESSAGES/django.po`; apply corrections, re-run `compile_catalog` + `i18n:check`

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **US1 (P1)** → **US2 (P2)** → **US3 (P3)** → Polish
- US2 depends only on Phase 1 backend tasks (T-006-02..04) and can run in parallel with US1 frontend work; it is placed after US1 for MVP ordering
- US3 depends on US2's catalog/compile infrastructure (T-006-27) and on T-006-19 (bell refetch on language change) for the UI behaviour
- T-006-11 (logical classes) should land before T-006-14/15 to avoid editing the same lines twice
- Within each story: tests first (must fail) → models → services/registry → views/serializers → frontend → e2e

### Parallel Opportunities

- Phase 1: T-006-01, 02, 04, 05, 06 in parallel (T-006-03 after 02)
- Phase 2: T-006-07, 08, 09 in parallel; T-006-10 then T-006-11
- US1: T-006-12 alongside T-006-13; T-006-14 and T-006-15 touch different files
- US2 tests T-006-22/23/24 in parallel; US3 tests T-006-29/30 in parallel
- Backend US2/US3 work can proceed in parallel with frontend US1 work (different trees)

## Implementation Strategy

**MVP = Phases 1–3 (US1)**: the whole UI in Arabic with RTL — demoable alone. Then US2 (server messages), then US3 (notifications). Stop at any checkpoint; each leaves the app shippable with English behaviour unchanged. Do not deploy Arabic publicly before T-006-40.
