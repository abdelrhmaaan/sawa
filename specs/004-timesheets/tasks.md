# Tasks: Timesheets

**Input**: Design documents from `/specs/004-timesheets/` (spec.md, plan.md)

**Prerequisites**: `002-authentication-rbac` complete; patterns mirrored from `003-employee-requests` (scoped ViewSet, `@action` transitions, history rows)

**Commit rule**: Every commit message must include the task ID(s) (e.g. `T-004-05`).

**Organization**: Tasks grouped by user story (US1/US2/US3 from spec.md) for independent implementation and testing.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T-004-01 Create `backend/timesheets/` app (models, serializers, views, filters, urls, tests package) and register in `INSTALLED_APPS` in `backend/config/settings.py`
- [ ] T-004-02 [P] Add timesheets API helpers to `frontend/src/lib/api.ts` (list/create/get/update/submit/bulk-submit/approve/return)

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: models + validation + scoped queryset + history helper must exist before any story.

- [ ] T-004-03 Implement `TimesheetEntry` in `backend/timesheets/models.py`: `owner` FK→User PROTECT, `date`, `start_time`, `end_time`, `hours` Decimal(4,2) computed in `save()`, `note` CharField(500) blank, `status` choices `draft`/`submitted`/`approved`/`returned` default `draft`, `created_at`/`updated_at`/`submitted_at`/`reviewed_at`; `makemigrations`
- [ ] T-004-04 Implement `TimesheetStatusHistory` in `backend/timesheets/models.py` (same shape as request history) + `write_history(entry, actor, from_status, to_status, comment)` called inside the same transaction as every transition
- [ ] T-004-05 Implement scoped queryset helper in `backend/timesheets/views.py` (or shared `core/`): employee→own; manager→own + direct reports' non-draft; hr→own + all non-draft (drafts private to owner)
- [ ] T-004-06 Extend `seed_demo` (`backend/accounts/management/commands/seed_demo.py`): a week of entries per demo employee across `draft`/`submitted`/`approved`/`returned` — idempotent

**Checkpoint**: models migrated; scoping + seeds verified at ORM level.

## Phase 3: User Story 1 — Log and manage daily time entries (P1) 🎯 MVP

**Goal**: Draft entry CRUD with server-computed hours and full validation (times, future date, overlap).

**Independent Test**: create entry → hours computed; reversed times / future date / overlapping range each → 400; draft editable & deletable.

### Tests for User Story 1 — write FIRST, ensure they FAIL

- [ ] T-004-07 [P] [US1] CRUD tests in `backend/timesheets/tests/test_crud_validation.py`: create → `draft`, owner=caller, `hours` computed and read-only (client-sent `hours`/`owner`/`status` ignored); owner PATCH/DELETE on draft works
- [ ] T-004-08 [P] [US1] Validation tests in `test_crud_validation.py`: `end_time <= start_time` → 400; future `date` → 400; overlapping range vs owner's other entry same date → 400 (incl. update excluding self); `note` >500 → 400
- [ ] T-004-09 [P] [US1] Boundary tests in `test_crud_validation.py`: adjacent entries (`end == other.start`) allowed; overlap check compares only the same owner's same date
- [ ] T-004-10 [P] [US1] Attack test in `test_crud_validation.py`: employee GET/PATCH/DELETE another employee's entry → 404; unauthenticated → 401

### Implementation for User Story 1

- [ ] T-004-11 [US1] `TimesheetEntrySerializer` in `backend/timesheets/serializers.py`: `owner`/`status`/`hours`/timestamps read-only; `validate()` enforces `end_time > start_time`, `date <= today`, overlap `NOT (end <= other.start OR start >= other.end)` excluding `self.instance`, `note` ≤500
- [ ] T-004-12 [US1] `TimesheetEntryViewSet` in `backend/timesheets/views.py` + `backend/timesheets/urls.py` router mounted under `/api/` in `backend/config/urls.py`: scoped `get_queryset()`; `perform_create` sets owner + create history row; update owner + draft/returned only (else 400; visible non-owner → 403); destroy owner + draft only
- [ ] T-004-13 [P] [US1] `frontend/src/pages/TimesheetEntryForm.tsx`: mobile-first create/edit form (date, start, end, note ≤500, live hours preview) — completable in <2 min at 375px
- [ ] T-004-14 [US1] `frontend/src/pages/TimesheetsPage.tsx`: my entries grouped by date (or week view) with per-day + total hours, status badges, edit/delete for drafts; loading/empty/error states; routes + nav in `App.tsx`/`Shell.tsx`

**Checkpoint**: logging + editing drafts works end-to-end; invalid entries rejected; attack tests green.

## Phase 4: User Story 2 — Submit entries for review (P2)

**Goal**: Single + atomic bulk submit; submitted entries read-only; returned entries re-editable.

**Independent Test**: submit one; bulk-submit several; a batch containing a foreign or wrong-state id fails with zero changes.

### Tests for User Story 2 — write FIRST, ensure they FAIL

- [ ] T-004-15 [P] [US2] Submit tests in `backend/timesheets/tests/test_submit.py`: `POST {id}/submit/` draft/returned→submitted sets `submitted_at` + history row; submit on submitted/approved → 400
- [ ] T-004-16 [P] [US2] Atomic bulk tests in `test_submit.py`: `POST /api/timesheets/submit/` `{"ids":[...]}` all-own-draft/returned → all submitted + history rows; batch containing someone else's id or a wrong-state id → 400 and **none** changed; empty `ids` → 400
- [ ] T-004-17 [P] [US2] Read-only tests in `test_submit.py`: edit submitted/approved → 400; returned entry → PATCH allowed → resubmit works
- [ ] T-004-18 [P] [US2] Attack test in `test_submit.py`: employee bulk-submit mixing own + another employee's id → 400, zero rows changed

### Implementation for User Story 2

- [ ] T-004-19 [US2] `submit` `@action` in `backend/timesheets/views.py`: owner only (visible non-owner → 403), `draft|returned` → else 400; sets `submitted_at`, writes history, in transaction
- [ ] T-004-20 [US2] Bulk `submit` collection action (`detail=False`, route not shadowed by `{id}`) + `BulkSubmitSerializer` in `backend/timesheets/views.py`/`serializers.py`: validate every id is caller's own `draft|returned` inside `transaction.atomic()` before changing anything; non-empty `ids` required
- [ ] T-004-21 [US2] `TimesheetsPage.tsx`: per-entry Submit button on draft/returned + select-all checkbox bulk submit (one bulk call); submitted/approved rendered read-only

**Checkpoint**: single + bulk submit verified atomic; read-only rule enforced after submit.

## Phase 5: User Story 3 — Review timesheets and browse history (P3)

**Goal**: Approver approve/return with comment rules; scoped lists with filters, timeline on detail, manager review page.

**Independent Test**: manager approves/returns a report's entry; owner self-approve → 403; other team → 404; returned → owner can edit; detail shows ordered timeline.

### Tests for User Story 3 — write FIRST, ensure they FAIL

- [ ] T-004-22 [P] [US3] Review tests in `backend/timesheets/tests/test_review_visibility.py`: approve/return on submitted by right approver → status + `reviewed_at` + history row; return without comment → 400; approved is final; HR acts on any submitted except own
- [ ] T-004-23 [P] [US3] Attack tests in `test_review_visibility.py`: owner self-approve → 403; manager A approve/return on manager B's report's entry → 404
- [ ] T-004-24 [P] [US3] Visibility/filter tests in `test_review_visibility.py`: per-role list contents (drafts private); filters `status`/`owner`/`date_from`/`date_to`/`pending_my_action=true`; ordering `date`/`status` default `-date`; pagination incl. `page_size>100` clamp
- [ ] T-004-25 [P] [US3] Timeline + aggregate test in `test_review_visibility.py`: detail embeds ordered history; list response includes `total_hours` for the filtered scope

### Implementation for User Story 3

- [ ] T-004-26 [US3] `approve`/`return` `@action`s in `backend/timesheets/views.py` + `DecisionSerializer` (comment required for return → 400; optional for approve); approver check via `core.permissions.get_approver` + caller ≠ owner; `reviewed_at` set; history row in same transaction
- [ ] T-004-27 [US3] `TimesheetFilter` in `backend/timesheets/filters.py` (`status`, `owner`, `date_from`, `date_to`, `pending_my_action`) + ordering + `StandardPagination`; embed ordered `history` in detail serializer; add `total_hours` aggregate to list response
- [ ] T-004-28 [US3] `frontend/src/pages/TimesheetReviewPage.tsx`: `pending_my_action` queue with approve/return dialog (`overlays.tsx`, comment enforced for return)
- [ ] T-004-29 [P] [US3] Filters (status/date range), total-hours display, and status timeline on `frontend/src/pages/TimesheetsPage.tsx` + entry detail

**Checkpoint**: full loop — log → submit → manager return → edit → resubmit → approve — visible in timeline.

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T-004-30 [P] Update `docs/api.md` permission matrix + endpoint rows for `/api/timesheets/*`; update `docs/database.md` with TimesheetEntry/TimesheetStatusHistory
- [ ] T-004-31 [P] Add drf-spectacular tags/descriptions for timesheet endpoints so `/api/docs/` reads cleanly
- [ ] T-004-32 [P] UX states + responsive pass (375/768/1280) on timesheet screens; verify the <2-min mobile logging claim (SC-001)
- [ ] T-004-33 Run full `pytest` green; manual smoke on seeded week: submit → return → edit → approve
- [ ] T-004-34 Log AI usage for this feature in `docs/ai-usage.md`

---

## Dependencies & Execution Order

- Foundational (T-004-03..06) blocks all stories; US1 → US2 → US3 sequential
- Tests first within each story; model → serializer → viewset/actions → frontend
- US2 builds on US1's ViewSet; US3 review/filters build on US2's submitted state

### Parallel Opportunities

- T-004-02 parallel with all backend foundational work
- Test tasks ([P]) in parallel within each story; T-004-13 parallel with T-004-11/12; T-004-29 parallel with T-004-28

## Implementation Strategy

**MVP first**: Phases 1–3 deliver logging alone. US2 adds submission (incl. atomic bulk), US3 adds review + browsing. If the schedule slips, keep review API + tests and cut `TimesheetReviewPage.tsx` last (plan.md §0.4 rule).
