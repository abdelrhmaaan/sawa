# Tasks: Authentication & Role-Based Access Control

**Input**: Design documents from `/specs/002-authentication-rbac/` (spec.md, plan.md)

**Prerequisites**: plan.md, spec.md

**Commit rule**: Every commit message must include the task ID(s) (e.g. `T-002-06`).

**Organization**: Tasks grouped by user story (US1/US2/US3 from spec.md) for independent implementation and testing.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: parallelizable (different files, no dependency on incomplete tasks)
- **[US1]/[US2]/[US3]**: maps to user stories in spec.md; Setup/Foundational/Polish tasks carry no story label

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Django project skeleton + dev environment that all features (002–004) build on.

- [x] T-002-01 Create backend skeleton: `backend/requirements.txt` (django==5.2.*, djangorestframework, djangorestframework-simplejwt, drf-spectacular, django-filter, django-environ, django-cors-headers, psycopg[binary], pytest-django, gunicorn, whitenoise) and `backend/config/` project package (`settings.py`, `urls.py`, `wsgi.py`, `asgi.py`)
- [x] T-002-02 [P] Add `docker-compose.yml` with `postgres:16` service and `.env.example` documenting `SECRET_KEY`, `DATABASE_URL`, `SEED_DEMO_PASSWORD`, `ALLOWED_HOSTS`, `DEBUG`, `CORS_ALLOWED_ORIGINS`
- [x] T-002-03 [P] Configure pytest: `backend/pytest.ini` (`DJANGO_SETTINGS_MODULE=config.settings`) and `backend/conftest.py` fixtures (`api_client`, `employee`, `manager_a`, `manager_b`, `hr_user` — 2 managers with 2 reports each so cross-team attack tests work)
- [x] T-002-04 [P] Configure DRF in `backend/config/settings.py` via django-environ: JWT authentication + `IsAuthenticated` default, page-number pagination (`PAGE_SIZE=20`, `page_size` query param, max 100), `django-filter` backend, drf-spectacular settings
- [x] T-002-05 Wire `GET /api/schema/`, `GET /api/docs/` (drf-spectacular Swagger UI) and `/admin/` in `backend/config/urls.py`; add safe exception handler in `backend/core/exceptions.py` (error bodies never include stack traces) and set as DRF `EXCEPTION_HANDLER`
- [x] T-002-06 [P] Configure CORS (`CORS_ALLOWED_ORIGINS` from env) and whitenoise static serving in `backend/config/settings.py` for the deploy target
- [x] T-002-07 Verify secrets hygiene: `.env` in `.gitignore`, settings read everything from env and fail closed (no committed `SECRET_KEY` fallback) — add a pytest asserting `DEBUG=False` honors `ALLOWED_HOSTS`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Custom user, permissions core, admin and seed — required before ANY user story. ⚠️ CRITICAL: no story work starts until this phase is green.

- [x] T-002-08 Implement `accounts.User` in `backend/accounts/models.py` (`AbstractBaseUser` + `PermissionsMixin`): `email` unique `USERNAME_FIELD`, `first_name`, `last_name`, `role` TextChoices `employee`/`manager`/`hr` default `employee`, `department` blank, `manager` FK→`self` null `on_delete=SET_NULL`, `is_active`, `is_staff`; `UserManager.create_user/create_superuser`; set `AUTH_USER_MODEL='accounts.User'`; `makemigrations`
- [x] T-002-09 Add `User.clean()` in `backend/accounts/models.py`: reject `manager == self` and walk the manager chain to reject cycles
- [x] T-002-10 Create `backend/core/` app: `permissions.py` (`IsHR`, `IsManagerOrHR`, `get_approver(user)` → owner's direct manager else HR, never self) and `pagination.py` (`StandardPagination`)
- [x] T-002-11 Register `User` in `backend/accounts/admin.py` (fieldsets incl. role/department/manager, list filters by role/department) so HR (`is_staff`) manages users via `/admin/`
- [x] T-002-12 Write `backend/accounts/management/commands/seed_demo.py`: idempotent (`update_or_create`) — 1 HR (`is_staff=True`), 2 managers (no manager), 4 employees (2 per manager); password from `SEED_DEMO_PASSWORD` env; leave extension points for 003/004 sample data
- [ ] T-002-13 [P] Frontend plumbing: add `react-router` dependency; create fetch wrapper `frontend/src/lib/api.ts` (attach in-memory access token; on 401 retry once after refreshing via localStorage refresh token, else force logout)
- [ ] T-002-14 Create `frontend/src/lib/auth.tsx` `AuthContext`/`useAuth`: `login`, `logout`, `user` state; access token in memory, refresh token in localStorage

**Checkpoint**: `docker compose up` works, `pytest` collects, `seed_demo` runs, `/api/docs/` renders — stories can start.

## Phase 3: User Story 1 — Sign in and reach my workspace (P1) 🎯 MVP

**Goal**: Email+password sign-in issuing a JWT pair; protected backend endpoints and frontend routes; silent refresh; logout.

**Independent Test**: `seed_demo` → login via `/api/docs/` or UI → protected page reachable only when signed in; reload keeps session; logout returns to login.

### Tests for User Story 1 — write FIRST, ensure they FAIL

- [x] T-002-15 [P] [US1] Happy-path tests in `backend/accounts/tests/test_auth.py`: `POST /api/auth/token/` returns access+refresh; `GET /api/me/` returns own profile incl. role; refresh returns a new rotated pair
- [x] T-002-16 [P] [US1] Attack tests in `backend/accounts/tests/test_auth.py`: wrong password → 401; unknown email → identical 401 body; no token on protected endpoint → 401; **inactive user** token obtain + refresh → 401
- [x] T-002-17 [P] [US1] Edge tests in `test_auth.py`: login email lookup is case-insensitive; a reuse/revoked refresh token is rejected after rotation

### Implementation for User Story 1

- [x] T-002-18 [US1] `EmailTokenObtainPairSerializer` in `backend/accounts/serializers.py` (email field, case-insensitive lookup, reject `is_active=False` with generic 401); wire `POST /api/auth/token/` + `POST /api/auth/token/refresh/` in `backend/config/urls.py`; set simplejwt lifetimes + `ROTATE_REFRESH_TOKENS=True` in settings
- [x] T-002-19 [US1] `MeSerializer` + `GET /api/me/` in `backend/accounts/serializers.py`/`views.py` returning email, names, role, department, manager (id + display name)
- [ ] T-002-20 [P] [US1] Build `frontend/src/pages/LoginPage.tsx` from `ui.tsx` components: email+password form, loading state, generic error on failure
- [ ] T-002-21 [US1] Wire `frontend/src/App.tsx`: `/login` public; all other routes behind a `RequireAuth` guard (unauthenticated → `/login`; restoring session shows a loading state, not a flash of login)
- [ ] T-002-22 [US1] `frontend/src/shell/Shell.tsx`: show real `user` from `useAuth` and a working logout button

**Checkpoint**: Full sign-in → workspace → reload → sign-out loop works end-to-end; attack tests green.

## Phase 4: User Story 2 — See and update my profile (P2)

**Goal**: Profile view + name-only edit; privilege-escalation attempts silently neutralized; role-aware navigation.

**Independent Test**: PATCH first/last name persists; PATCH `{"role":"hr"}` returns 200 but role unchanged in DB.

### Tests for User Story 2 — write FIRST, ensure they FAIL

- [x] T-002-23 [P] [US2] Tests in `backend/accounts/tests/test_me.py`: PATCH first/last name persists and is returned by GET; empty/invalid values → 400
- [x] T-002-24 [P] [US2] Attack test in `backend/accounts/tests/test_me.py`: PATCH `/api/me/` with `{"role":"hr","email":"x@y.z","department":"X","manager":<id>}` → 200 and all four fields unchanged in DB

### Implementation for User Story 2

- [x] T-002-25 [US2] Extend `MeSerializer` (`role`, `email`, `department`, `manager` `read_only`) and add `PATCH /api/me/` to the same view in `backend/accounts/serializers.py`/`views.py`
- [ ] T-002-26 [US2] `frontend/src/pages/ProfilePage.tsx`: view profile fields (role/department/manager shown read-only) + first/last name edit form built from `ui.tsx`
- [ ] T-002-27 [US2] Role-aware navigation in `frontend/src/shell/Shell.tsx`: nav items filtered by `user.role` (approvals link for manager/HR only — cosmetic; server enforces)

**Checkpoint**: Profile editable for names only; escalation attempt covered by a green test.

## Phase 5: User Story 3 — Directory & reporting lines scoped by role (P3)

**Goal**: Scoped user directory endpoints; admin-console management path verified.

**Independent Test**: Compare `GET /api/users/` output as hr / manager / employee; manager A probing manager B's report gets 404.

### Tests for User Story 3 — write FIRST, ensure they FAIL

- [x] T-002-28 [P] [US3] Visibility tests in `backend/accounts/tests/test_users.py`: HR list → all users; manager list → self + own direct reports only; employee list → 403; pagination envelope (`count`, `results`)
- [x] T-002-29 [P] [US3] Attack tests in `backend/accounts/tests/test_users.py`: manager A GET `/api/users/{id}/` of manager B's report → 404; employee GET own id → 200, other user → 404; manager GET self + own report → 200
- [x] T-002-30 [P] [US3] Model validation tests in `backend/accounts/tests/test_users.py`: `manager == self` rejected; A→B→A cycle rejected by `clean()`

### Implementation for User Story 3

- [x] T-002-31 [US3] `UserSerializer` (id, email, names, role, department, manager) + read-only `UserViewSet` in `backend/accounts/views.py`: `get_queryset()` scopes hr→all, manager→`Q(pk=self)|Q(manager=self)`; employee list → `PermissionDenied` (403), detail own id only (else 404); register in `backend/config/urls.py`
- [x] T-002-32 [US3] Verify HR admin path with a test in `backend/accounts/tests/test_users.py`: `is_staff` HR can edit role/manager via admin; `clean()` blocks self/cycle there too

**Checkpoint**: Directory scoping matches the permission matrix; `/admin/` is HR's only user-write path.

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T-002-33 [P] Update `docs/database.md` (User model + relations) and `docs/api.md` permission-matrix rows for auth/me/users endpoints
- [x] T-002-34 [P] Add drf-spectacular tags/descriptions so auth, me, users render cleanly in `/api/docs/` (`backend/config/urls.py`, `backend/accounts/views.py`)
- [ ] T-002-35 [P] Frontend UX-states pass: login + guarded pages show loading/empty/error states at 375px width (constitution II)
- [x] T-002-36 Update `README.md` dev quickstart (compose up, migrate, seed, runserver, vite dev, demo credentials location)
- [x] T-002-37 Run full `pytest` green; end-to-end smoke: `docker compose up` → `seed_demo` → login as each role → `/api/docs/` lists endpoints
- [ ] T-002-38 Log AI usage for this feature in `docs/ai-usage.md`

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** blocks all stories → **US1 (P1)** → **US2 (P2)** → **US3 (P3)** → Polish
- US2 depends on US1's `/api/me/` view (extends it); US3 depends on Foundational scoping only
- Within each story: tests first (must fail) → models/serializers → views/urls → frontend

### Parallel Opportunities

- Phase 1: T-002-02/03/04/06 parallel after T-002-01
- Foundational: T-002-13/14 (frontend) parallel with T-002-08..12 (backend)
- Story test tasks (all [P]) in parallel before implementation

## Implementation Strategy

**MVP first**: Phases 1–3 = sign-in slice, demoable alone. Then US2 (profile), then US3 (directory). Stop at any checkpoint if the rescue schedule slips.
