# SAWA – Project Stages Plan

**Project:** Employee Requests & Time Tracking System
**Deadline:** 5 October 2026 (final demo & judging)
**Plan written:** 21 September 2026
**Stack:** Django + DRF + PostgreSQL (backend) · React 19 + TypeScript + Vite + Tailwind v4 (frontend)

---

## 1. Current State (as of 21 Sep)

| Area | Status | Notes |
|---|---|---|
| Stage 0 – Repo Setup | Partial | `sawa/` repo created: `frontend/` (cleaned Figma export, builds), `backend/` (empty), `docs/`, `specs/` (empty folders) |
| Stage 1 – Discovery & Scope | Done | `docs/discovery/` (problem, personas, goals, MVP scope) |
| Stage 2 – Naming & Branding | Partial | Name "SAWA" exists. Palette exists in `index.css`. Missing: tagline, logo, typography doc, brand rules |
| Stage 3 – Product Definition | Partial | Roles and MVP scope written. Missing: user stories, permission matrix |
| Stage 4 – UX & UI Design | Done | Figma Make export: design system (32 components), app shell, tokens. Pages are placeholders |
| Stage 5 – SpecKit | Not started | `constitution.md` drafted; feature spec/plan/tasks files pending |
| Stage 6 – Technical Design | Not started | 22–23 Sep |
| Stage 7 – Implementation | Not started | 24–29 Sep |
| Stage 8–12 | Not started | 30 Sep – 5 Oct |

---

## 2. Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Frontend framework | React + TS + Vite + Tailwind | Figma export is already React. Rewriting in another framework wastes 3–4 days |
| Build order | Backend first, in vertical slices | Permissions are judged through the API (32 pts backend+security vs 12 pts frontend). Frontend skeleton already exists |
| Auth | JWT (`djangorestframework-simplejwt`) | Simple, stateless, works with a separate frontend host |
| API docs | `drf-spectacular` | Auto-generated OpenAPI; required deliverable |
| Filtering | `django-filter` + DRF pagination | Required by brief (filters, sorting, pagination) |
| Tests | `pytest-django` | Standard; easy permission tests |
| Cut order if behind | 1. Reports/CSV → 2. Notifications → never tests or permissions | Brief: smaller, secure, tested beats larger, incomplete |

---

## 3. Repository Layout (target)

```
sawa/
├── specs/
│   ├── constitution.md
│   ├── 001-brand-product-foundation/   spec.md, plan.md, tasks.md
│   ├── 002-authentication-rbac/        spec.md, plan.md, tasks.md
│   ├── 003-employee-requests/          spec.md, plan.md, tasks.md
│   ├── 004-timesheets/                 spec.md, plan.md, tasks.md
│   └── 005-dashboard-reporting/        spec.md, plan.md, tasks.md
├── docs/
│   ├── discovery/                      (existing)
│   ├── plan.md                         (this file)
│   ├── brand.md
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   └── ai-usage.md
├── frontend/                           (moved from "SaaS Product UX Summary")
├── backend/                            (Django project)
└── README.md
```

Task IDs follow `T-<feature>-<n>` (e.g. `T-003-04`) and must appear in commit messages for traceability.

---

## 4. Stage Plan

### Stage 0 – Repo Setup · 21 Sep (1–2 h)

- [x] Create `sawa/` repo with the layout above
- [x] Move Figma export into `frontend/`, strip Figma-only code, confirm `npm install && npm run build` works
- [x] Move `docs/discovery/` into repo
- [x] Add root `.gitignore` (Python, Node, `.env`) — git `init` + first commit pending review
- [ ] Write `docs/brand.md`: name meaning, tagline, palette (from `index.css`), typography (EN + AR), 3–5 personality attributes, usage rules
- [ ] Add logo (primary, icon, light, dark) to `docs/brand/` – simple SVG is enough

**Outcome:** One repo, frontend runs, brand package complete (Stage 2 closed).

---

### Stage 5 – SpecKit · 21 Sep (12 pts)

- [ ] `specs/constitution.md` – 7 principles (product, UX, design, backend, database, security, quality), 1–2 sentences each
- [ ] `001-brand-product-foundation/` – spec, plan, tasks (mostly documenting what exists)
- [ ] `002-authentication-rbac/` – user stories for login, profile, roles, reporting lines; acceptance criteria per role
- [ ] `003-employee-requests/` – stories for create/edit draft, submit, approve/reject/return, history
- [ ] `004-timesheets/` – stories for entries, submit, read-only rule, manager review/return
- [ ] `005-dashboard-reporting/` – stories for 3 dashboards, filters, notifications, reports
- [ ] Every `tasks.md` has numbered tasks with IDs

**Outcome:** Specs are the source of truth. Each later commit references a task ID.

---

### Stage 6 – Technical Design · 22–23 Sep (10 pts)

- [ ] `docs/architecture.md` – diagram: browser → React → REST → Django → PostgreSQL; hosting plan
- [ ] `docs/database.md` – ERD + model list:
  - `User` (custom, email login)
  - `EmployeeProfile` (user, role, department, `manager` FK → self, is_active)
  - `RequestType` (name, active – HR configurable)
  - `Request` (type, title, description, status, owner, created/updated)
  - `RequestStatusHistory` (request, actor, from_status, to_status, comment, timestamp)
  - `TimesheetEntry` (owner, date, start_time, end_time, hours, note, status)
  - `TimesheetReview` or status history for entries (actor, action, comment, timestamp)
  - `Notification` (user, message, link, is_read, created)
- [ ] State machines:
  - Request: `draft → submitted → approved | rejected | returned → submitted …`
  - Timesheet: `draft → submitted → approved | returned → submitted …`
- [ ] `docs/api.md` – endpoint list + permission matrix (rows = endpoints, columns = Employee / Manager / HR)
- [ ] Security design: ownership checks via `get_queryset()`, 404 for out-of-scope objects, input validation in serializers, secrets in `.env`

**Outcome:** No modelling decisions left for implementation days.

---

### Stage 7 – Implementation · 24–29 Sep (24 pts: backend 12 + frontend 12)

One vertical slice per day: API → screen → test.

| Day | Slice | Backend | Frontend | Test |
|---|---|---|---|---|
| **24 Sep** | Auth | Django project, custom `User`, JWT login/refresh, `/api/me` | Login page, protected routes (React Router), real user in `Shell` | Wrong password, no token → 401 |
| **25 Sep** | Employees + RBAC | `EmployeeProfile`, manager FK, role permission classes, per-role `get_queryset` | HR employees list + edit role/manager | Employee cannot list employees; manager sees only direct reports |
| **26 Sep** | Requests | CRUD, `submit / approve / reject / return` actions, status history | Requests list, create/edit form, detail with timeline, approve/reject dialog | Employee cannot see another's request; manager cannot approve other team |
| **27 Sep** | Timesheets | Entries CRUD, submit, read-only after submit, manager approve/return | My timesheets, entry form, manager review page | Edit after submit → 400; return unlocks edit |
| **28 Sep** | Dashboards + Notifications | Aggregation endpoints per role; `Notification` created on each transition | 3 dashboards with `StatCard`; notification bell + feed | Notification created on approve |
| **29 Sep** | Filters + Reports | `django-filter`, ordering, pagination, report endpoints, `drf-spectacular` | Filter bars, reports page, CSV export | Empty results; pagination boundaries |

Daily rule: end the day with a working end-to-end flow and a green test run.

---

### Stage 8 – Roles & Security Review · 30 Sep (8 pts)

- [ ] Attack tests: unauthenticated call, wrong role, other manager's team, other employee's request/timesheet, editing submitted timesheet, changing own role
- [ ] Confirm every ViewSet filters by `request.user` (no `objects.all()` for non-HR)
- [ ] Safe error responses (no stack traces, no field leakage)
- [ ] Confirm `.env` is not committed; `SECRET_KEY`, DB creds from environment
- [ ] Fix all failures

**Outcome:** Permission matrix from `docs/api.md` is fully covered by tests.

---

### Stage 9 – Testing & Quality · 1–2 Oct (6 pts)

- [ ] Backend: coverage of brief section 15 (auth, permissions, requests, timesheets, filters, pagination, empty results)
- [ ] Frontend: every async screen shows loading / empty / error / success
- [ ] Responsive check at mobile (375px), tablet (768px), desktop (1280px) for: login, create request, log time, approvals
- [ ] Keyboard navigation and focus states on forms and dialogs
- [ ] Network failure handling (API down → error state + retry)
- [ ] Defect list → fix → re-test

---

### Stage 10 – Deployment & Documentation · 3 Oct (4 pts)

- [ ] Frontend → static host (Vercel / Netlify)
- [ ] Backend → PaaS (Render / Railway / Fly.io) with `gunicorn`, `whitenoise` or static offload
- [ ] PostgreSQL → managed (Neon / Supabase / PaaS add-on)
- [ ] Migrations run on deploy; seed command creates 3 demo users (Employee, Manager, HR)
- [ ] CORS + CSRF configured for the frontend origin
- [ ] `README.md`: setup, architecture, tests, deployment, demo credentials
- [ ] `docs/ai-usage.md` finalized: tools used, what was generated, what was rejected/corrected, how verified

---

### Stage 11 – Feature Freeze & Rehearsal · 4 Oct

- [ ] No new features. Bug fixes only
- [ ] Evidence pack: specs ↔ commits ↔ tests table
- [ ] Demo script: login as each role, one request flow, one timesheet flow, one blocked action (show 403/404)
- [ ] Rehearse once end-to-end on the live URL

---

### Stage 12 – Final Demo & Judging · 5 Oct

- Product story → brand → live demo → architecture → SpecKit traceability → AI process → Q&A

---

## 5. Scoring Map (where the points are)

| Area | Pts | Covered by stage |
|---|---|---|
| Problem & MVP scope | 7 | 1 (done) |
| Naming & branding | 8 | 0 |
| Requirements & roles | 7 | 5, 6 |
| UX, UI & design system | 10 | 4 (done) + 7 |
| SpecKit & traceability | 12 | 5 + commit messages |
| Architecture, DB & API | 10 | 6 |
| Django backend quality | 12 | 7 |
| Frontend quality & responsiveness | 12 | 7, 9 |
| Roles, authorization & security | 8 | 7, 8 |
| Testing & QA | 6 | 7, 8, 9 |
| Deployment & docs | 4 | 10 |
| **Total** | **96** | |

---

## 6. Learning Goals (personal)

| Odoo concept | Django / DRF equivalent to learn |
|---|---|
| `models.Model` fields | Django `models.Model` |
| `ir.model.access.csv` | DRF `permission_classes` |
| Record rules (domains) | `get_queryset()` filtering by user |
| `@api.constrains` | Serializer `validate()` |
| `state` + workflow buttons | Status field + `@action` endpoints |
| XML views | React components |
| `@http.route` controllers | DRF `ViewSet` + router |

Rules for myself:
1. Write models and permissions by hand. Use AI for boilerplate (serializers, tests, forms).
2. One attack test per feature.
3. Log every AI use in `docs/ai-usage.md` on the same day.
4. One slice per day; finish it before starting the next.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Slices take longer than one day | Cut reports → notifications first. Keep auth, RBAC, requests, timesheets |
| Deployment problems on 3 Oct | Deploy a "hello world" Django + React on 25 Sep already; redeploy daily after |
| Frontend polish eats backend time | Frontend UI kit is done; only wire pages. Do not redesign components |
| Losing traceability | Task ID in every commit message from day one |
