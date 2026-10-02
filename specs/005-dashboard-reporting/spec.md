# Feature Specification: Dashboard & (Optional) Notifications

**Feature Branch**: `005-dashboard-reporting`

**Created**: 2026-10-02

**Status**: Draft

**Input**: Reduced scope per `docs/plan.md` §0.3 — dashboards reduced to one summary endpoint per role; notifications only if the schedule holds; reports/CSV cut.

## Overview

The landing screen gives each role an at-a-glance answer to "what needs my attention": my requests and time entries by status, hours this week; managers additionally see pending team work; HR sees organization-wide numbers. All figures obey the same visibility rules as features 003/004 — drafts count only for their owner. Optionally, an in-app notification feed tells users when an item they touched changes state.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Role-shaped dashboard summary (Priority: P1) 🎯 MVP

Every signed-in user lands on a dashboard with stat cards: their own requests and timesheet entries counted by status, and their hours logged this week (Mon–Sun). A manager additionally sees team cards — pending requests and timesheets awaiting their decision, and team hours this week. HR sees organization cards — all pending (non-own) items, org hours this week, and user counts by role.

**Why this priority**: It is the landing page and the persona "see it at a glance" payoff (personas 2–3); also the only dashboard scope that survives the cut list.

**Independent Test**: Sign in as each role against seeded data; verify the payload sections match the role and that team/org numbers exclude what the caller may not see.

**Acceptance Scenarios**:

1. **Given** a signed-in employee, **When** they open the dashboard, **Then** they see `my_requests` by status, `my_entries` by status, and `my_hours_this_week` — and no `team` or `org` section.
2. **Given** a manager, **When** they open the dashboard, **Then** they additionally see `team` pending counts (only items awaiting *their* decision) and `team_hours_this_week` limited to direct reports' non-draft entries.
3. **Given** HR, **When** they open the dashboard, **Then** they see `org` pending counts (all submitted, excluding their own items), org `hours_this_week` (all non-draft), and `users_by_role`.
4. **Given** manager A and manager B each with pending items, **When** A reads the dashboard, **Then** B's team contributes nothing to A's numbers.
5. **Given** a user, **When** they open the dashboard, **Then** they get quick actions: New request, Log time, and (manager/HR) Approvals.

---

### User Story 2 - In-app notifications (Priority: P2 — OPTIONAL)

**This whole story is optional**: implement only if Sunday 4 Oct is on schedule by 18:00 (`docs/plan.md` §0.4).

When a request or timesheet entry is submitted, the approver is notified (the direct manager, or all HR users if the owner has no manager). When an item is approved, rejected, or returned, the owner is notified. Notifications carry a message and a link, show unread count in a bell, and can be marked read individually or all at once.

**Why this priority**: Nice feedback loop, but the system is fully usable without it — it is the first thing cut under schedule pressure.

**Independent Test**: Submit a request → approver's bell shows unread; approve it → owner's feed gains a notification; mark-read updates the count; another user's notification is unreachable.

**Acceptance Scenarios**:

1. **Given** a submitted item, **When** the transition completes, **Then** the approver (or all HR if no manager) receives a notification in the same transaction.
2. **Given** an approve/reject/return decision, **When** it completes, **Then** the owner receives a notification.
3. **Given** a signed-in user, **When** they open the bell, **Then** they see their own notifications, unread first, with an unread count — never anyone else's.
4. **Given** a notification id belonging to another user, **When** the caller opens or marks it read, **Then** the system behaves as if it does not exist.

### Edge Cases

- Dashboard numbers never widen visibility: drafts appear only in the owner's own-status counts.
- A manager's own pending items do not appear in their `team` pending counts (nobody approves their own).
- HR's `org` pending excludes HR's own items.
- "This week" is the current ISO week (Mon–Sun) in server-local time.
- Notifications: submission to a manager-less owner notifies every HR user.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A single dashboard summary MUST return role-shaped counts: all roles get `my_requests` by status, `my_entries` by status, `my_hours_this_week` (sum of own entries in the current ISO week, all statuses).
- **FR-002**: Managers MUST additionally get `team`: `pending_requests`, `pending_timesheets` (submitted items the caller may decide), `team_hours_this_week` (direct reports' non-draft entries).
- **FR-003**: HR MUST additionally get `org`: `pending_requests`, `pending_timesheets` (all submitted, excluding own), `hours_this_week` (all non-draft), `users_by_role`.
- **FR-004**: Dashboard payload MUST contain only the sections the caller's role may see — absent, not empty, for lower roles.
- **FR-005**: The dashboard page MUST show stat cards per section, quick actions (New request, Log time, Approvals for manager/HR), and full loading/empty/error states; it is the default landing route.
- **FR-006** *(optional, US2)*: Notifications MUST be created transactionally with each status transition: submit → approver (or all HR if no manager); approve/reject/return → owner.
- **FR-007** *(optional, US2)*: Users MUST be able to list own notifications (unread first, paginated, with unread count), mark one read, and mark all read; other users' notifications behave as non-existent.
- **FR-008**: All endpoints MUST follow the shared error contract (401/404/403/400) and pagination rules.

### Key Entities

- **Dashboard summary** *(computed, not stored)*: role-shaped aggregates over `Request` and `TimesheetEntry`.
- **Notification** *(optional)*: recipient user, message, link, read flag, created timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Each role's dashboard renders correct, scope-safe numbers in under 2 seconds on seeded data.
- **SC-002**: 0 out-of-scope items ever counted — manager A's team cards never include manager B's team (verified by test).
- **SC-003**: Employee payloads contain no `team`/`org` keys — verified by test.
- **SC-004** *(optional)*: 100% of transitions create the correct recipient notification; unread count matches reality.

## Assumptions

- Reports page, request-activity analytics, CSV export, and the HR employee-edit UI are **cut** (recorded as out of scope; HR uses the admin console).
- Dashboard is computed on read — no caching/materialized tables needed at demo scale.
- Notifications are in-app only (no email/SMS — out of scope per mvp-scope.md).
- Scope follows `docs/discovery/mvp-scope.md` module 7 (reduced per `docs/plan.md` §0.3) and constitution principles I, II, IV, VI, VII.
