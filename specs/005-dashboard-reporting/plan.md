# Implementation Plan: Dashboard & (Optional) Notifications

**Branch**: `005-dashboard-reporting` | **Date**: 2026-10-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-dashboard-reporting/spec.md`. Depends on 002–004 (auth, `core` permissions/pagination, Request, TimesheetEntry, history).

## Summary

One aggregate endpoint `GET /api/dashboard/` returning a role-shaped payload computed from the same scoped querysets as 003/004, plus a `DashboardPage` of `StatCard`s as the `/` route. Optional story: `Notification` model + list/read endpoints wired into the 003/004 transition transactions, with a bell in the Shell.

## Technical Context

**Language/Version**: Python 3.10 · TypeScript / React 19

**Primary Dependencies**: Django 5.2 LTS, DRF; react-router, `lib/api.ts`, design system (`ui.tsx` `StatCard`, `overlays.tsx`, `shell/Shell.tsx`)

**Storage**: PostgreSQL 16; `Notification` via migration (optional story)

**Testing**: pytest-django; tests-first incl. attack test per story

**Target Platform**: same as 002–004

**Project Type**: web application

**Performance Goals**: dashboard < 2 s on seeded data; aggregate queries only (no N+1)

**Constraints**: aggregates MUST reuse the scoped querysets — never `objects.all()`

**Scale/Scope**: 1 endpoint + optional 3 endpoints + 1 model; 1 page + shell bell

## Constitution Check

| Principle | Status | Evidence |
|---|---|---|
| I. Product Scope Discipline | PASS | reduced scope per §0.3; reports/CSV/activity analytics cut and recorded in spec |
| II. UX State Completeness | PASS | dashboard carries loading/empty/error; quick actions |
| III. Design System First | PASS | `StatCard` + shell only |
| IV. Server-Side Authority | PASS | payload sections omitted by role server-side |
| V. Migration-Only Schema | PASS | `Notification` ships in a migration; recorded in `docs/database.md` |
| VI. Security by Default | PASS | notification detail out-of-scope → 404; counts never widen scope |
| VII. Tested Critical Flows | PASS | attack tests: cross-team dashboard counts (T-005-06), other user's notification 404 (T-005-14) |

Post-design re-check: unchanged — PASS.

## Project Structure

### Documentation (this feature)

```text
specs/005-dashboard-reporting/
├── spec.md
├── plan.md                # this file (data model + endpoints inline)
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/core/
├── views.py               # GET /api/dashboard/ aggregate
├── serializers.py         # (optional) NotificationSerializer
├── models.py              # (optional) Notification
└── tests/                 # test_dashboard.py, test_notifications.py
frontend/src/
├── pages/DashboardPage.tsx  # StatCards + quick actions — becomes /
└── shell/Shell.tsx          # (optional) notification bell + unread badge
```

**Structure Decision**: aggregates and notifications live in the existing `core` app — no new Django app for one endpoint / one small model; `core` already owns cross-cutting plumbing.

## Data Model (Phase 1, inline)

### `core.Notification` *(optional — US2 only)*

| Field | Type | Rules |
|---|---|---|
| user | FK → `accounts.User`, CASCADE, related `notifications` | recipient |
| message | CharField(300) | e.g. "Your request 'X' was returned" |
| link | CharField(200) | frontend route, e.g. `/requests/12` |
| is_read | bool | default `False` |
| created_at | auto_add | ordering: unread first, then newest |

Creation rules (same transaction as the transition):
- submit → approver = `get_approver(owner)`; if owner has no manager → **all HR users**
- approve / reject / return → `owner`

### Dashboard payload (computed — no model)

```text
employee: { my_requests: {status: n}, my_entries: {status: n}, my_hours_this_week: d }
manager : + team: { pending_requests, pending_timesheets, team_hours_this_week }
hr      : + org:  { pending_requests, pending_timesheets, hours_this_week, users_by_role }
```

- `my_*`: own items incl. drafts (own drafts are visible to owner).
- `team`/`org` pending = `submitted` items where caller is a valid approver (manager → direct reports; HR → all non-own). Team/org hours = non-draft entries only.
- `this_week` = current ISO week Mon–Sun, server-local; `users_by_role` = counts of all users by `role`.

## API Endpoints (Phase 1, inline)

| Method | Path | Access | Behaviour |
|---|---|---|---|
| GET | `/api/dashboard/` | authenticated | role-shaped payload above; employee gets no `team`/`org` keys; 401 unauthenticated |
| GET | `/api/notifications/` *(opt)* | own only | unread-first ordering, page-number pagination (20/`page_size`≤100), `unread_count` in response |
| POST | `/api/notifications/{id}/read/` *(opt)* | owner | marks read; other user's id → **404** |
| POST | `/api/notifications/read-all/` *(opt)* | owner scope | marks all caller's notifications read |

## Decisions

- Aggregates reuse `get_queryset()` scoping from `employee_requests`/`timesheets` viewsets (extracted helpers) — the 404/scope rules cannot drift.
- `team_hours_this_week` counts **non-draft** report entries (manager never sees drafts, so drafts can't be summed).
- `my_hours_this_week` sums **all own entries regardless of status** (drafts are the owner's own visible data) — brief's chosen resolution.
- HR `org` pending excludes HR's own items (nobody acts on own).
- Notifications written via a `core.notify(user, message, link)` helper called inside the existing transition transactions in 003/004 views.
- No `research.md`/`contracts/`/`quickstart.md` — decisions inline per brief.

## Complexity Tracking

No constitution violations — nothing to justify.
