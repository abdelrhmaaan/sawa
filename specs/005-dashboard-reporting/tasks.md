# Tasks: Dashboard & (Optional) Notifications

**Input**: Design documents from `/specs/005-dashboard-reporting/` (spec.md, plan.md)

**Prerequisites**: `002-authentication-rbac`, `003-employee-requests`, `004-timesheets` (scoped querysets + transitions)

**Commit rule**: Every commit message must include the task ID(s) (e.g. `T-005-03`).

**Organization**: US1 = dashboard (P1, must ship); US2 = notifications (P2, **OPTIONAL** — only if Sunday 4 Oct is on schedule by 18:00, per `docs/plan.md` §0.4).

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

## Phase 1: Setup

- [x] T-005-01 Extract reusable scoped-queryset helpers (requests + timesheets) into `backend/core/` so `views.py` aggregates never touch `objects.all()` — refactor only, no behavior change
- [x] T-005-02 [P] Add dashboard + notifications API helpers to `frontend/src/lib/api.ts`

## Phase 2: Foundational

- [x] T-005-03 Register `GET /api/dashboard/` and `notifications/` routes in `backend/core/views.py` + `backend/config/urls.py`

**Checkpoint**: endpoints wired, returning stubs — story work can start.

## Phase 3: User Story 1 — Role-shaped dashboard summary (P1) 🎯 MVP

**Goal**: `GET /api/dashboard/` returns `{my_requests, my_entries, my_hours_this_week}` for all roles, `+team{...}` for manager, `+org{...}` for hr; `DashboardPage` renders `StatCard`s + quick actions as `/`.

**Independent Test**: sign in as each role on seeded data; payload sections and numbers match visibility rules.

### Tests for User Story 1 — write FIRST, ensure they FAIL

- [x] T-005-04 [P] [US1] Payload-shape tests in `backend/core/tests/test_dashboard.py`: employee payload has exactly `my_requests`/`my_entries`/`my_hours_this_week` (no `team`/`org` keys); manager adds `team{pending_requests,pending_timesheets,team_hours_this_week}`; hr adds `org{pending_requests,pending_timesheets,hours_this_week,users_by_role}`
- [x] T-005-05 [P] [US1] Numbers tests in `test_dashboard.py`: own drafts count in `my_*`; `team` pending = only submitted items the caller may approve (direct reports); `team_hours_this_week` = reports' non-draft entries this ISO week; hr `org` pending excludes HR's own items; `my_hours_this_week` sums all own entries this week regardless of status
- [x] T-005-06 [P] [US1] Attack test in `test_dashboard.py`: with pending items under manager B, manager A's `team` numbers exclude them entirely; unauthenticated → 401

### Implementation for User Story 1

- [x] T-005-07 [US1] Implement the aggregate in `backend/core/views.py` using the scoped helpers (T-005-01): status `Count` groups for own items; `Sum(hours)` filtered to ISO-week Mon–Sun; role-gated `team`/`org` sections omitted (not empty) for lower roles
- [x] T-005-08 [US1] `frontend/src/pages/DashboardPage.tsx`: `StatCard`s per returned section + quick actions (New request → `/requests/new`, Log time → `/timesheets/new`, Approvals → `/approvals` for manager/HR); loading/empty/error states; make it the `/` route in `App.tsx`

**Checkpoint**: each role sees correct, scope-safe numbers on `/`.

## Phase 4: User Story 2 — In-app notifications (P2 — OPTIONAL)

**⚠️ OPTIONAL STORY — implement only if Sunday 4 Oct is on schedule by 18:00 (`docs/plan.md` §0.4). Safe to skip entirely; nothing else depends on it.**

**Goal**: `Notification` model; creation inside 003/004 transition transactions; list/read endpoints; bell with unread badge in Shell.

**Independent Test**: submit → approver's bell unread+1; approve → owner's feed grows; other user's notification id → 404.

### Tests for User Story 2 — write FIRST, ensure they FAIL

- [x] T-005-09 [P] [US2] Creation tests in `backend/core/tests/test_notifications.py`: request submit notifies approver (no manager → all HR users); approve/reject/return notifies owner; same coverage for timesheet transitions
- [x] T-005-10 [P] [US2] Endpoint tests in `test_notifications.py`: list = own only, unread first, paginated, includes `unread_count`; `POST {id}/read/` marks read; `POST read-all/` clears all
- [x] T-005-11 [P] [US2] Attack test in `test_notifications.py`: GET/read another user's notification id → 404; unauthenticated → 401

### Implementation for User Story 2

- [x] T-005-12 [US2] `Notification` model in `backend/core/models.py` (`user` FK CASCADE, `message` ≤300, `link`, `is_read` default False, `created_at`) + `core.notify(user, message, link)` helper; `makemigrations`
- [x] T-005-13 [US2] Call `core.notify` inside the existing transition transactions in `backend/employee_requests/views.py` and `backend/timesheets/views.py` (submit → approver / all HR; approve·reject·return → owner)
- [x] T-005-14 [US2] `NotificationSerializer` + views in `backend/core/views.py`: own-scoped queryset (unread first), `{id}/read/` and `read-all/` actions, `unread_count` in list response
- [x] T-005-15 [US2] Bell with unread badge + dropdown list in `frontend/src/shell/Shell.tsx`; mark-read on click; link navigates to the item

**Checkpoint**: notifications fire on every transition; unread badge accurate.

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T-005-16 [P] Update `docs/api.md` (dashboard + notifications rows, permission matrix) and `docs/database.md` (`Notification` model, marked optional)
- [x] T-005-17 [P] UX states + responsive pass (375/768/1280) on `DashboardPage.tsx`
- [x] T-005-18 Run full `pytest` green; smoke: each role's dashboard on seeded data
- [ ] T-005-19 Log AI usage for this feature in `docs/ai-usage.md`

---

## Dependencies & Execution Order

- T-005-01 refactor blocks T-005-07; US1 fully independent of US2 (which is optional/skippable)
- US2 depends on 003/004 transition code existing; cut it first if the schedule slips

### Parallel Opportunities

- T-005-02 parallel with T-005-01; all test tasks ([P]) in parallel within each story; T-005-08 parallel with T-005-07

## Implementation Strategy

**MVP = US1 only.** Ship the dashboard; start US2 only if ahead of schedule — the brief marks the whole story optional.
