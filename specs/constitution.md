# SAWA – Project Constitution

**Version:** 1.0 · **Date:** 2026-09-21 · **Status:** Ratified

This constitution governs every product, design, and engineering decision for SAWA.
When a spec, plan, or piece of code conflicts with it, the constitution wins.

## 1. Product

- Every feature solves a problem documented in `docs/discovery/` and stays inside the MVP scope.
- Anything listed as out-of-scope in `docs/discovery/mvp-scope.md` needs an explicit scope change before it is built.
- When forced to choose, prefer the smaller coherent feature over the larger incomplete one.

## 2. UX

- Every asynchronous screen must have loading, empty, error, and success states.
- Request submission and time logging are the core flows: keep them under 2 minutes, on mobile too.
- Role-based UI: hide what a role cannot use, but never rely on hiding as a security measure.

## 3. Design

- Use only the design system in `frontend/src/components/` and tokens in `frontend/src/index.css`.
- No arbitrary colors, spacing, or one-off component variants. Extend the system instead.
- All layouts must work at 375px, 768px, and 1280px widths.

## 4. Backend

- Permissions and business rules are authoritative on the server (DRF), never only in the UI.
- Every endpoint has a defined permission class and a queryset filtered by `request.user`.
- Every input is validated in serializers; error responses are useful and safe (no internals).

## 5. Database

- All schema changes go through migrations. No destructive resets.
- Migrations must preserve existing data.
- Model changes are recorded in `docs/database.md`.

## 6. Security

- Ownership boundaries are enforced server-side: out-of-scope objects return 404.
- Secrets and credentials live in environment variables, never in the repository.
- Authentication is JWT; every non-public endpoint requires it.

## 7. Quality

- Critical workflows and all authorization rules have automated tests.
- Each feature ships with at least one "attack test" (a user trying something they are not allowed to do).
- A slice is not done until it works end-to-end and its tests pass.

## Traceability

- Every task has an ID (`T-<feature>-<n>`) that appears in the commit message.
- Every feature links spec → plan → tasks → commits → tests.
- AI-assisted work is logged in `docs/ai-usage.md`.
