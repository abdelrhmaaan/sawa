# Implementation Plan: Timesheets

**Branch**: `004-timesheets` | **Date**: 2026-10-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-timesheets/spec.md`. Depends on `002-authentication-rbac` (scaffold, `core` permissions/pagination, auth, seed). Mirrors the `003-employee-requests` patterns (scoped ViewSet, `@action` transitions, history rows).

## Summary

`timesheets` Django app: `TimesheetEntry` + `TimesheetStatusHistory` models, per-entry state machine (draft|returned→submitted→approved|returned), server-computed `hours`, overlap/future-date validation, atomic bulk submit, scoped ViewSet + filters, and React pages (my timesheets grouped by date/week with totals, fast entry form, manager review with approve/return dialog).

## Technical Context

**Language/Version**: Python 3.10 · TypeScript / React 19

**Primary Dependencies**: Django 5.2 LTS, DRF, django-filter, drf-spectacular; react-router + `lib/api.ts` + design system (`ui.tsx`, `overlays.tsx`, `shell/Shell.tsx`)

**Storage**: PostgreSQL 16 (from 002); migrations only

**Testing**: pytest-django; tests-first incl. ≥1 attack test per story

**Target Platform**: Linux server (gunicorn+whitenoise); browsers 375/768/1280 — entry form optimized for mobile

**Project Type**: web application

**Performance Goals**: local p95 < 500 ms; list paginated; hours aggregation server-side-friendly

**Constraints**: status per entry (no weekly header); submitted/approved read-only; atomic bulk submit

**Scale/Scope**: 2 models, 1 ViewSet (~10 actions incl. bulk), 3 frontend screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|---|---|---|
| I. Product Scope Discipline | PASS | mvp-scope modules 5–6; no weekly header, no overtime rules |
| II. UX State Completeness | PASS | <2-min mobile time logging is an explicit task + SC-001 |
| III. Design System First | PASS | screens compose `ui.tsx`/`overlays.tsx` |
| IV. Server-Side Authority | PASS | `hours` computed server-side; all scoping in `get_queryset()` |
| V. Migration-Only Schema | PASS | two models via migrations; recorded in `docs/database.md` |
| VI. Security by Default | PASS | 404 out-of-scope; 403 role-forbidden; 400 invalid state |
| VII. Tested Critical Flows | PASS | attack tests per story (T-004-09, T-004-17, T-004-22/23) |

Post-design re-check: unchanged — PASS.

## Project Structure

### Documentation (this feature)

```text
specs/004-timesheets/
├── spec.md
├── plan.md                # this file (data model + endpoints inline)
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/timesheets/
├── models.py              # TimesheetEntry, TimesheetStatusHistory
├── serializers.py         # EntrySerializer (hours read-only), BulkSubmitSerializer, DecisionSerializer
├── views.py               # TimesheetEntryViewSet + @actions + bulk submit
├── filters.py             # FilterSet
├── urls.py                # router
└── tests/                 # test_crud_validation.py, test_submit.py, test_review_visibility.py
frontend/src/pages/
├── TimesheetsPage.tsx     # my entries grouped by date/week + total hours
├── TimesheetEntryForm.tsx # create/edit entry (mobile-first, <2 min)
└── TimesheetReviewPage.tsx# pending_my_action review + approve/return dialog
frontend/src/lib/api.ts    # add timesheets API helpers
```

**Structure Decision**: Same shape as `employee_requests` — single app, history beside the entry model, FilterSet for filters. Frontend reuses shell + ui kit only.

## Data Model (Phase 1, inline)

### `timesheets.TimesheetEntry`

| Field | Type | Rules |
|---|---|---|
| owner | FK → `accounts.User`, PROTECT | server-set; never client-writable |
| date | DateField | required; `date <= today` |
| start_time / end_time | TimeField | `end_time > start_time`; no overnight |
| hours | DecimalField(4,2) | computed server-side on save; read-only |
| note | CharField(500) blank | optional |
| status | choices `draft`/`submitted`/`approved`/`returned` | default `draft`; transitions via actions only |
| created_at / updated_at | auto | |
| submitted_at / reviewed_at | DateTime null | set on submit / approve / return |

### `timesheets.TimesheetStatusHistory`

Same shape as request history: `entry` FK CASCADE related `history`, `actor` FK PROTECT, `from_status` null, `to_status`, `comment`, `created_at`.

### Validation (serializer `validate()` + model `clean()`)

- `end_time > start_time` → else 400
- `date` not in the future → else 400
- No overlap with the owner's other entries on same `date`: `NOT (end <= other.start OR start >= other.end)`; exclude self on update → else 400
- `hours` = (end − start) in hours, `Decimal(4,2)` — computed in `save()`/serializer, read-only

### State machine

```text
create → draft
draft | returned → submitted        (owner; single or bulk atomic)
submitted → approved | returned     (approver: owner's manager, else HR; HR any; never self)
approved → FINAL
returned → editable like draft → submitted …
```

- `return` requires non-empty comment → else 400; `approve` comment optional.
- Edit: owner only, `draft|returned`; submitted/approved → 400. Delete: `draft` only.

### Visibility (`get_queryset()`) — same rule as 003

```text
employee: owner=self · manager: own + reports' non-draft · hr: own + all non-draft
out-of-scope → 404 · role-forbidden on visible → 403 · bad state/input → 400
```

## API Endpoints (Phase 1, inline)

Base `/api/timesheets/`:

| Method | Path | Behaviour |
|---|---|---|
| GET | `/api/timesheets/` | scoped list; filters `status`, `owner`, `date_from`, `date_to`, `pending_my_action=true`; ordering `date`,`status` (default `-date`); pagination 20/`page_size`≤100 |
| POST | `/api/timesheets/` | create draft; owner/server fields forced; validation per above |
| GET | `/api/timesheets/{id}/` | detail incl. ordered history timeline |
| PUT/PATCH | `/api/timesheets/{id}/` | owner + draft/returned only |
| DELETE | `/api/timesheets/{id}/` | owner + draft only |
| POST | `/api/timesheets/{id}/submit/` | owner, draft/returned → submitted |
| POST | `/api/timesheets/submit/` | bulk `{"ids":[...]}` — atomic: every id must be caller's own draft/returned else **400** and nothing changes |
| POST | `/api/timesheets/{id}/approve/` | approver on submitted; sets `reviewed_at`; comment optional |
| POST | `/api/timesheets/{id}/return/` | approver on submitted; `comment` required → 400; sets `reviewed_at`; unlocks editing |

Approver rule identical to 003 via `core.permissions.get_approver`.

**Seed**: extend `seed_demo` with a week of entries per demo employee in varied statuses (draft, submitted, approved, returned).

## Decisions

- Bulk submit is a **collection-level** `POST /api/timesheets/submit/` (`detail=False`, placed so the router doesn't treat `submit` as a pk); wraps `transaction.atomic()` — validate ALL ids first, then transition.
- Overlap check runs in serializer `validate()` scoped to `owner`+`date`, excluding `self.instance` on update.
- `hours` computed in model `save()` (keeps API and admin consistent); serializer marks it read-only.
- List response can include a `total_hours` aggregate for the filtered page/queryset — used by the "total" UI; implemented as an extra key, not a field.
- `reviewed_at` set on both approve and return (it records "when the approver last acted").
- No `research.md`/`contracts/`/`quickstart.md` — decisions inline per brief.

## Complexity Tracking

No constitution violations — nothing to justify.
