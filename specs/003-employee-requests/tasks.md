# Tasks: Employee Requests

**Input**: Design documents from `/specs/003-employee-requests/` (spec.md, plan.md)

**Prerequisites**: `002-authentication-rbac` complete (scaffold, `core` permissions/pagination, auth, seed users)

**Commit rule**: Every commit message must include the task ID(s) (e.g. `T-003-05`).

**Organization**: Tasks grouped by user story (US1/US2/US3 from spec.md) for independent implementation and testing.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

## Phase 1: Setup (Shared Infrastructure)

- [x] T-003-01 Create `backend/employee_requests/` app (models, serializers, views, filters, urls, tests package) and register it in `INSTALLED_APPS` in `backend/config/settings.py`
- [x] T-003-02 [P] Add requests API helpers to `frontend/src/lib/api.ts` (list/create/get/update/submit/decide calls typed against the endpoints in plan.md)

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: models + scoped queryset + history helper must exist before any story.

- [x] T-003-03 Implement `Request` in `backend/employee_requests/models.py`: `owner` FK→User PROTECT, `type` TextChoices `leave`/`equipment`/`wfh`/`hr_service`/`general`, `title` max 200 required, `description` required, `status` choices `draft`/`submitted`/`approved`/`rejected`/`returned` default `draft`, `created_at`, `updated_at`, `submitted_at`, `decided_at`; `makemigrations`
- [x] T-003-04 Implement `RequestStatusHistory` in `backend/employee_requests/models.py` (`request` FK CASCADE related `history`, `actor` FK→User PROTECT, `from_status` null, `to_status`, `comment`, `created_at`) + `write_history(request, actor, from_status, to_status, comment)` helper called inside the same transaction as every transition
- [x] T-003-05 Implement scoped queryset helper in `backend/employee_requests/views.py` (or shared `core/`): employee→own; manager→own + direct reports' non-draft; hr→own + all non-draft (drafts private to owner)
- [x] T-003-06 Extend `seed_demo` (`backend/accounts/management/commands/seed_demo.py`) to create a few requests per demo employee across `draft`, `submitted`, `approved`, `returned` — idempotent

**Checkpoint**: models migrated, scoped queryset returns correct rows for each role, seeds exist.

## Phase 3: User Story 1 — Create, edit, and submit a request (P1) 🎯 MVP

**Goal**: Full draft lifecycle — create, edit, delete, submit, resubmit after return.

**Independent Test**: employee creates draft → edits → submits → edit refused (400); returned → editable → resubmittable.

### Tests for User Story 1 — write FIRST, ensure they FAIL

- [x] T-003-07 [P] [US1] CRUD tests in `backend/employee_requests/tests/test_crud.py`: create defaults owner=caller + status=draft; client-sent `owner`/`status` ignored; owner PATCH on draft/returned works; DELETE draft works
- [x] T-003-08 [P] [US1] State tests in `test_crud.py`: submit draft→submitted sets `submitted_at` + history row; submit on submitted/approved → 400; edit submitted → 400; delete submitted → 400; returned→edit→submit works
- [x] T-003-09 [P] [US1] Attack tests in `test_crud.py`: employee GET/PATCH/DELETE another employee's request → 404; visible non-owner (manager viewing report's submitted request) PATCH → 403 or 400 per contract; unauthenticated → 401
- [x] T-003-10 [P] [US1] History test in `test_crud.py`: create writes a history row with `from_status=null`, `to_status=draft`, actor=owner

### Implementation for User Story 1

- [x] T-003-11 [US1] `RequestSerializer` in `backend/employee_requests/serializers.py`: `owner`, `status`, `submitted_at`, `decided_at`, timestamps read-only; validate `title` ≤200 non-empty, `description` required, `type` in choices
- [x] T-003-12 [US1] `RequestViewSet` in `backend/employee_requests/views.py` + `backend/employee_requests/urls.py` router mounted under `/api/` in `backend/config/urls.py`: scoped `get_queryset()`; `perform_create` sets owner + writes create history row; update restricted to owner + draft/returned (else 400; visible non-owner → 403); destroy owner + draft only
- [x] T-003-13 [US1] `submit` `@action` in `backend/employee_requests/views.py`: owner only (visible non-owner → 403), `draft|returned`→`submitted`, sets `submitted_at`, writes history — one transaction; wrong state → 400
- [x] T-003-14 [US1] `frontend/src/pages/RequestsPage.tsx`: my requests list (type, title, status badge, created date), pagination controls; loading/empty/error states
- [x] T-003-15 [P] [US1] `frontend/src/pages/RequestFormPage.tsx`: create/edit form (type select, title ≤200, description textarea) — edit route only offered for draft/returned
- [x] T-003-16 [US1] `frontend/src/pages/RequestDetailPage.tsx`: detail + owner affordances (edit/delete draft, submit); delete uses a confirm dialog from `overlays.tsx`; wire routes in `App.tsx` + nav in `shell/Shell.tsx`

**Checkpoint**: employee draft→submit flow works end-to-end; attack tests green.

## Phase 4: User Story 2 — Approve, reject, or return a request (P2)

**Goal**: Approver actions with comment rules; decisions and history recorded atomically.

**Independent Test**: manager approves a report's submitted request; reject/return without comment → 400; owner/foreign manager blocked.

### Tests for User Story 2 — write FIRST, ensure they FAIL

- [x] T-003-17 [P] [US2] Action tests in `backend/employee_requests/tests/test_actions.py`: approve/reject/return on submitted by the right approver → 200 + status + `decided_at` (approve/reject) + history row with comment
- [x] T-003-18 [P] [US2] Rule tests in `test_actions.py`: reject/return without comment → 400; actions on non-submitted status → 400; owner acting on own request → 403 (incl. HR acting on own); HR acts on any submitted not-own → 200; approved/rejected are final
- [x] T-003-19 [P] [US2] Attack test in `test_actions.py`: manager A approve/reject/return on manager B's report's request → 404; owner with no manager → approver resolves to HR

### Implementation for User Story 2

- [x] T-003-20 [US2] Approver check in `backend/employee_requests/views.py` via `core.permissions.get_approver(owner)`: caller == owner's manager, or HR when owner has no manager, or HR on any submitted — and caller ≠ owner (else 403)
- [x] T-003-21 [US2] `approve`/`reject`/`return` `@action`s + `DecisionSerializer` in `backend/employee_requests/serializers.py` (comment required non-empty for reject/return → 400; optional for approve); set `decided_at` on approve/reject; history row in same transaction
- [x] T-003-22 [US2] `frontend/src/pages/ApprovalsPage.tsx`: `pending_my_action` queue; approve/reject/return dialog from `overlays.tsx` enforcing comment on reject/return; loading/empty/error states; nav entry gated to manager/HR

**Checkpoint**: manager can decide; every decision lands in history with actor + comment.

## Phase 5: User Story 3 — Track requests and browse with filters (P3)

**Goal**: Scoped lists with filters/ordering/pagination; detail timeline; per-role list contents verified.

**Independent Test**: compare list payloads per role; apply each filter + ordering; detail shows ordered timeline.

### Tests for User Story 3 — write FIRST, ensure they FAIL

- [x] T-003-23 [P] [US3] Visibility tests in `backend/employee_requests/tests/test_visibility_filters.py`: employee sees only own; manager sees own + reports' non-draft (report's draft → absent and GET → 404); HR sees all non-draft + own drafts
- [x] T-003-24 [P] [US3] Filter tests in `test_visibility_filters.py`: `status`, `type`, `owner`, `created_after`/`created_before`, `pending_my_action=true` (submitted + caller is approver); filters only narrow scope — `owner=<other>` returns empty for an employee
- [x] T-003-25 [P] [US3] Ordering/pagination tests in `test_visibility_filters.py`: `ordering=created_at|updated_at|status`, default `-created_at`; `page_size>100` clamps; out-of-range page → empty results
- [x] T-003-26 [P] [US3] Timeline test in `test_visibility_filters.py`: detail embeds history ordered by `created_at` with actor, from/to status, comment

### Implementation for User Story 3

- [x] T-003-27 [US3] `RequestFilter` in `backend/employee_requests/filters.py` (`status`, `type`, `owner`, `created_after`, `created_before`, `pending_my_action`) + `OrderingFilter` fields + `StandardPagination` on the ViewSet
- [x] T-003-28 [US3] Embed ordered `history` (nested serializer) in the detail response in `backend/employee_requests/serializers.py`
- [x] T-003-29 [US3] Filter bar (status/type/owner/date range) + sort control + pagination on `frontend/src/pages/RequestsPage.tsx`; manager "mine / team" toggle using `owner=me`
- [x] T-003-30 [P] [US3] Status timeline component on `frontend/src/pages/RequestDetailPage.tsx` (actor, from→to, comment, timestamp; ui kit only)

**Checkpoint**: all three role lists match the permission matrix; every filter verified by tests.

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T-003-31 [P] Update `docs/api.md` permission matrix + endpoint rows for `/api/requests/*`; update `docs/database.md` with Request/RequestStatusHistory
- [x] T-003-32 [P] Add drf-spectacular tags/descriptions for request endpoints so `/api/docs/` reads cleanly
- [x] T-003-33 [P] UX states + responsive pass (375/768/1280) on request screens (constitution II/III)
- [x] T-003-34 Run full `pytest` green; manual smoke on seeded data: submit → manager approves → timeline shows both events
- [x] T-003-35 Log AI usage for this feature in `docs/ai-usage.md`

---

## Dependencies & Execution Order

- Foundational (T-003-03..06) blocks everything; US1 → US2 → US3 sequential (each builds on prior endpoints/UI)
- Tests first within each story; models → serializers → viewset/actions → frontend
- US3 filters need US1's ViewSet; approvals UI (T-003-22) needs US2 actions

### Parallel Opportunities

- T-003-02 parallel with all backend foundational work
- Within each story, all test tasks ([P]) in parallel; T-003-15 parallel with T-003-14/16

## Implementation Strategy

**MVP first**: Phases 1–3 deliver create→submit alone. US2 adds decisions, US3 adds browsing. If the schedule slips, ship with tests green before polishing.
