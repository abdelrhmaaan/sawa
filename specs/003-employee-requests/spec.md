# Feature Specification: Employee Requests

**Feature Branch**: `003-employee-requests`

**Created**: 2026-10-02

**Status**: Draft

**Input**: MVP core modules 3–4 (Employee Requests, Request Approvals) per `docs/discovery/mvp-scope.md`; decisions from `docs/plan.md` §0.2 (single-step approval, no attachments, no priority).

## Overview

Employees create requests (leave, equipment, work-from-home, HR service, general), edit them while drafting, and submit them for a single-step decision by their manager — or HR if they have no manager. Approvers approve, reject, or return the request for correction; every decision is recorded with who, when, and a comment. Employees always see where their request stands and why.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create, edit, and submit a request (Priority: P1) 🎯 MVP

An employee drafts a request — type, title, description — edits or deletes it while it is still a draft, then submits it. A returned request behaves like a draft again: editable, then resubmittable.

**Why this priority**: This is the core employee journey (Goal 1: centralize requests); everything else — approvals, history — hangs off it.

**Independent Test**: Sign in as an employee, create a draft, edit it, delete another draft, submit, and confirm it can no longer be edited; confirm a returned request becomes editable again.

**Acceptance Scenarios**:

1. **Given** a signed-in employee, **When** they create a request with a valid type, title (≤200 chars) and description, **Then** it is saved as a draft owned by them.
2. **Given** a draft or returned request, **When** the owner edits title/description/type, **Then** the changes are saved.
3. **Given** a draft or returned request, **When** the owner submits it, **Then** its status becomes submitted with the submission time recorded.
4. **Given** a submitted/approved/rejected request, **When** the owner tries to edit it, **Then** the edit is refused as an invalid state transition.
5. **Given** a draft request, **When** the owner deletes it, **Then** it is removed; deleting a submitted request is refused.
6. **Given** a submitted request that was returned by the approver, **When** the owner edits and resubmits it, **Then** it returns to submitted status.

---

### User Story 2 - Approve, reject, or return a request (Priority: P2)

A manager sees submitted requests from their direct reports and decides: approve, reject, or return for correction. Reject and return require a written comment; approving a comment is optional. Nobody can act on their own request — including HR. HR may act on any submitted request.

**Why this priority**: Delivers the accountability half of the flow (Goal 3: enforce roles); approvals only make sense once submission exists.

**Independent Test**: As a manager, open a report's submitted request, approve it; as the other team's manager, verify you cannot act on it; as an owner, verify you cannot approve your own.

**Acceptance Scenarios**:

1. **Given** a submitted request from a direct report, **When** the manager approves it, **Then** status becomes approved (final) with the decision time recorded.
2. **Given** a submitted request, **When** the approver rejects or returns it with a comment, **Then** the status changes accordingly and the comment is stored.
3. **Given** a submitted request, **When** the approver tries to reject or return it without a comment, **Then** the action is refused.
4. **Given** a submitted request owned by the caller, **When** the caller tries to approve/reject/return it, **Then** the action is denied as not permitted for their relationship.
5. **Given** a submitted request owned by another manager's report, **When** a manager tries to act on it, **Then** the system behaves as if the request does not exist.
6. **Given** an approved or rejected request, **When** anyone tries any further action, **Then** it is refused — these states are final.
7. **Given** a submitted request whose owner has no manager, **When** HR reviews it, **Then** HR can decide; HR can decide on any submitted request except their own.

---

### User Story 3 - Track requests and browse with filters (Priority: P3)

Employees browse their own requests; managers additionally see their reports' non-draft requests; HR sees all non-draft requests plus their own. Every request detail shows a timeline of status changes (actor, from→to status, comment, timestamp). Lists support filters (status, type, owner, creation window, "pending my action") and sorting, with pagination.

**Why this priority**: Visibility and findability complete the story (Goal 1 metric: 100% of requests through the platform) but the flow already works without filters.

**Independent Test**: Seed requests in varied statuses; verify each role's list contents, the draft-privacy rule, the timeline on detail, and each filter/sort.

**Acceptance Scenarios**:

1. **Given** an employee with requests, **When** they list requests, **Then** only their own appear (any status).
2. **Given** a manager, **When** they list requests, **Then** they see their own requests plus direct reports' requests — but never anyone's drafts.
3. **Given** HR, **When** they list requests, **Then** all non-draft requests appear plus their own drafts.
4. **Given** a request visible to the caller, **When** they open it, **Then** the detail shows the full status timeline in order.
5. **Given** filters for status/type/owner/date-range or `pending my action`, **When** applied, **Then** results are scoped to the caller's visibility AND the filter; sorting by creation, update, or status works; pagination applies.
6. **Given** a manager, **When** they open the approvals queue, **Then** only submitted requests awaiting their decision appear.

### Edge Cases

- Creating a request with client-supplied `owner` or `status` values: ignored — owner is always the caller, status always starts `draft`.
- Drafts are private: a report's draft does not appear in the manager's or HR's lists or detail access.
- Resubmitting a returned request keeps its history — the timeline shows the full loop.
- Approving/rejecting an already-decided request is refused (final states).
- Owner filter combined with role scope can only narrow, never widen, visibility.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Authenticated users MUST be able to create a request with a type (`leave`, `equipment`, `wfh`, `hr_service`, `general`), title (required, ≤200 chars), and description (required); new requests start as `draft` and are owned by the creator.
- **FR-002**: The owner MUST be able to edit type/title/description while the request is `draft` or `returned`, and delete it while `draft`.
- **FR-003**: Editing a request in any other status, or by a non-owner, MUST be refused.
- **FR-004**: The owner MUST be able to submit a `draft` or `returned` request, setting status `submitted` and recording submission time.
- **FR-005**: The approver (owner's direct manager, or HR when none; HR for any submitted item) MUST be able to `approve`, `reject`, or `return` a submitted request. `reject` and `return` MUST require a non-empty comment.
- **FR-006**: `approved` and `rejected` MUST be final; no further transitions are allowed.
- **FR-007**: Nobody MUST be able to act on their own request, including HR.
- **FR-008**: Visibility MUST be: employees — own requests; managers — own + direct reports' non-draft requests; HR — own + all non-draft requests. Objects outside scope MUST behave as non-existent.
- **FR-009**: Every status change MUST write a history record (actor, from-status, to-status, comment, timestamp), and the request detail MUST expose the timeline in order.
- **FR-010**: List endpoints MUST support filters `status`, `type`, `owner`, `created_after`, `created_before`, `pending_my_action=true`; sorting by creation, update, and status (default newest first); and page-number pagination (default 20, max 100).
- **FR-011**: Client-supplied owner or status on create MUST be ignored.
- **FR-012**: Error responses MUST follow the shared contract — 401 unauthenticated, 404 out-of-scope, 403 role-forbidden, 400 invalid state/input — without leaking internals.

### Key Entities

- **Request**: owner, type, title, description, status (`draft`/`submitted`/`approved`/`rejected`/`returned`), created/updated/submitted/decided timestamps.
- **RequestStatusHistory**: one row per transition — request, actor, from-status (empty on creation), to-status, comment, timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An employee can create and submit a request in under 2 minutes on a mobile-width screen.
- **SC-002**: 100% of unauthorized access attempts (other employee's request, other team's report, drafts of others, self-approval) are denied per the error contract.
- **SC-003**: 100% of status changes produce an accurate timeline entry; the displayed history always matches actual transitions.
- **SC-004**: Approvers acting on pending items see only items awaiting their decision — 0 out-of-scope items in the "pending my action" view.
- **SC-005**: Reject/return attempts without a comment are refused 100% of the time.

## Assumptions

- No file attachments and no priority field (out of scope per `docs/plan.md` §0.2).
- Single-step approval: approver = direct manager, else HR; no escalation chains.
- `returned` means "sent back for correction" — editable by owner, resubmittable.
- Request types are a fixed list; no HR-configurable types in MVP.
- Scope follows `docs/discovery/mvp-scope.md` modules 3–4 and constitution principles I, IV, VI, VII.
