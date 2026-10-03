# SAWA — Architecture

One-page technical design. Details live in the linked docs: data model → [database.md](database.md), endpoints + permission matrix → [api.md](api.md), scope decisions → [plan.md](plan.md) §0.

## System overview

```mermaid
flowchart LR
    B[Browser] -->|HTTPS| FE[React 19 + Vite SPA<br/>static host · sawa-frontend]
    FE -->|REST/JSON<br/>Authorization: Bearer JWT| API[Django 5.2 + DRF<br/>gunicorn · sawa-api]
    API --> PG[(PostgreSQL<br/>sawa-db)]
    AD[HR admin] -->|/admin session auth| API
    API -.->|/api/schema/ · /api/docs/<br/>drf-spectacular| DOCS[OpenAPI + Swagger UI]
```

- **Frontend** — SPA served as static files; `VITE_API_URL` points it at the API. Native `fetch` wrapper (`frontend/src/lib/api.ts`) — no axios/react-query (plan §0.2 #13).
- **Backend** — Django/DRF monolith. Apps: `accounts` (custom `User`, auth), `employee_requests`, `timesheets`, `core` (dashboard, notifications, permissions, error handling). `config/` holds settings + routing.
- **Database** — PostgreSQL; `DATABASE_URL` drives config locally (compose, port 5434) and on Render.
- **Django admin** at `/admin/` is the only user-management UI — seeded HR users have `is_staff` (plan §0.3 cut: no custom HR user-edit screen).
- **Static files** — WhiteNoise serves `collectstatic` output from the web service itself.

## Authentication

SimpleJWT. Email + password → `{access, refresh}` pair; all API calls carry `Authorization: Bearer <access>`.

| Token | Lifetime | Stored |
|---|---|---|
| Access | 15 min | **In memory only** (JS module variable) |
| Refresh | 1 day, **rotated** + old one blacklisted | `localStorage` (`sawa.refresh`) |

The API client's single in-flight refresh promise deduplicates parallel 401s; a failed refresh clears both tokens and logs the user out (`frontend/src/lib/api.ts`, `auth.tsx`).

**Trade-off.** Storing the refresh token in `localStorage` exposes it to XSS — but it is rotated on every use and blacklisted server-side, so a stolen token has a short, single-use window and its reuse invalidates the chain. The alternative, an `HttpOnly` cookie, would defeat XSS theft but requires CSRF protection and complicates cross-origin hosting (frontend and API live on different Render subdomains). Keeping the *access* token in memory (never persisted) shrinks the XSS blast radius to 15 minutes. For a demo app with no sensitive financial data this is a reasonable balance; production hardening would add CSP headers and consider cookie-based refresh with CSRF tokens.

Deactivated users are rejected on both token obtain and refresh (custom serializers in `accounts/`); server defaults deny everything (`IsAuthenticated` globally, AllowAny only on token endpoints + schema/docs).

## Authorization

All authorization is **server-side**, enforced two ways:

1. **Role-scoped querysets** — every ViewSet's `get_queryset()` filters by `request.user` and role (employee → own; manager → own + direct reports' non-draft; HR → all non-draft + own). Drafts are private to the owner.
2. **Object rules** — approver = owner's direct manager, else HR (`core/permissions.py::get_approver`); **nobody may act on their own item** (403, HR included — this is why a second HR is seeded).

Status-code semantics are uniform (see [api.md](api.md) conventions + full permission matrix): **401** unauthenticated/inactive, **404** object outside the caller's visibility scope (existence never leaks), **403** visible but not allowed for this role/relationship, **400** invalid input or illegal state transition. Unhandled exceptions go through `core/exceptions.py::safe_exception_handler` — generic 500 body, traceback only in logs.

## Data model

Six models — full field/constraint reference and state diagrams in [database.md](database.md):

| Model | Purpose |
|---|---|
| `accounts.User` | Custom user: email login, `role` (employee/manager/hr), `department`, `manager` self-FK (reporting line), `is_staff` for `/admin/` |
| `Request` + `RequestStatusHistory` | Typed request (`leave`/`equipment`/`wfh`/`hr_service`/`general`) + audit trail (actor, from→to, comment) written in the same transaction as every transition |
| `TimesheetEntry` + `TimesheetStatusHistory` | Daily entry; `hours` server-computed; same history pattern |
| `core.Notification` | In-app feed row (recipient, message, link, `is_read`) created on each transition |

State machines: `draft → submitted → approved | rejected | returned` (requests), `draft → submitted → approved | returned` (timesheets); `returned` re-opens owner editing; `approved`/`rejected` are final.

## Hosting plan (Render)

`render.yaml` blueprint — one click provisions all three:

| Service | Type | Build | Start |
|---|---|---|---|
| `sawa-api` | Web, Python 3.12, free | `pip install -r requirements.txt && collectstatic --noinput && migrate` | `gunicorn config.wsgi:application` |
| `sawa-frontend` | Static site, free | `npm ci && npm run build` → `dist` + SPA rewrite `/* → /index.html` | — |
| `sawa-db` | Postgres, free | — | wired via `fromDatabase.connectionString` |

**Env vars**

| Var | Set on | Purpose |
|---|---|---|
| `SECRET_KEY` | api | Django secret — `generateValue: true`, never committed |
| `DEBUG` | api | `"false"` in production |
| `DATABASE_URL` | api | injected from `sawa-db`; locally `postgres://sawa:sawa@localhost:5434/sawa` |
| `ALLOWED_HOSTS` | api | `sawa-api.onrender.com` — required (settings fail closed if empty with DEBUG off) |
| `CORS_ALLOWED_ORIGINS` | api | frontend origin — only it may call the API cross-origin |
| `CSRF_TRUSTED_ORIGINS` | api | api + frontend origins — needed for `/admin/` login over HTTPS |
| `SECURE_PROXY_SSL_HEADER` | api | `HTTP_X_FORWARDED_PROTO` — Render terminates TLS upstream |
| `SEED_DEMO_PASSWORD` | api | `sync: false` → entered once at blueprint creation; consumed only by `seed_demo` |
| `VITE_API_URL` | frontend | baked into the static bundle at build time |
| `PYTHON_VERSION` | api | `3.12` |

**Build/runtime behavior**: migrations run in `buildCommand`, so every deploy brings the DB to current schema. `seed_demo` runs **once manually** after first deploy (idempotent — safe to re-run).

**Free-tier caveats** (accepted — demo app, 30-day judging window):

- Cold starts: free web services sleep after ~15 min idle; first request takes ~50 s.
- Free Postgres expires after 30 days. On reset the DB comes back empty → `migrate` on next deploy rebuilds schema, `seed_demo` restores the demo org. No persistent data is needed.

## Testing strategy

| Layer | Tool | Coverage |
|---|---|---|
| Backend | `pytest` + `pytest-django` — **162 tests**, Postgres (not SQLite) | Auth/me, scoped user directory, request & timesheet CRUD + all workflow actions, visibility filters, pagination, dashboard, notifications, settings fail-closed checks, and **attack tests** per the [api.md](api.md) matrix: wrong role, other manager's team, other user's items, editing submitted items, self-approval attempts |
| API contract | `drf-spectacular` | OpenAPI schema generated from the same serializers/views the tests exercise — schema and implementation can't drift silently |
| E2E | Playwright — `frontend/e2e/smoke.spec.ts`, 7 flows, `workers: 1` (shared dev DB) | Login → dashboard; request draft → submit → manager approve → notification; employee blocked from approvals + teammate's request (404); timesheet log → submit → manager approve; submitted entry read-only; HR approve; logout + protected-route redirect. Each test creates uniquely-titled data, so the suite is re-runnable |

## Deliberately cut (plan.md §0.3)

| Cut | Why |
|---|---|
| Reports page / CSV export | Judging weighs security + tests over breadth; dashboard endpoint covers the summary need |
| HR user-edit UI in the SPA | Django admin already provides it — seeded HR has `is_staff` + user permissions |
| File attachments | Object storage + upload security cost vs. demo value; descriptions/notes suffice |
| Priority field, `RequestType` model, two-step approval, weekly timesheet header | Undefined in discovery; replaced by sort-by-date/status, `TextChoices`, single-step approval, per-entry status + bulk submit |
| Email/SMS notifications, SSO, rate limiting, native mobile | Out of MVP scope (`docs/discovery/mvp-scope.md`) |
