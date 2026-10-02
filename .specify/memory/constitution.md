# SAWA Constitution

<!--
Sync Impact Report
- Version change: (none — initial ratification) → 1.0.0
- Modified principles: n/a (first adoption)
- Added sections: Core Principles I–VII, Technology Constraints,
  Development Workflow & Quality Gates, Governance
- Removed sections: none
- Follow-up TODOs: none
-->

## Core Principles

### I. Product Scope Discipline

Every feature MUST solve a problem documented in `docs/discovery/` and MUST stay inside
`docs/discovery/mvp-scope.md`. Items listed as out-of-scope require an explicit, recorded
scope change before any work begins. When forced to choose, the smaller coherent feature
wins over the larger incomplete one — the project is judged on quality of decisions, not
feature count.

### II. UX State Completeness

Every asynchronous screen MUST implement loading, empty, error, and success states. The
two core flows — request submission and time logging — MUST be completable in under two
minutes on mobile. Role-based UI MAY hide controls a role cannot use, but hiding MUST
never be treated as a security measure (see Principle IV).

### III. Design System First

UI MUST be built from the components in `frontend/src/components/` and the tokens in
`frontend/src/index.css`. Arbitrary colors, spacing, or one-off component variants are
prohibited; extend the system instead. All layouts MUST work at 375px, 768px, and 1280px.

### IV. Server-Side Authority (NON-NEGOTIABLE)

Permissions and business rules are authoritative in Django/DRF, never only in the UI.
Every endpoint MUST declare a permission class, and every queryset MUST be filtered by
`request.user`. Input MUST be validated in serializers; error responses MUST be useful
without leaking internals. Rationale: authorization is verified through API behavior by
evaluators — hidden frontend controls prove nothing.

### V. Migration-Only Schema Changes

All database schema changes MUST go through Django migrations and MUST preserve existing
data. Destructive resets are prohibited as a delivery method. Every model change MUST be
recorded in `docs/database.md`.

### VI. Security by Default

Ownership boundaries are enforced server-side: accessing an object outside the caller's
scope MUST return 404 (not 403), so existence is not leaked. Secrets and credentials MUST
live in environment variables and MUST never be committed. Authentication is JWT; every
non-public endpoint requires it.

### VII. Tested Critical Flows

Critical workflows and all authorization rules MUST have automated tests. Every feature
MUST ship with at least one "attack test" — a user attempting an action outside their
scope. A slice is not done until it works end-to-end and its tests pass.

## Technology Constraints

- Backend: Django + Django REST Framework (fixed by product brief).
- Database: PostgreSQL with versioned migrations (fixed by product brief).
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS v4, building on the delivered
  design system.
- API: documented REST (drf-spectacular), with validation, authorization, filtering,
  and pagination on list endpoints.
- Language: English-first UI; Arabic support is post-MVP.
- Secrets: `.env` files, never source control.

## Development Workflow & Quality Gates

- Work proceeds in vertical slices (API → screen → test), one slice per day during
  Stage 7.
- Every task carries an ID `T-<feature>-<n>` which MUST appear in the commit message.
- Every feature links spec → plan → tasks → commits → tests (traceability evidence).
- AI-assisted work MUST be logged in `docs/ai-usage.md`: tool used, what it generated,
  what was rejected or corrected, how it was verified.
- No commit lands without the author reviewing generated code for architecture,
  security, UX, correctness, and scope compliance.

## Governance

- This constitution supersedes other practices; amendments require documentation in
  this file, a version bump, and a stated rationale.
- Versioning: MAJOR for principle removals/redefinitions, MINOR for added or materially
  expanded principles/sections, PATCH for clarifications.
- All specs, plans, reviews, and demos MUST verify compliance; violations block the
  feature, not the principle.

**Version**: 1.0.0 | **Ratified**: 2026-09-21 | **Last Amended**: 2026-09-21
