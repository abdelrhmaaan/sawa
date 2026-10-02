# Implementation Plan: Employee Requests

**Branch**: `003-employee-requests` | **Date**: 2026-10-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-employee-requests/spec.md`. Depends on `002-authentication-rbac` (project scaffold, `core` permissions/pagination, auth, seed).

## Summary

`employee_requests` Django app: `Request` + `RequestStatusHistory` models, a DRF ViewSet with scoped `get_queryset()`, state-machine `@action`s (submit/approve/reject/return) writing history rows, django-filter filters + ordering, and React pages (my requests, create/edit form, detail with timeline, approvals queue with decision dialog).

## Technical Context

**Language/Version**: Python 3.10 · TypeScript / React 19

**Primary Dependencies**: Django 5.2 LTS, DRF, django-filter, drf-spectacular; react-router + `lib/api.ts` fetch wrapper + design system (`components/ui.tsx`, `overlays.tsx`, `shell/Shell.tsx`)

**Storage**: PostgreSQL 16 (from 002 scaffold); migrations only

**Testing**: pytest-django; tests-first incl. ≥1 attack test per story

**Target Platform**: Linux server (gunicorn+whitenoise); browsers 375/768/1280

**Project Type**: web application

**Performance Goals**: local p95 < 500 ms on seeded data; list endpoints paginated

**Constraints**: `employee_requests` app name (not `requests`); drafts private; status changes only via action endpoints

**Scale/Scope**: 2 models, 1 ViewSet (~9 actions), 4 frontend screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|---|---|---|
| I. Product Scope Discipline | PASS | mvp-scope modules 3–4; no attachments/priority/configurable types |
| II. UX State Completeness | PASS | list/form/detail/queue tasks include loading/empty/error states |
| III. Design System First | PASS | all screens compose `ui.tsx`/`overlays.tsx` (dialog for decisions) |
| IV. Server-Side Authority | PASS | visibility in `get_queryset()`; transitions validated in serializers/actions |
| V. Migration-Only Schema | PASS | two models via migrations; recorded in `docs/database.md` |
| VI. Security by Default | PASS | 404 out-of-scope; 403 role-forbidden; owner forced server-side |
| VII. Tested Critical Flows | PASS | attack tests per story (T-003-13/14, T-003-21/22, T-003-28) |

Post-design re-check: unchanged — PASS.

## Project Structure

### Documentation (this feature)

```text
specs/003-employee-requests/
├── spec.md
├── plan.md                # this file (data model + endpoints inline)
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/employee_requests/
├── models.py              # Request, RequestStatusHistory
├── serializers.py         # RequestSerializer (+history embed), actions, create
├── views.py               # RequestViewSet + @actions
├── filters.py             # django-filter FilterSet
├── urls.py                # router registration (or config/urls.py)
└── tests/                 # test_crud.py, test_actions.py, test_visibility_filters.py
frontend/src/pages/
├── RequestsPage.tsx       # my/team requests list + filters + pagination
├── RequestFormPage.tsx    # create/edit draft
├── RequestDetailPage.tsx  # detail + status timeline
└── ApprovalsPage.tsx      # pending_my_action queue + decision dialog
frontend/src/lib/api.ts    # add requests API helpers
```

**Structure Decision**: Single Django app `employee_requests`; history model lives beside `Request`. Frontend adds four pages reusing the shell + ui kit; no new components.

## Data Model (Phase 1, inline)

### `employee_requests.Request`

| Field | Type | Rules |
|---|---|---|
| owner | FK → `accounts.User`, PROTECT | server-set to `request.user`; never client-writable |
| type | CharField, TextChoices `leave`/`equipment`/`wfh`/`hr_service`/`general` | required |
| title | CharField(200) | required |
| description | TextField | required |
| status | CharField, choices `draft`/`submitted`/`approved`/`rejected`/`returned` | default `draft`; transitions only via actions |
| created_at / updated_at | auto timestamps | ordering fields |
| submitted_at / decided_at | DateTime null | set on submit / on approve/reject |

### `employee_requests.RequestStatusHistory`

| Field | Type | Rules |
|---|---|---|
| request | FK → Request, CASCADE, related `history` | |
| actor | FK → User, PROTECT | who performed the transition |
| from_status | CharField null | null on the create row |
| to_status | CharField | |
| comment | TextField blank | required by action rules (reject/return) |
| created_at | auto_add | timeline order |

### State machine

```text
create → draft
draft | returned → submitted        (owner)
submitted → approved | rejected | returned   (approver: owner's manager, else HR; HR may act on any; never self)
approved / rejected → FINAL
```

- `reject`, `return`: `comment` required non-empty → else 400. `approve`: optional comment.
- Edit (PUT/PATCH): owner only, status `draft`|`returned` → else 400; visible non-owner → 403.
- Delete: owner + `draft` only.

### Visibility (`get_queryset()`)

```text
employee: owner=self
manager : owner=self OR owner__manager=self, excluding drafts not owned by self
hr      : all non-draft OR own (incl. own drafts)
out-of-scope object → 404; role-forbidden action on visible object → 403
```

## API Endpoints (Phase 1, inline)

Base `/api/requests/` (ViewSet):

| Method | Path | Behaviour |
|---|---|---|
| GET | `/api/requests/` | scoped list; filters `status`, `type`, `owner`, `created_after`, `created_before`, `pending_my_action=true` (submitted AND caller is approver); ordering `created_at`,`updated_at`,`status` (default `-created_at`); pagination 20/`page_size`≤100 |
| POST | `/api/requests/` | create draft; owner=`request.user`, client `owner`/`status` ignored |
| GET | `/api/requests/{id}/` | detail incl. embedded ordered history timeline |
| PUT/PATCH | `/api/requests/{id}/` | owner + draft/returned only → else 400/403 |
| DELETE | `/api/requests/{id}/` | owner + draft only |
| POST | `/api/requests/{id}/submit/` | owner, draft/returned → submitted; sets `submitted_at`, writes history |
| POST | `/api/requests/{id}/approve/` | approver on submitted; sets `decided_at`; comment optional |
| POST | `/api/requests/{id}/reject/` | approver on submitted; `comment` required → 400 |
| POST | `/api/requests/{id}/return/` | approver on submitted; `comment` required → 400 |

Approver check: `core.permissions.get_approver(owner)` → owner's `manager` else HR; caller must equal approver or be HR; caller ≠ owner.

**Seed**: extend `seed_demo` with a few requests in varied statuses (draft, submitted, approved, returned) across demo employees.

## Decisions

- `pending_my_action` is a boolean filter (`submitted` + caller is approver-or-HR-and-not-owner), implemented in the FilterSet.
- History row written inside the same transaction as the status change; create also writes a row (`from_status=null`).
- `owner` filter is applied after scoping — it narrows, never widens.
- Returned requests keep `submitted_at`/`decided_at` history; resubmit refreshes `submitted_at`.
- No `research.md`/`contracts/`/`quickstart.md` — stack decided in `docs/plan.md` §0.2; endpoints and data model kept inline here per brief.

## Complexity Tracking

No constitution violations — nothing to justify.
