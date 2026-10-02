# Feature Specification: Timesheets

**Feature Branch**: `004-timesheets`

**Created**: 2026-10-02

**Status**: Draft

**Input**: MVP core modules 5–6 (Timesheets, Timesheet Review) per `docs/discovery/mvp-scope.md`; decisions from `docs/plan.md` §0.2 (per-entry status, bulk submit, validation rules).

## Overview

Employees log daily time entries — date, start/end time, optional note — keep them as drafts, then submit one or many for review. Submitted entries are locked; approvers approve or return them (a return unlocks editing). Status lives on each entry — there is no weekly header. Managers review their direct reports' entries; HR may review any. Every review is recorded in a history timeline.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log and manage daily time entries (Priority: P1) 🎯 MVP

An employee records time worked for a day — a date, a start and end time, an optional short note. The system computes the hours. Entries stay editable drafts until submitted. The system rejects impossible entries: end before start, future dates, and time ranges that overlap another entry on the same day.

**Why this priority**: Time logging is the core employee journey (Goal 2: streamline time tracking); review adds nothing without entries to review.

**Independent Test**: Sign in, create a draft entry and see computed hours; try invalid times, a future date, and an overlapping range — each refused; edit and delete drafts freely.

**Acceptance Scenarios**:

1. **Given** a signed-in employee, **When** they create an entry with a past/today date, `end_time` after `start_time`, and an optional note ≤500 chars, **Then** it is saved as a draft with computed hours.
2. **Given** an end time equal to or before start time, a future date, or a time range overlapping the owner's existing entry that day, **When** they submit the entry, **Then** it is refused with a validation error.
3. **Given** an existing draft being edited, **When** the new range would overlap the owner's other entries (excluding itself), **Then** the edit is refused.
4. **Given** a draft entry, **When** the owner edits or deletes it, **Then** the change applies.
5. **Given** a submitted or approved entry, **When** the owner tries to edit it, **Then** the edit is refused as an invalid state transition.
6. **Given** a returned entry, **When** the owner edits it, **Then** it becomes editable like a draft.

---

### User Story 2 - Submit entries for review (Priority: P2)

An employee submits a single draft or a whole batch of drafts/returned entries at once. A bulk submission is all-or-nothing: if any entry in the batch is not the caller's own draft/returned entry, the entire submission fails and nothing changes. Once submitted, entries are read-only until an approver returns them.

**Why this priority**: Submission is what unlocks the review workflow; the atomic bulk rule prevents partial, confusing states.

**Independent Test**: Submit one entry and a batch of several; verify a batch containing a non-owned or wrong-state entry fails entirely with no status changed.

**Acceptance Scenarios**:

1. **Given** a draft or returned entry, **When** the owner submits it, **Then** its status becomes submitted with submission time recorded.
2. **Given** several draft/returned entries owned by the caller, **When** they bulk-submit all ids, **Then** every entry becomes submitted.
3. **Given** a bulk request containing an entry owned by someone else or already submitted, **When** submitted, **Then** the whole call fails and no entry changes.
4. **Given** a submitted entry, **When** the owner tries to edit or delete it, **Then** it is refused.
5. **Given** a returned entry, **When** the owner edits and resubmits it, **Then** it returns to submitted.

---

### User Story 3 - Review timesheets and browse history (Priority: P3)

A manager sees submitted entries from direct reports and approves or returns them — a return always requires a comment. HR may review any submitted entry. Nobody approves their own entry. All roles browse entries with the same visibility rules as requests (own; +reports' non-draft for managers; all non-draft + own for HR), with filters for status, owner, and date range, plus a "pending my action" view and a review history timeline.

**Why this priority**: Review and tracking complete the accountability loop (Goals 2–3) but require submitted entries to exist.

**Independent Test**: Manager approves/returns a report's entry; owner cannot self-approve; other team's entries are invisible; returned entry becomes editable again; timeline shows each decision.

**Acceptance Scenarios**:

1. **Given** a submitted entry from a direct report, **When** the manager approves it, **Then** status becomes approved (final) and a history record is written.
2. **Given** a submitted entry, **When** the approver returns it with a comment, **Then** status becomes returned and the owner can edit it again; returning without a comment is refused.
3. **Given** the owner or a manager of a different team, **When** they try to approve/return an entry, **Then** it is denied (own → not permitted; other team → behaves as non-existent).
4. **Given** a list view, **When** the caller filters by status/owner/date range or `pending my action`, **Then** results stay within their visibility scope; sorting by date/status and pagination work; total hours for listed entries can be shown.
5. **Given** an entry visible to the caller, **When** they open it, **Then** the detail shows the ordered status timeline.

### Edge Cases

- Overnight entries (end ≤ start) are rejected rather than supported.
- `hours` is always computed server-side; client-supplied hours are ignored.
- Bulk submit of an empty id list is refused as invalid.
- A manager's own submitted entries await HR (or their own manager), not themselves.
- Drafts are private — a manager never sees a report's draft entries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Authenticated users MUST be able to create a time entry with date, start time, end time, and optional note (≤500 chars); entries start as `draft` owned by the creator.
- **FR-002**: The system MUST compute `hours` from start/end times server-side and MUST ignore client-supplied hour values.
- **FR-003**: Validation MUST reject: `end_time` ≤ `start_time` (no overnight entries), future dates, and ranges overlapping another of the owner's entries on the same date (excluding the entry being edited).
- **FR-004**: The owner MUST be able to edit/delete `draft` entries; `returned` entries are editable again; `submitted`/`approved` entries are read-only — edits are refused.
- **FR-005**: The owner MUST be able to submit `draft` or `returned` entries, singly and in bulk; bulk submission MUST be atomic — any non-owned or wrong-state id fails the whole call with no changes.
- **FR-006**: The approver (owner's direct manager, or HR when none; HR on any submitted entry; never the owner) MUST be able to `approve` or `return` a submitted entry; `return` MUST require a non-empty comment.
- **FR-007**: `approved` MUST be final.
- **FR-008**: Visibility MUST mirror requests: employees see own; managers see own + direct reports' non-draft; HR sees own + all non-draft; out-of-scope objects behave as non-existent.
- **FR-009**: Every status change MUST write a history record (actor, from-status, to-status, comment, timestamp), exposed on the entry detail as an ordered timeline.
- **FR-010**: List endpoints MUST support filters `status`, `owner`, `date_from`, `date_to`, `pending_my_action=true`; sorting by date and status (default newest date first); pagination (default 20, max 100).
- **FR-011**: The time-logging form MUST be completable in under 2 minutes on mobile (constitution II).
- **FR-012**: Error responses MUST follow the shared contract — 401/404/403/400 — without leaking internals.

### Key Entities

- **TimesheetEntry**: owner, date, start/end time, computed hours, optional note, status (`draft`/`submitted`/`approved`/`returned`), created/updated/submitted/reviewed timestamps.
- **TimesheetStatusHistory**: one row per transition — entry, actor, from-status (empty on creation), to-status, comment, timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An employee logs a day's time entry in under 2 minutes on a mobile-width screen.
- **SC-002**: Bulk submission is atomic in 100% of cases — a batch with any invalid id changes 0 entries.
- **SC-003**: 100% of invalid entries (reversed times, future dates, overlaps) are rejected before saving.
- **SC-004**: 100% of unauthorized access attempts (other employee's entry, other team's entries, self-approval) are denied per the error contract.
- **SC-005**: 100% of status changes produce an accurate timeline entry.
- **SC-006**: A returned entry is editable by its owner again 100% of the time (read-only rule lifted only by `return`).

## Assumptions

- Status is per entry; there is no weekly header entity — bulk submit covers "submit my week".
- Approved entries never reopen; corrections after approval are out of MVP scope.
- `hours` may exceed a day only through multiple entries; overnight shifts are not supported in MVP.
- Scope follows `docs/discovery/mvp-scope.md` modules 5–6 and constitution principles I, II, IV, VI, VII.
