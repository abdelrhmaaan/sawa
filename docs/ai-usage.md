# SAWA — AI Usage Log

Constitution requirement: every AI-assisted contribution is logged with the tool, what it generated, what was rejected or corrected, and how it was verified.

## Policy

- Models and permission rules are written/reviewed by hand; AI is used for boilerplate (serializers, tests, forms, docs scaffolding).
- No commit lands without the author reviewing generated code for architecture, security, UX, correctness, and scope compliance.
- Entries are logged the same day the AI was used.

> **Note:** Earlier discovery/brand AI usage (21 Sep): to be filled by author.

## Log

| Date | Tool | Task | Output | Rejected / corrected | Verification |
|---|---|---|---|---|---|
| 2026-09-21 | Figma Make | UI design system + app shell | 32 components, tokens, shell exported to `frontend/` | Figma-only code stripped during repo setup | `npm run build` passes |
| 2026-10-02 | Devin (AI coding agent) | Plan review & re-plan | `docs/plan.md` §0: reality check, 16 issues + decisions, cut list, rescue schedule | Decisions made explicit instead of left open (e.g. attachments dropped, `EmployeeProfile` merged into `User`, Django 5.2 pinned for Python 3.10) | Checked against repo state (empty backend/specs) and `mvp-scope.md` |
| 2026-10-02 | Devin | SpecKit artifacts 002–004 | spec/plan/tasks/checklists, 107 tasks | Missing `django-cors-headers` dependency added to T-002-01 on review | Manual review of task lists vs plan §0 decisions; checklists |
| 2026-10-02 | Devin | Specs 001/005 + database.md + api.md + this file | Retrospective spec 001, reduced-scope spec 005 (dashboard + optional notifications), ERD + state diagrams, endpoint table + permission matrix, AI log scaffold | Placement of dashboard + notifications in `core` (no new app) accepted; no rule changes | Permission matrix in `api.md` checked row-by-row against 002–005 plans |
| 2026-10-02 | Devin (SWE-2 + sidekick delegation) | Backend: project scaffold, JWT auth, scoped users, requests & timesheets workflows *(backfill — logged 3 Oct)* | Django project + `docker-compose` Postgres, custom `User` (role/dept/manager FK), email JWT obtain/refresh rejecting inactive users, `/api/me` + scoped `/api/users/`, request & timesheet ViewSets with role-scoped querysets, submit/approve/reject/return actions writing history atomically, filters + pagination, `seed_demo`, pytest suite incl. attack tests | Enforced `get_approver` never returning the owner (no self-approval); uniform 401/403/404 semantics per `api.md` | `pytest -q` green on Postgres |
| 2026-10-03 | Devin (SWE-2 + sidekick delegation) | Dashboard endpoint + frontend auth foundation | `GET /api/dashboard/` role-shaped aggregates (my stats + `team`/`org` sections); `api.ts` fetch client — access token in memory, rotating refresh in `localStorage`, single dedup'd refresh on parallel 401s; `AuthProvider`, login page, protected routes, dashboard screen | None | `pytest -q`; manual login → dashboard flow |
| 2026-10-03 | Devin (SWE-2 + sidekick delegation) | Deploy: `render.yaml` blueprint + HTTPS settings | `sawa-api` web (gunicorn, collectstatic+migrate on build) + `sawa-db` managed Postgres + `sawa-frontend` static with SPA rewrite; `CSRF_TRUSTED_ORIGINS`, `SECURE_PROXY_SSL_HEADER`; `SEED_DEMO_PASSWORD` as `sync: false` | None | Env vars cross-checked against `settings.py` reads; fail-closed `ALLOWED_HOSTS` covered by `test_settings` |
| 2026-10-03 | Devin (SWE-2 + sidekick delegation) | All request/timesheet/approval screens + notifications + weekly seeds | Requests list/form/detail+timeline, approvals queue + decision dialog (comment required on reject/return), timesheets list/entry modal/manager review, `Notification` model + scoped endpoints + bell with unread badge, one-week-per-employee timesheet seed template | None | `pytest -q` (162 tests); manual walkthrough per role |
| 2026-10-03 | Devin (SWE-2 + sidekick delegation) | Seed fix: second HR user | `hr2@sawa.demo` added — HR-owned submitted items were undecidable because nobody may approve their own item and HR's approver is "another HR" | Single-HR seed made the no-self-approval rule untestable for HR items | e2e flow "hr sees submitted requests and can approve them" |
| 2026-10-03 | Devin (SWE-2 + sidekick delegation) | Playwright e2e smoke suite | `frontend/e2e/smoke.spec.ts` — 7 flows (login/dashboard, request draft→submit→approve→notification, employee scope blocks, timesheet log→submit→approve, read-only after submit, HR approve, logout/redirect); `workers: 1`, unique titles/notes per run so the suite is re-runnable | Shared dev DB approach chosen over per-test isolation for speed; overlap-safe timesheet helper retries slots on 400 | `npm run test:e2e` green against dev servers (:8000 + :5180) |
| 2026-10-03 | Devin (SWE-2 + sidekick delegation) | Dropdown fix | Shell user-menu items unclickable and menu opening off-viewport — fixed trigger/dropdown placement at viewport edge | None | e2e logout test exercises the menu; manual check |
| 2026-10-03 | Devin (SWE-2 + sidekick delegation) | README + architecture.md + responsive e2e pass | README (setup/tests/deploy/credentials), `docs/architecture.md` (diagram, JWT trade-off, hosting plan, env vars, cut list), `frontend/e2e/responsive.spec.ts` — 17 tests at 375/768/1280 asserting no horizontal scroll + mobile time-logging (SC-001) | None | `playwright test` 24/24 green; `tsc --noEmit` clean; `vite build` OK |
