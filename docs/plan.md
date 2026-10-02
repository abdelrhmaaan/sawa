# SAWA – Project Stages Plan

**Project:** Employee Requests & Time Tracking System
**Deadline:** 5 October 2026 (final demo & judging)
**Plan written:** 21 September 2026 · **Reviewed & re-planned:** 2 October 2026
**Stack:** Django 5.2 LTS + DRF + PostgreSQL (backend) · React 19 + TypeScript + Vite + Tailwind v4 (frontend)

---

## 0. Plan Review – 2 Oct (READ FIRST)

### 0.1 Reality check

| Planned for | What exists on 2 Oct |
|---|---|
| Specs done 21 Sep | `specs/00x-*/` folders hold only `.gitkeep`. Constitution exists (`.specify/memory/constitution.md`) |
| Tech design 22–23 Sep | No `architecture.md`, `database.md`, `api.md` |
| Implementation 24–29 Sep | `backend/` is empty. Frontend has only `DesignSystem.tsx` page; no router, no API client |
| Hello-world deploy 25 Sep | Not done |
| Git | 1 commit. Uncommitted: `docs/brand.md`, `docs/plan.md`, `specs/constitution.md`; untracked `.specify/`, `.devin/` |

**~3 working days left. The original Stage 5–11 dates are void. Follow §0.4 (Rescue Schedule).**

### 0.2 Issues found in the plan / discovery docs (and decisions)

| # | Issue | Decision |
|---|---|---|
| 1 | `mvp-scope.md` lists "optional attachment" but also puts file upload **out of scope** | No attachments. Remove from MVP scope line |
| 2 | "Sort by priority" but no `priority` field on `Request` | Drop priority. Sort by date / status only |
| 3 | `RequestType` as an HR-configurable model costs CRUD + UI | Use `TextChoices`: Leave, Equipment, WFH, HR Service, General |
| 4 | `User` + separate `EmployeeProfile` = extra join, extra serializer | Put `role`, `department`, `manager` (FK self) directly on custom `User` |
| 5 | "Employee → Manager → HR if needed" two-step flow never defined | Single-step approval. Approver = direct manager, or HR if user has no manager. HR can act on any request |
| 6 | No rule on self-approval | Nobody approves/reviews their own request or timesheet (HR included) |
| 7 | Request state machine: unclear if `returned` is editable | `returned` behaves like `draft`: owner can edit, then submit again. `approved` / `rejected` are final |
| 8 | 403 vs 404 not separated | Object outside caller's scope → **404**. In scope but wrong role (e.g. employee calls `approve`) → **403**. Wrong state (edit submitted item) → **400** |
| 9 | Timesheet unit unclear (entry vs week) | Status per **entry**, plus a bulk `submit` action for many draft entries. No weekly header model |
| 10 | No timesheet validation rules | `end_time > start_time`; `hours` computed server-side; date not in the future; no overlapping entries for same owner/date |
| 11 | Seed data "3 demo users" cannot demo "other manager's team" attack | Seed: 1 HR, 2 managers, 4 employees (2 per manager), sample requests + entries |
| 12 | Machine has Python 3.10; Django 6 needs 3.12 | Pin **Django 5.2 LTS** |
| 13 | Frontend has no `react-router` | Add `react-router` (one dependency). Use native `fetch` wrapper — no axios / react-query |
| 14 | JWT storage not decided | Access token in memory, refresh token in `localStorage`. Document trade-off in `architecture.md` |
| 15 | Local PostgreSQL setup not planned | `docker-compose.yml` with `postgres:16` for dev; settings read `DATABASE_URL` |
| 16 | Two constitution files | Keep `.specify/memory/constitution.md` canonical; `specs/constitution.md` is only a pointer (already done) |

### 0.3 Revised cut list

| Keep (must) | Reduce | Cut |
|---|---|---|
| Auth, RBAC, Requests, Timesheets, attack tests, filters + pagination, OpenAPI, deploy, README, ai-usage | Dashboards → one `/api/dashboard/` summary endpoint per role + `StatCard`s. Notifications → only if Day 3 is on time (model + signal + bell list) | Reports page, CSV export, HR employee edit UI (use Django admin for HR user management) |

### 0.4 Rescue Schedule (2–5 Oct)

| When | Work | Done when |
|---|---|---|
| **Fri 2 Oct – evening** | Commit pending changes. Write `specs/002`, `003`, `004` (spec/plan/tasks, compact, with `T-00x-nn` IDs); `001` + `005` one page each. Write `docs/database.md` + `docs/api.md` (permission matrix) — these replace Stage 6. Start `docs/ai-usage.md` | Specs + matrix committed |
| **Sat 3 Oct** | Backend: project + `docker-compose` + `.env`, custom `User`, JWT, `/api/me`, Requests (CRUD + submit/approve/reject/return + history), Timesheets (CRUD + submit/approve/return), `django-filter` + pagination, `drf-spectacular`, seed command, attack tests. **Deploy backend + DB tonight** | `pytest` green, Swagger live on public URL |
| **Sun 4 Oct** | Frontend: router, auth context, API client, login, my requests (list/form/detail+timeline), approvals queue, my timesheets (list/form/submit), manager review, dashboard summary. Loading/empty/error states. Deploy frontend, CORS. Notifications only if done by 18:00 | Full demo flow works on live URL |
| **Mon 5 Oct – morning** | Feature freeze. README, `architecture.md`, finish `ai-usage.md`, evidence table (spec ↔ commit ↔ test), responsive check 375/768/1280, rehearse demo once | Rehearsed on live URL |

Rule: if Saturday's backend slips, Sunday cuts dashboards first, then the manager-review screen for timesheets (keep its API + tests).

---

## 1. Current State (as of 21 Sep — historical, see §0)

| Area | Status | Notes |
|---|---|---|
| Stage 0 – Repo Setup | Done | `sawa/` repo committed (`2404723`): `frontend/` cleaned + builds, `backend/` empty, `docs/`, `specs/` scaffolded |
| Stage 1 – Discovery & Scope | Done | `docs/discovery/` (problem, personas, goals, MVP scope) |
| Stage 2 – Naming & Branding | Done | `docs/brand.md` + `docs/brand/*.svg` — name, tagline, palette, typography, rules |
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
- [x] Add root `.gitignore` (Python, Node, `.env`), `git init` + first commit `2404723` on `master`
- [x] Write `docs/brand.md`: name meaning, tagline, palette (from `index.css`), typography (EN + AR), personality attributes, usage rules
- [x] Add logo to `docs/brand/`: `icon.svg`, `logo.svg`, `logo-dark.svg`, `logo-mono.svg`

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
  - `User` (custom, email login, `role`, `department`, `manager` FK → self, is_active) — *revised 2 Oct, replaces `EmployeeProfile`*
  - `Request` (type as `TextChoices`, title, description, status, owner, created/updated) — *`RequestType` model dropped 2 Oct*
  - `RequestStatusHistory` (request, actor, from_status, to_status, comment, timestamp)
  - `TimesheetEntry` (owner, date, start_time, end_time, hours (computed), note, status)
  - `TimesheetStatusHistory` (entry, actor, from_status, to_status, comment, timestamp)
  - `Notification` (user, message, link, is_read, created) — *optional, see §0.3*
- [ ] State machines:
  - Request: `draft → submitted → approved | rejected | returned`; `returned` is editable like `draft` → `submitted …`
  - Timesheet: `draft → submitted → approved | returned`; `returned` is editable → `submitted …`
  - Approver: direct manager; HR if owner has no manager; HR may act on any; never self
- [ ] `docs/api.md` – endpoint list + permission matrix (rows = endpoints, columns = Employee / Manager / HR)
- [ ] Security design: ownership checks via `get_queryset()`, 404 for out-of-scope objects, input validation in serializers, secrets in `.env`

**Outcome:** No modelling decisions left for implementation days.

---

### Stage 7 – Implementation · ~~24–29 Sep~~ → 3–4 Oct, see §0.4 (24 pts: backend 12 + frontend 12)

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
| Deployment problems on 3 Oct | ~~Deploy on 25 Sep~~ (missed). Deploy backend on Sat 3 Oct evening, frontend Sun 4 Oct; never leave first deploy to Monday |
| Lost 11 days (found 2 Oct) | Rescue schedule §0.4 + cut list §0.3. Use Django admin for HR user management instead of custom UI |
| Spec writing eats Friday | Keep specs compact: stories + acceptance criteria + task IDs. Do not polish `001` / `005` |
| Frontend polish eats backend time | Frontend UI kit is done; only wire pages. Do not redesign components |
| Losing traceability | Task ID in every commit message from day one |
