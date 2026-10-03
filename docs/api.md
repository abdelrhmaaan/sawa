# SAWA — API Reference & Permission Matrix

Base: `/api/` · Auth: `Authorization: Bearer <access>` (JWT) · Docs: `GET /api/schema/` (OpenAPI) + `GET /api/docs/` (Swagger UI).

Source of truth: `specs/002-authentication-rbac/` · `003-employee-requests/` · `004-timesheets/` · `005-dashboard-reporting/`.

## Conventions

**Pagination** (all list endpoints): page-number envelope `{count, next, previous, results}`; `?page=` + `?page_size=` (default 20, max 100).

**Error shape**: `{"detail": "..."}` (+ per-field errors on 400). Bodies never leak stack traces.

**Status-code rules (all features)**:

| Code | Meaning |
|---|---|
| 401 | Unauthenticated / bad credentials / inactive user |
| 404 | Object outside the caller's visibility scope (existence never leaks) |
| 403 | Object visible, but action not allowed for caller's role/relationship (incl. acting on own item) |
| 400 | Invalid input or invalid state transition (e.g. edit submitted, missing required comment) |

**Visibility rule** (requests, timesheets): employee → own; manager → own + direct reports' non-draft; HR → own + all non-draft. Drafts are private to the owner.

**Approver rule**: owner's direct manager → HR if none; HR may act on any submitted item; **nobody acts on their own item** (403, HR included).

## Endpoints

### Auth & Users — [spec](../specs/002-authentication-rbac/spec.md)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/token/` | email+password → `{access, refresh}`; wrong/unknown/inactive → 401 generic |
| POST | `/api/auth/token/refresh/` | rotated pair; deactivated user → 401 |
| GET/PATCH | `/api/me/` | PATCH: only `first_name`/`last_name` writable; role/email/department/manager ignored (200) |
| GET | `/api/users/` | scoped list; pagination applies |
| GET | `/api/users/{id}/` | scoped detail |
| — | `/admin/` | HR (`is_staff`) user management — the only user-write path |

### Requests — [spec](../specs/003-employee-requests/spec.md)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/requests/` | filters `status` `type` `owner` `created_after` `created_before` `pending_my_action=true`; ordering `created_at` `updated_at` `status` (default `-created_at`) |
| POST | `/api/requests/` | owner=caller, status=`draft`; client `owner`/`status` ignored |
| GET | `/api/requests/{id}/` | detail + ordered history timeline |
| PUT/PATCH | `/api/requests/{id}/` | owner + `draft`/`returned` only |
| DELETE | `/api/requests/{id}/` | owner + `draft` only |
| POST | `/api/requests/{id}/submit/` | owner; `draft`/`returned` → `submitted` |
| POST | `/api/requests/{id}/approve/` | approver; comment optional |
| POST | `/api/requests/{id}/reject/` | approver; `comment` **required** → 400 |
| POST | `/api/requests/{id}/return/` | approver; `comment` **required** → 400 |

### Timesheets — [spec](../specs/004-timesheets/spec.md)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/timesheets/` | filters `status` `owner` `date_from` `date_to` `pending_my_action=true`; ordering `date` `status` (default `-date`); `total_hours` in response |
| POST | `/api/timesheets/` | `hours` computed server-side; validates `end>start`, `date≤today`, no overlap (same owner+date) |
| GET/PUT/PATCH/DELETE | `/api/timesheets/{id}/` | detail embeds timeline; edit owner + `draft`/`returned` only; delete `draft` only |
| POST | `/api/timesheets/{id}/submit/` | owner; `draft`/`returned` → `submitted` |
| POST | `/api/timesheets/submit/` | bulk `{"ids":[...]}` — atomic: any non-own/wrong-state id → 400, nothing changes |
| POST | `/api/timesheets/{id}/approve/` | approver; sets `reviewed_at` |
| POST | `/api/timesheets/{id}/return/` | approver; `comment` **required** → 400; re-enables owner editing |

### Dashboard & Notifications — [spec](../specs/005-dashboard-reporting/spec.md)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/dashboard/` | role-shaped payload: `my_requests`/`my_entries`/`my_hours_this_week` + `team` (manager) or `org` (hr); sections absent for lower roles |
| GET | `/api/notifications/` | own only, unread first, paginated, `unread_count` in response |
| POST | `/api/notifications/{id}/read/` | owner only; other user's → 404 |
| POST | `/api/notifications/read-all/` | marks all caller's notifications read |

## Permission Matrix

| Endpoint / action | Employee | Manager | HR |
|---|---|---|---|
| POST `/api/auth/token/` + refresh | public — active users only | same | same |
| GET `/api/me/` | own | own | own |
| PATCH `/api/me/` | own names only; role/email/dept/manager ignored | same | same |
| GET `/api/users/` | 403 | self + direct reports | all |
| GET `/api/users/{id}/` | own id only (else 404) | self + direct reports (else 404) | any |
| `/admin/` | 403 | 403 | full user management |
| GET `/api/requests/` | own only | own + reports' non-draft | all non-draft + own |
| GET `/api/requests/{id}/` | own (else 404) | own + reports' non-draft (else 404) | non-draft + own (else 404) |
| POST `/api/requests/` | create own draft | same | same |
| PUT/PATCH/DELETE `/api/requests/{id}/` | own draft/returned (delete: draft only); visible non-owner → 403 | same | same |
| POST `…/submit/` | own draft/returned | same | same |
| POST `…/approve/`/`reject/`/`return/` | 403 (visible, not approver) | approver only (direct reports); never own → 403; other team's → 404 | any submitted, never own → 403 |
| GET `/api/timesheets/` | own only | own + reports' non-draft | all non-draft + own |
| GET `/api/timesheets/{id}/` | own (else 404) | own + reports' non-draft (else 404) | non-draft + own (else 404) |
| POST `/api/timesheets/` | create own draft | same | same |
| PUT/PATCH/DELETE `/api/timesheets/{id}/` | own draft/returned (delete: draft only) | same | same |
| POST `…/submit/` + bulk `submit/` | own draft/returned; bulk ids all own or 400 atomic | same | same |
| POST `…/approve/`/`return/` | 403 | approver only; never own → 403; other team's → 404 | any submitted, never own → 403 |
| GET `/api/dashboard/` | own sections only | + `team` (direct reports) | + `org` (all, excl. own pending) |
| GET/POST `/api/notifications/*` | own only (others → 404) | same | same |

**Every status change writes a history row** (actor, from→to, comment, timestamp) in the same transaction.
