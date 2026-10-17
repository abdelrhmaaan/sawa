# Research: Arabic Localization (006)

Facts below were checked against the repo and installed packages on 2026-10-17.

## R1. Frontend translation library

- **Decision**: `i18next@26.4.2` + `react-i18next@17.0.16` + `i18next-browser-languagedetector@8.2.1`, pinned exactly.
- **Rationale**: User choice (react-i18next). It handles plurals (Arabic has 6 forms: zero/one/two/few/many/other), interpolation, and language change events. The versions picked are the newest ones published **at least 7 days before 2026-10-17** (supply-chain rule). `react-i18next@17` needs `i18next >= 26.2` and `react >= 16.8`, so these versions fit together and fit React 19.
- **Alternatives**: an in-house `t()` helper (no plurals or events, so we'd rebuild what the library already does); `react-intl`/FormatJS (heavier, ICU syntax, not chosen by the user).

## R2. Where translations live, and avoiding a flash of the wrong language

- **Decision**: one namespace with nested keys per area (`common`, `nav`, `auth`, `requests`, `timesheets`, `approvals`, `dashboard`, `notifications`, `profile`, `errors`, `status`, `requestType`, `role`). Files are `frontend/src/i18n/locales/en.json` and `ar.json`, **bundled** (imported statically, not fetched). `i18n` is initialized synchronously in `src/i18n/index.ts` and imported in `main.tsx` **before** `createRoot`. Language detection uses **localStorage only** (key `sawa.lang`), caches to localStorage, `fallbackLng: "en"`, `supportedLngs: ["en","ar"]`, `load: "languageOnly"`.
- **Rationale**: bundling means the first render already has the right language and direction (FR-003, no flash). Using localStorage only, with no navigator detection, means a first visit is always English (spec acceptance scenario US1-1). The catalog is a few hundred short strings, a few KB gzipped.
- **Type safety**: `tsconfig` already has `resolveJsonModule: true`, so the `t()` keys are typed from `en.json` through `CustomTypeOptions`. Key parity between `en.json` and `ar.json` can't be checked by types, because Arabic plural keys differ from English ones. So a script, `frontend/scripts/check-i18n.mjs` (`npm run i18n:check`), compares the key sets after removing plural suffixes and fails when Arabic is missing a key (SC-006) or has an extra one.

## R3. Right-to-left layout with Tailwind v4

- **Decision**: on `languageChanged`, set `<html lang dir>` (`ar` → `dir="rtl"`). Replace physical utilities with logical ones throughout `frontend/src`:
  - `ml/mr` → `ms/me`, `pl/pr` → `ps/pe`
  - `left/right` → `start/end`
  - `text-left/right` → `text-start/end`
  - `border-l/r` → `border-s/e`
  - `rounded-l/r/tl/tr/bl/br` → `rounded-s/e/ss/se/es/ee`

  Use the built-in `rtl:` variant only where a logical utility doesn't exist: the slide direction of drawers and off-canvas sidebars (`translate-x-full` → add `rtl:-translate-x-full`), and direction icons (`ChevronRight`, 3 uses, gets `rtl:-scale-x-100`). Purely centring patterns (`left-1/2 -translate-x-1/2`) stay as they are.
- **Rationale**: Tailwind v4 ships logical-property utilities and a `rtl:` variant keyed on `[dir=rtl]`, with no plugin needed. Logical classes make one markup work in both directions, which constitution III now requires.
- **Scale**: a rough count finds about 220 physical-direction class uses across 23 `.tsx` files and 0 logical ones. This is mechanical work but touches every screen, so it gets its own task and a visual RTL pass at 375/768/1280.
- **Alternatives**: a separate RTL stylesheet (double the maintenance); `stylis-plugin-rtl`/CSS flipping (not applicable to utility classes).

## R4. Arabic font

- **Decision**: add `IBM Plex Sans Arabic` (weights 400/500/600/700) to the existing Google Fonts `@import` in `frontend/src/index.css`. Add a token `--font-arabic` in `@theme`, and a rule `html[lang="ar"] body { font-family: var(--font-arabic); }` with Plus Jakarta Sans as the second fallback for Latin text inside Arabic pages.
- **Rationale**: `docs/brand.md` already names this font as the Arabic pair. Plex Arabic has no 800 weight, so `font-extrabold` shows as 700 in Arabic. That's acceptable.

## R5. Dates and numbers

- **Decision**: one helper module `frontend/src/lib/format.ts` (`formatDate`, `formatDateTime`, `formatTime`, `formatHours`). It uses the locale `en` or `ar-u-nu-latn`, where `nu-latn` forces Western digits (FR-012). It replaces the 5 scattered `toLocale*String(undefined, …)` calls: `RequestsPage.tsx:64`, `TimesheetReviewPage.tsx:28`, `TimesheetsPage.tsx:68`, `Timeline.tsx:3`, `NotificationsBell.tsx:14`.
- **Rationale**: those calls follow the browser locale today, not the app language. One helper makes the output consistent and testable.

## R6. Telling the server which language to use

- **Decision**: `apiFetch` (`frontend/src/lib/api.ts`) sends `Accept-Language: <i18n.resolvedLanguage>` on every request. The backend uses Django's `LocaleMiddleware`, with `LANGUAGES = [("en", …), ("ar", …)]` and `LANGUAGE_CODE = "en"`. Unsupported or missing values fall back to English.
- **Rationale**: this matches the user's choice to store the language in the browser only, with no server-side preference. `Accept-Language` is a CORS-safelisted request header, and django-cors-headers allows it by default, so no CORS change is needed. The middleware also sets `Content-Language` and `Vary: Accept-Language` on responses.
- **Middleware order**: `LocaleMiddleware` goes after `SessionMiddleware` and before `CommonMiddleware`, as Django documents.

## R7. Backend message catalog without gettext binaries

- **Finding**: `msgfmt`/`xgettext` are **not installed** locally (and can't be added without sudo). We can't count on them in the Render Python build image either. So `makemessages`/`compilemessages` can't run as-is.
- **Decision**:
  - Keep Django's standard gettext API in code (`gettext`/`gettext_lazy`/`ngettext`) so the setup stays idiomatic.
  - Maintain `backend/locale/ar/LC_MESSAGES/django.po` by hand.
  - Compile it to `django.mo` with a small management command, `python manage.py compile_catalog`. The command uses **`polib`** (pure Python, pinned to a release older than 7 days) and is added to `requirements.txt` next to `pytest-django`.
  - **Commit the `.mo`**, so deploys need no compile step and no gettext binaries.
  - If a developer installs gettext, `makemessages -l ar` keeps working on the same files.
- **Guard tests**: every `.po` entry has a non-empty, non-fuzzy `msgstr`. The committed `.mo` matches the `.po` entry for entry, so a forgotten compile fails CI. Arabic behaviour tests check each user-facing message (US2).
- **Alternatives**: a hand-written Python dictionary instead of gettext (non-standard, and it can't override DRF/SimpleJWT messages); installing gettext in the Render build (not possible on the native Python runtime without Docker).

## R8. Messages from third-party packages

- **Finding**: DRF ships an Arabic catalog, and it works: required field → `هذا الحقل مطلوب.`; throttled → `تم حد الطلب. متوقع التوفر خلال 42 ثواني.`. SimpleJWT also ships `ar`, but **its catalog doesn't load today**, because only `rest_framework_simplejwt.token_blacklist` is in `INSTALLED_APPS`. The login error stays English even under `ar`. Django's own `ar` catalog is present.
- **Decision**: add `"rest_framework_simplejwt"` to `INSTALLED_APPS`. It has no models, so no migrations, and the SimpleJWT docs recommend it for translations. The project `LOCALE_PATHS` catalog takes priority over app catalogs, so it can **override** awkward third-party wording. The throttle message gets a natural Arabic version with correct plural handling of the seconds count.

## R9. Notifications in the reader's language (US3)

- **Decision**:
  - Keep the existing `message` column (English text, kept for older rows and the admin).
  - Add `kind` (a short event code) and `params` (JSON values: actor name, title, date, count).
  - `NotificationSerializer.message` becomes a computed field. If `kind` is known, it renders the catalog template for that kind **in the request's active language**. If not (older rows), it returns the stored `message`.
  - Rendering uses `%`-formatting with a named mapping on **our** template. User values are only ever substituted, never used as a template, so a title containing `%(x)s` or `<script>` comes out literally. The frontend renders text through React, so no HTML injection is possible.
- **Rationale**: the reader's language is only known when the notification is read, through `Accept-Language`. Rendering on the server keeps every user-facing string in one backend catalog (constitution: API messages must be translatable). The API shape doesn't change (`message` stays a string), so the frontend needs no change for US3.
- **Alternatives**: storing one message per language at creation time (doesn't scale, and new languages would need backfills); having the frontend translate from `kind` + `params` (splits notification text across two catalogs).

## R10. Status and type labels

- **Decision**:
  - **Backend:** `TextChoices` labels become `gettext_lazy`. They're used in workflow error messages ("Cannot change status from %(from)s to %(to)s") so status names show up translated.
  - **Frontend:** labels (`requestTypeLabels` in `lib/types.ts`, `roleLabels` in `Shell.tsx`, the status label arrays in `DashboardPage.tsx`, `StatusBadge` in `components/ui.tsx`) come from the `status.*`, `requestType.*` and `role.*` keys.
- **Check**: lazy labels with the same English text must **not** produce a migration. This is verified with `makemigrations --check --dry-run` (the gate in quickstart).
