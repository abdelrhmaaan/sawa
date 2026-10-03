# SAWA — Employee Requests & Time Tracking

SAWA is an internal HR tool: employees submit requests (leave, equipment, WFH, HR service, general) and log daily time; their direct manager — or HR — approves, rejects, or returns each item for correction. Three roles: **Employee** (own data only), **Manager** (own + direct reports), **HR** (org-wide + user admin via Django admin).

Django 5.2 + DRF + PostgreSQL backend · React 19 + TS + Vite + Tailwind v4 frontend.

## Features

- **Requests** — draft → submit → approve / reject / return, full status-history timeline; comments required on reject/return.
- **Timesheets** — daily entries (date, start/end, note); hours computed server-side; no overlap or future dates; single + bulk submit; read-only once submitted.
- **Approvals** — one pending queue: managers see direct reports' items, HR sees org-wide; nobody can act on their own item.
- **Dashboard** — role-shaped summary (`GET /api/dashboard/`): own stats for everyone, `team` for managers, `org` for HR.
- **Notifications** — in-app bell + feed on every status change affecting you.
- **Search & filters** — status, type, owner, date range, `pending_my_action`, ordering; paginated lists.
- **API docs** — OpenAPI schema + Swagger UI via drf-spectacular.
- **Tested** — 162 pytest tests (incl. permission "attack" tests) + 7 Playwright e2e flows.

## Architecture

Static SPA (React/Vite) → REST/JSON + JWT → Django/DRF → PostgreSQL. Full design, auth trade-offs, and hosting plan: [docs/architecture.md](docs/architecture.md).

## Dev quickstart

```bash
# 1. Database (Postgres 16 on host port 5434)
docker compose up -d db

# 2. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in SECRET_KEY, SEED_DEMO_PASSWORD, etc.
python manage.py migrate
python manage.py seed_demo  # 2 HR, 2 managers, 4 employees (2 per manager)
python manage.py runserver  # http://localhost:8000

# 3. Frontend (separate terminal)
cd frontend && npm install && npm run dev  # http://localhost:5173
```

- API docs: http://localhost:8000/api/docs/ · OpenAPI: `/api/schema/`
- Admin: http://localhost:8000/admin/ (log in as seeded HR)

## Testing

```bash
# Backend — 162 tests (unit, API, permission/attack), run against Postgres
cd backend && pytest -q

# Frontend — type check
cd frontend && npm run typecheck

# E2E — 7 Playwright smoke flows; needs backend (:8000) + dev server (:5180)
cd frontend
npm run dev -- --port 5180   # or set E2E_BASE_URL to another dev URL
npm run test:e2e
```

The e2e suite logs in as seeded demo users and only asserts on data it creates, so it is safe to re-run.

## Deployment (Render)

`render.yaml` is a Render blueprint that provisions everything:

| Service | Type | Notes |
|---|---|---|
| `sawa-api` | Web (Python, free) | build: `pip install` + `collectstatic` + `migrate`; start: `gunicorn` |
| `sawa-db` | Managed Postgres (free) | wired into `sawa-api` via `DATABASE_URL` |
| `sawa-frontend` | Static site (free) | `npm ci && npm run build` → `dist`, SPA rewrite to `/index.html` |

Steps:

1. Render dashboard → **New → Blueprint** → point at this repo.
2. When prompted, set `SEED_DEMO_PASSWORD` on `sawa-api` (it is `sync: false` — Render injects it manually, never committed).
3. After the first deploy, run `python manage.py seed_demo` once — via the Render Shell or locally against the database's external URL — to create the demo org.
4. Open `https://sawa-frontend.onrender.com` and sign in with a demo account.

Free-tier notes: services cold-start after idle (~50 s on first hit) and the free Postgres expires after 30 days — acceptable for the demo window.

## Demo accounts

| Email | Role | Notes |
|---|---|---|
| `hr@sawa.demo` | HR | `is_staff` — manages users via `/admin/` |
| `hr2@sawa.demo` | HR | second HR so HR-owned items can be decided |
| `manager.a@sawa.demo` | Manager | Engineering — approves sara, karim |
| `manager.b@sawa.demo` | Manager | Operations — approves mona, tarek |
| `sara@sawa.demo`, `karim@sawa.demo` | Employee | report to manager.a |
| `mona@sawa.demo`, `tarek@sawa.demo` | Employee | report to manager.b |

Password for all = `SEED_DEMO_PASSWORD` (`demo1234` in the provided local `.env`).

## Repo layout

```
sawa/
├── backend/                 Django project
│   ├── accounts/            custom User, JWT auth, /api/me, user directory, seed_demo
│   ├── core/                dashboard, notifications, permissions, error handling
│   ├── employee_requests/   Request + RequestStatusHistory
│   ├── timesheets/          TimesheetEntry + TimesheetStatusHistory
│   └── config/              settings, urls
├── frontend/
│   ├── src/                 lib (api client, auth context), pages, components, shell
│   └── e2e/                 Playwright smoke suite
├── specs/                   SpecKit feature specs 001–005 (source of truth)
├── docs/                    plan, architecture, api, database, ai-usage, brand, discovery
├── docker-compose.yml       local Postgres 16 (host port 5434)
└── render.yaml              Render blueprint (api + db + frontend)
```

## Docs & specs

- [docs/plan.md](docs/plan.md) — stage plan; **§0 holds all scope decisions**
- [docs/architecture.md](docs/architecture.md) — system design, auth, hosting
- [docs/api.md](docs/api.md) — endpoint reference + permission matrix
- [docs/database.md](docs/database.md) — ERD, models, state machines
- [docs/discovery/](docs/discovery/) — problem statement, personas, goals, MVP scope
- [docs/ai-usage.md](docs/ai-usage.md) — AI usage log
- [docs/brand.md](docs/brand.md) — name, palette, typography, logo rules
- [specs/](specs/) — `001`–`005` spec/plan/tasks per feature
