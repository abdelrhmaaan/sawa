# Implementation Plan: Authentication & Role-Based Access Control

**Branch**: `002-authentication-rbac` | **Date**: 2026-10-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-authentication-rbac/spec.md`. This feature also owns backend project scaffolding for the whole app (per `docs/plan.md` §0.4).

## Summary

Custom email-login `User` (role, department, manager FK) + JWT auth (simplejwt) + scoped `/api/me/` and `/api/users/` endpoints + login page, auth context and protected routes on the existing React shell. HR manages users via Django admin — there is no user-write API. Project setup (Django project, docker-compose, env, pytest, OpenAPI, seed command skeleton) lands here so features 003/004 start on a working base.

## Technical Context

**Language/Version**: Python 3.10 · TypeScript / React 19

**Primary Dependencies**: Django 5.2 LTS, DRF, djangorestframework-simplejwt, drf-spectacular, django-filter, django-environ, psycopg 3; react-router + native fetch wrapper on the existing Tailwind v4 design system

**Storage**: PostgreSQL 16 (`docker-compose` for dev; settings read `DATABASE_URL`)

**Testing**: pytest-django; tests-first per story incl. ≥1 attack test per story

**Target Platform**: Linux server (gunicorn + whitenoise); browsers at 375/768/1280 widths

**Project Type**: web application (`backend/` Django, `frontend/` React+Vite)

**Performance Goals**: modest — demo org of 7 seeded users; local p95 < 500 ms

**Constraints**: secrets via `.env` only; spec is source of truth; task IDs `T-002-xx` in every commit message

**Scale/Scope**: 3 roles, ~8 API endpoints, 1 new frontend page + auth plumbing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence in this plan |
|---|---|---|
| I. Product Scope Discipline | PASS | Only mvp-scope modules 1–2; no registration/SSO/password-reset UI |
| II. UX State Completeness | PASS | Login + protected routes carry loading/empty/error states (tasks T-002-17/18, 29) |
| III. Design System First | PASS | Login page built from `frontend/src/components/ui.tsx` and `shell/Shell.tsx` |
| IV. Server-Side Authority | PASS | Scoping lives in `get_queryset()`/permission classes; role-aware nav is cosmetic only |
| V. Migration-Only Schema | PASS | Custom `User` ships in the initial `accounts` migration; recorded in `docs/database.md` (T-002-28) |
| VI. Security by Default | PASS | 404 outside scope; JWT required everywhere non-public; secrets in env |
| VII. Tested Critical Flows | PASS | Attack-test tasks in every story phase (T-002-14, 20, 24) |

Post-design re-check: unchanged — PASS.

## Project Structure

### Documentation (this feature)

```text
specs/002-authentication-rbac/
├── spec.md
├── plan.md                  # this file (data model + endpoints inline)
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── config/                  # Django project: settings.py, urls.py, wsgi.py, asgi.py
├── core/                    # shared permissions.py, pagination.py, exceptions.py
├── accounts/
│   ├── models.py            # User + UserManager
│   ├── serializers.py       # EmailTokenObtainPair, Me, User serializers
│   ├── views.py             # /api/me/, /api/users/
│   ├── admin.py             # HR user management (is_staff)
│   ├── management/commands/seed_demo.py
│   └── tests/               # test_auth.py, test_me.py, test_users.py
├── employee_requests/       # feature 003 stub
├── timesheets/              # feature 004 stub
├── conftest.py              # pytest fixtures (APIClient, seeded roles)
├── requirements.txt
└── pytest.ini
docker-compose.yml           # postgres:16 (repo root)
backend/.env.example         # or repo-root .env.example — one canonical file
frontend/src/
├── lib/api.ts               # fetch wrapper + one-shot refresh retry
├── lib/auth.tsx             # AuthContext (access token in memory, refresh in localStorage)
├── pages/LoginPage.tsx
├── shell/Shell.tsx          # existing — wire real user + role-aware nav
└── App.tsx                  # react-router routes + RequireAuth guard
```

**Structure Decision**: Web-app split. Backend uses Django apps `accounts`, `employee_requests` (NOT `requests` — clashes with the PyPI library), `timesheets`, `core`. Frontend adds router + auth plumbing only — no new design-system components.

## Data Model (Phase 1, inline)

### `accounts.User` (`AbstractBaseUser` + `PermissionsMixin`)

| Field | Type | Rules |
|---|---|---|
| email | EmailField, unique | `USERNAME_FIELD`; login identifier, no username |
| first_name, last_name | CharField | only fields writable via `PATCH /api/me/` |
| role | CharField, choices `employee`/`manager`/`hr` | default `employee`; read-only via API |
| department | CharField, blank | optional; read-only via API |
| manager | FK → `self`, null/blank, `on_delete=SET_NULL` | `clean()`: ≠ self, walk chain to reject cycles |
| is_active | bool | inactive → 401 at token obtain and refresh |
| is_staff | bool | True for seeded HR → `/admin/` access |
| password | hashed | via `UserManager.create_user` / `create_superuser` |

Indexes: `email` unique; `manager` FK index (auto).

## API Endpoints (Phase 1, inline)

| Method | Path | Access | Behaviour |
|---|---|---|---|
| POST | `/api/auth/token/` | public | email+password → `{access, refresh}`; unknown/wrong/inactive → **401** generic |
| POST | `/api/auth/token/refresh/` | public (valid refresh) | rotated pair; deactivated user → **401** |
| GET | `/api/me/` | authenticated | own profile |
| PATCH | `/api/me/` | authenticated | only `first_name`, `last_name` writable; role/email/department/manager silently ignored (200, unchanged) |
| GET | `/api/users/` | hr → all; manager → self+direct reports; employee → **403** | page-number pagination, default 20, `page_size` ≤ 100 |
| GET | `/api/users/{id}/` | same scope; employee → own id only | outside scope → **404** |
| GET | `/api/schema/`, `/api/docs/` | public in dev | drf-spectacular OpenAPI + Swagger UI |
| — | `/admin/` | `is_staff` | HR user management (create/deactivate/assign role & manager) |

**Error contract (global, applies to 003/004 too)**: `401` unauthenticated · `404` object outside caller's visibility scope · `403` visible but action not allowed for role/relationship · `400` invalid input or state transition. Error bodies never leak stack traces (custom exception handler in `core/exceptions.py`).

**Approver resolution (shared rule, implemented in `core`)**: approver of an item = owner's direct manager; if owner has no manager → HR. HR may act on ANY submitted item. Nobody acts on their own item, HR included.

**Drafts are private**: only the owner sees their own `draft` items — managers and HR do not (enforced in 003/004 querysets).

**Seed**: `python manage.py seed_demo` — 1 HR (`is_staff`), 2 managers (no manager), 4 employees (2 per manager); password from `SEED_DEMO_PASSWORD` env; idempotent via `update_or_create`. Request/timesheet sample data is added by features 003/004.

## Decisions

- `manager` FK uses `on_delete=SET_NULL` (§0.2 directs picking SET_NULL): removing a manager leaves reports manager-less → approver falls back to HR.
- Access token in memory (lost on reload → silent refresh via refresh token in `localStorage`). XSS trade-off accepted for MVP; to be documented in `docs/architecture.md` (plan §0.2 #14).
- JWT: `ROTATE_REFRESH_TOKENS=True`, access ≈ 15 min, refresh ≈ 1 day.
- No registration, password reset, or user-write API — HR uses Django admin (cut list §0.3).
- Token endpoint uses a custom `TokenObtainPairSerializer` subclass that rejects `is_active=False` before issuing.

## Complexity Tracking

No constitution violations — nothing to justify.
