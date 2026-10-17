# Data Model: Arabic Localization (006)

This feature has one schema change. It only adds fields: nothing is dropped and no field type changes. It is recorded in `docs/database.md` (constitution V).

## `core.Notification`: extended

| Field | Type | Change | Notes |
|---|---|---|---|
| `id` | BigAuto PK | — | |
| `user` | FK → User, CASCADE | — | recipient |
| `message` | Char(300) | — (meaning kept) | English text written at creation. Older rows only have this. Shown when `kind` is empty or unknown |
| `link` | Char(200), blank | — | frontend route |
| `is_read` | Bool, default False | — | |
| `created_at` | DateTime auto | — | |
| **`kind`** | Char(40), blank, default `""` | **new** | event code from the registry below; `""` = older row |
| **`params`** | JSON, default `dict`, blank | **new** | values substituted into the template; user-entered values are stored as typed |

**Migration**: `core/migrations/0002_notification_kind_params.py`. It contains two `AddField` operations with defaults. Existing rows get `kind=""` and `params={}` and keep showing their stored `message` (FR-010). It's reversible and keeps all data.

### Event registry (`kind` → params → English template)

| `kind` | params | English template (msgid) | Created by |
|---|---|---|---|
| `request_submitted` | `actor`, `title` | `%(actor)s submitted "%(title)s" for approval.` | request submit → approver(s) |
| `request_approved` | `title` | `Your request "%(title)s" was approved.` | request approve → owner |
| `request_rejected` | `title` | `Your request "%(title)s" was rejected.` | request reject → owner |
| `request_returned` | `title` | `Your request "%(title)s" was returned.` | request return → owner |
| `timesheet_submitted` | `actor`, `date` | `%(actor)s submitted a timesheet entry for %(date)s.` | single entry submit → approver(s) |
| `timesheet_bulk_submitted` | `actor`, `count` | singular `%(actor)s submitted %(count)d timesheet entry for review.` / plural `…%(count)d timesheet entries…` (`ngettext`) | bulk submit → approver(s) |
| `timesheet_approved` | `date` | `Your timesheet entry for %(date)s was approved.` | entry approve → owner |
| `timesheet_returned` | `date` | `Your timesheet entry for %(date)s was returned.` | entry return → owner |

The English templates match today's stored texts exactly, so existing English tests and UI don't change. `date` is stored as ISO `YYYY-MM-DD` (Western digits, FR-012).

### Validation and behaviour rules

- `notify(user, kind, params, link)` checks that `kind` is in the registry, renders the **English** text with `translation.override("en")`, cuts it to 300 characters for `message`, and saves `kind` and `params` as given.
- At read time the template for `kind` is rendered in the active request language. A missing param or an unknown `kind` falls back to the stored `message`; it never raises an error.
- Params are only ever substituted into our own templates, never used as a template themselves.

## Non-persistent entities

- **Language preference**: browser `localStorage["sawa.lang"]`, either `"en"` or `"ar"`; anything else is ignored and falls back to `"en"`. It is not stored on the server.
- **Translation catalogs**:
  - Frontend: `frontend/src/i18n/locales/{en,ar}.json`. Must have the same keys, apart from plural suffixes (`npm run i18n:check`).
  - Backend: `backend/locale/ar/LC_MESSAGES/django.{po,mo}`. English is the source text, so it needs no catalog.
