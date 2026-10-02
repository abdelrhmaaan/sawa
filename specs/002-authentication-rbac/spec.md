# Feature Specification: Authentication & Role-Based Access Control

**Feature Branch**: `002-authentication-rbac`

**Created**: 2026-10-02

**Status**: Draft

**Input**: MVP core modules 1–2 (Authentication & Users, Role-Based Access Control) per `docs/discovery/mvp-scope.md`; decisions from `docs/plan.md` §0.2.

## Overview

SAWA replaces fragmented request and time-tracking channels with one secure workspace. This feature delivers the identity layer every other feature builds on: email-based sign-in, user profiles with roles, reporting lines (who manages whom), and the per-role visibility rules enforced server-side.

Roles throughout: **employee**, **manager**, **hr**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in and reach my workspace (Priority: P1) 🎯 MVP

A staff member opens SAWA, enters email and password, and lands in the app with a session that identifies them and their role. They can sign out. Anyone without valid credentials gets nothing.

**Why this priority**: Nothing else in the product is reachable without a session; it is also the first security boundary evaluators test.

**Independent Test**: With only this story deployed, a seeded user can sign in, see their name and role in the app shell, reload the browser and stay signed in, and sign out.

**Acceptance Scenarios**:

1. **Given** a seeded active user, **When** they submit correct email + password, **Then** they receive session credentials and land in the app.
2. **Given** a user, **When** they submit a wrong password or an unknown email, **Then** access is denied with a generic error (no hint which part was wrong).
3. **Given** a deactivated user, **When** they submit correct credentials, **Then** access is denied.
4. **Given** no valid session, **When** the user calls any protected endpoint or opens a protected page, **Then** access is denied and the app shows the login screen.
5. **Given** a signed-in user whose session credential expires, **When** they keep working, **Then** the session is silently renewed without re-entering the password.

---

### User Story 2 - See and update my profile (Priority: P2)

A signed-in user sees their profile (name, email, role, department, manager) and can correct their first/last name. Role, email, department, and reporting line are read-only to them — only HR can change those.

**Why this priority**: Profile data drives the UI (name in the shell, role-aware navigation) and "cannot escalate own privileges" is a judged security requirement.

**Independent Test**: Sign in, view profile, change last name and verify it persists; attempt to change own role and verify it stays unchanged.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they view their profile, **Then** they see email, full name, role, department, and manager.
2. **Given** a signed-in user, **When** they update first/last name, **Then** the change is saved and shown in the app shell.
3. **Given** a signed-in employee, **When** they submit a profile update containing a different role, email, department, or manager, **Then** the request succeeds but those fields remain unchanged.
4. **Given** a signed-in manager, **When** they open navigation, **Then** they see links relevant to their role (e.g. approvals); an employee does not see manager-only links. Hiding is cosmetic only — the server still enforces access.

---

### User Story 3 - Directory & reporting lines scoped by role (Priority: P3)

HR sees everyone. A manager sees themselves and their direct reports. An employee can see only their own record. HR administers users (create, deactivate, assign role and manager) through the built-in administration console — there is no self-service user management UI.

**Why this priority**: Visibility scoping and reporting lines are prerequisites for the approval features (003/004), but sign-in and profile already deliver a usable product slice.

**Independent Test**: Sign in as each seeded role and compare which directory entries are returned; verify HR can reassign a manager in the admin console and that self/cycle assignments are rejected.

**Acceptance Scenarios**:

1. **Given** an HR user, **When** they list the directory, **Then** all users are returned.
2. **Given** a manager, **When** they list the directory, **Then** only themselves and their direct reports are returned.
3. **Given** an employee, **When** they request the directory list, **Then** access is denied.
4. **Given** manager A, **When** they open the profile of a user managed by manager B, **Then** the system behaves as if that user does not exist.
5. **Given** an employee, **When** they open another user's profile, **Then** the system behaves as if that user does not exist; opening their own works.
6. **Given** HR in the admin console, **When** they assign a manager, **Then** a user cannot be their own manager and cycles are rejected.

### Edge Cases

- Unknown email vs wrong password produce the identical denial.
- A deactivated user's existing session credentials stop working on next use or renewal.
- Removing a user's manager leaves them manager-less; approval responsibility for their items falls to HR (handled by features 003/004).
- Profile updates containing read-only fields are accepted but those fields are ignored — stored values never change.
- Directory responses are paginated (default 20 per page, max 100 via `page_size`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST sign in with email + password; there is no username field.
- **FR-002**: Sign-in MUST be denied for unknown email, wrong password, or inactive accounts, with an identical generic denial.
- **FR-003**: Sessions MUST use a short-lived credential plus a renewable token so users stay signed in across page reloads.
- **FR-004**: Every endpoint except sign-in and credential renewal MUST require a valid session.
- **FR-005**: Every user MUST have exactly one role: `employee`, `manager`, or `hr` (default `employee`).
- **FR-006**: A user profile MUST include email (unique), first name, last name, role, optional department, and optional manager (reporting line to another user).
- **FR-007**: Users MUST be able to read their own profile and update only first/last name; submissions attempting to change role, email, department, or manager MUST leave those fields unchanged.
- **FR-008**: A user MUST NOT be assignable as their own manager, and manager assignments MUST NOT form cycles.
- **FR-009**: Directory visibility MUST be scoped: HR sees all users; a manager sees self + direct reports; an employee cannot list the directory and can read only their own record.
- **FR-010**: Objects outside the caller's visibility scope MUST be indistinguishable from "does not exist" — existence must not leak.
- **FR-011**: Actions not permitted for the caller's role on an otherwise visible object MUST be denied distinctly from "does not exist".
- **FR-012**: User creation, deactivation, and role/manager assignment MUST be performed by HR through the administration console; there is no public registration or user-write interface.
- **FR-013**: A repeatable seeding step MUST create the demo organization — 1 HR, 2 managers, 4 employees (2 reporting to each manager) — with a known demo password taken from configuration.
- **FR-014**: Error responses MUST be safe and generic; no stack traces or internal details are exposed.
- **FR-015**: Signed-in users MUST be able to sign out, ending the client session.

### Key Entities

- **User**: a staff member. Email (unique, sign-in identifier), first/last name, role, optional department, optional manager (self-referencing reporting line), active flag, administration-console flag (set for HR).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with valid credentials reaches their workspace in under 30 seconds.
- **SC-002**: 100% of automated unauthorized-access attempts (no session, wrong role, other manager's team member, self-privilege escalation) are denied with the specified behavior.
- **SC-003**: 0 objects outside a caller's scope are readable; probing for them yields the same result as probing non-existent records.
- **SC-004**: 100% of profile updates containing read-only fields leave those fields unchanged (verified by an automated test).
- **SC-005**: A returning user's session is restored after a browser reload without re-entering credentials, in under 3 seconds.

## Assumptions

- Email + password is sufficient for MVP; SSO is out of scope per `docs/discovery/mvp-scope.md`.
- All users are created by HR; there is no self-registration or password reset flow in MVP.
- HR staff are trusted with the administration console; audit of admin actions is out of scope.
- Demo passwords come from environment configuration and are never committed.
- Scope follows `docs/discovery/mvp-scope.md` modules 1–2 and constitution principles I (Product Scope Discipline), IV (Server-Side Authority), VI (Security by Default), VII (Tested Critical Flows).
