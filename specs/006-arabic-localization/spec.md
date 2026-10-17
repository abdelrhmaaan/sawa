# Feature Specification: Arabic Localization (English + Arabic, RTL)

**Feature Branch**: `006-arabic-localization`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "I need to add Arabic translation." Decisions recorded 2026-10-17: translate frontend **and** backend messages; the language is chosen with a toggle and remembered in the browser (not on the user profile); spec-first process. Scope change approved via constitution v1.1.0 (Arabic moved from post-MVP into scope).

## Overview

SAWA (سوا — "together") targets teams in Arabic-speaking organizations but shipped English-only. This feature lets every user switch the whole product between English and Arabic at any time. In Arabic the interface reads right-to-left, uses the brand's Arabic typeface, and every message the user sees — screen text, validation and error messages from the server, status and type labels, and notifications — appears in Arabic. Content that users type themselves (request titles, descriptions, notes, names) is shown exactly as entered.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch the interface to Arabic (Priority: P1) 🎯 MVP

Any visitor — before or after signing in — can switch the language between English and Arabic from a visible control. In Arabic, all screen text (navigation, page titles, buttons, form labels, placeholders, empty/loading/error states, toasts, dialogs, status and request-type labels, role names) is shown in Arabic, the page layout mirrors to right-to-left, and the Arabic brand typeface is used. The choice is remembered on that device and browser, so the next visit opens in the same language. English remains the default for a first visit.

**Why this priority**: This is the visible core of the request; without it nothing is in Arabic. It delivers value alone even if server messages are still English.

**Independent Test**: On a fresh browser, open the login page, switch to Arabic, sign in, and walk the two core flows (submit a request, log time) and the approvals screen — every fixed text is Arabic and the layout reads right-to-left; reload and confirm Arabic persists; switch back and confirm English and left-to-right return.

**Acceptance Scenarios**:

1. **Given** a first-time visitor, **When** they open the app, **Then** it is in English, left-to-right.
2. **Given** the login page in English, **When** the visitor switches to Arabic, **Then** the page immediately shows Arabic text in a right-to-left layout without a full reload and without losing typed input.
3. **Given** a signed-in user who chose Arabic, **When** they reload the page or come back later in the same browser, **Then** the app opens in Arabic.
4. **Given** the app in Arabic, **When** the user views lists, forms, dialogs, the dashboard, and the notification panel, **Then** no fixed English text remains (excluding user-entered content and brand name "SAWA").
5. **Given** the app in Arabic, **When** the user views it at 375px, 768px, and 1280px, **Then** navigation, menus, drawers, tables, and forms are mirrored correctly with no overlapping or clipped elements and no horizontal page scroll.
6. **Given** the app in Arabic, **When** the user signs out, **Then** the login page stays in Arabic.

---

### User Story 2 - Server messages in the chosen language (Priority: P2)

When the server rejects an action or reports a problem — wrong password, too many sign-in attempts, a required field missing, an invalid time range or overlapping entry, an item that can no longer be edited or deleted, a missing decision comment, an expired session — the message the user sees is in the language they are currently using.

**Why this priority**: Without it, an Arabic user hits English sentences at exactly the moments they most need to understand what went wrong. It depends on Story 1 for the language choice.

**Independent Test**: In Arabic, trigger each listed error (bad sign-in, too many attempts, overlapping time entry, end before start, future date, editing a submitted request, rejecting without a comment) and confirm the message is Arabic; repeat in English and confirm English.

**Acceptance Scenarios**:

1. **Given** the app in Arabic, **When** sign-in fails with wrong credentials, **Then** the error is shown in Arabic.
2. **Given** the app in Arabic, **When** the user logs a time entry that overlaps another or ends before it starts, **Then** the field error is shown in Arabic.
3. **Given** the app in Arabic, **When** an approver rejects or returns an item without a comment, **Then** the "comment required" message is shown in Arabic.
4. **Given** the app in English, **When** any of the above happens, **Then** the message is in English, unchanged from today.
5. **Given** a language the system does not support is requested, **When** the server answers, **Then** it answers in English.

---

### User Story 3 - Notifications in the reader's language (Priority: P3)

Notifications ("Sara Hassan submitted 'Eid leave' for approval", "Your request 'New monitor' was approved", timesheet equivalents) appear in the language the reader is currently using — not the language of the person who triggered them. A manager reading in Arabic sees Arabic notification text even if the employee who submitted uses English, and switching language changes how the notification list reads.

**Why this priority**: Notifications are a secondary, optional surface (feature 005 US2). Valuable for a complete Arabic experience, but the app is usable without it.

**Independent Test**: Employee (English) submits a request; manager opens notifications in Arabic and sees Arabic text with the request title and employee name intact; manager switches to English and sees the same notification in English.

**Acceptance Scenarios**:

1. **Given** an employee using English submits a request, **When** their manager opens the notification panel in Arabic, **Then** the notification text is Arabic and contains the employee's name and the request title exactly as entered.
2. **Given** a notification shown in Arabic, **When** the reader switches to English and reopens the panel, **Then** the same notification is shown in English.
3. **Given** notifications created before this feature shipped, **When** they are displayed in Arabic, **Then** they still appear (in their original English text) and nothing breaks.
4. **Given** approve, reject, and return decisions on requests and timesheet entries, **When** the owner reads the resulting notification in Arabic, **Then** the decision is named in Arabic.

---

### Edge Cases

- Mixed-direction text: an English request title inside an Arabic sentence (and vice versa) must display in the correct order and not scramble punctuation or quotes.
- User-entered content (titles, descriptions, notes, names, comments) is never translated or altered.
- Times, dates, and hour totals must stay unambiguous in Arabic; numbers in input fields keep the format users type.
- Icons that imply direction (back/forward arrows, chevrons, "next page") must point the right way in Arabic; icons with no direction (bell, check, user) must not be mirrored.
- A translation key missing in Arabic falls back to the English text rather than showing a blank or a raw key.
- Switching language while a dialog, drawer, or form is open keeps the user's input and open state.
- The browser tab title and the page's declared language/direction follow the current language (for screen readers and correct text shaping).
- Pagination text, counts, and plurals ("1 entry" / "3 entries") read naturally in Arabic, which has more plural forms than English.
- Too-many-attempts sign-in message includes the wait time and reads correctly in Arabic.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST offer English and Arabic, with English as the default for a first visit and as the fallback for anything not translated.
- **FR-002**: Users MUST be able to switch language from a control available on the sign-in page and on every signed-in page.
- **FR-003**: The system MUST remember the chosen language on the user's device and browser and apply it on the next visit, before the first screen is shown (no flash of the other language).
- **FR-004**: Switching language MUST take effect immediately, without signing out, without a full page reload, and without losing unsaved input.
- **FR-005**: In Arabic, the whole layout MUST read right-to-left (navigation position, alignment, spacing, menus, drawers, tables, form fields, pagination, toasts), and direction-implying icons MUST be mirrored.
- **FR-006**: In Arabic, the interface MUST use the brand's Arabic typeface (IBM Plex Sans Arabic per `docs/brand.md`); English keeps the current typeface.
- **FR-007**: All fixed interface text MUST be translatable: navigation, page titles, buttons, labels, placeholders, helper text, empty/loading/error/success states, dialogs, toasts, status labels, request-type labels, role labels, and the browser tab title.
- **FR-008**: The server MUST return user-facing messages (validation errors, sign-in errors, throttling messages, workflow errors such as "cannot edit in this status") in the language the client requests, and in English when the requested language is unsupported or absent.
- **FR-009**: Notifications MUST be displayed in the reader's current language, independent of the language of the user who triggered them, while preserving names and titles exactly as entered.
- **FR-010**: Notifications created before this feature MUST continue to display (in their original text) without errors.
- **FR-011**: User-entered content MUST never be translated, transformed, or re-ordered beyond what correct bidirectional display requires.
- **FR-012**: Dates and times MUST be formatted appropriately for the current language, and numbers MUST use Western digits (0–9) in both languages.
- **FR-013**: Every Arabic string MUST be reviewed by a fluent Arabic speaker before release; machine-drafted text is allowed as a starting point only.
- **FR-014**: Adding the language feature MUST NOT change permissions, scoping, or any business rule; all existing automated tests MUST still pass.

### Key Entities *(include if feature involves data)*

- **Language preference**: The user's current language (English or Arabic), stored on the device/browser only; not stored on the server or the user profile.
- **Translation catalog**: The set of English and Arabic texts for every fixed message, on both the interface and the server side. English is complete by definition; Arabic must cover every English entry.
- **Notification** *(existing, extended)*: In addition to its stored text, a notification records *what happened* (event kind) and the *values to insert* (e.g., person's name, item title, date, decision), so it can be shown in whichever language the reader uses. Older notifications have only the stored text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With Arabic selected, 100% of fixed interface text on every screen is Arabic (verified by a screen-by-screen walkthrough of all routes and dialogs), excluding user-entered content and the brand name.
- **SC-002**: An Arabic-speaking user can submit a request and log a time entry on a 375px phone in Arabic in under 2 minutes each — the same target as English (constitution II).
- **SC-003**: At 375px, 768px, and 1280px in Arabic, no screen has horizontal page scrolling, overlapping, or clipped elements.
- **SC-004**: Every server message a user can trigger in the two core flows, approvals, and sign-in appears in Arabic when Arabic is selected (verified by triggering each one).
- **SC-005**: Switching language takes effect on the current screen in under 1 second and survives a reload.
- **SC-006**: The Arabic translation catalog has zero missing entries compared with English at release.
- **SC-007**: All existing automated tests still pass; new automated tests cover language switching, persistence, right-to-left layout, Arabic server messages, and Arabic notifications.

## Assumptions

- Language choice is per device/browser only (user decision 2026-10-17); a signed-in user on a new device starts in English until they switch. Storing it on the profile is out of scope.
- The server learns the language from each request sent by the app; no server-side preference is stored.
- Western digits (0–9) are used in Arabic for consistency with typed input, hour totals, and dates — a common choice in Arabic business software.
- Modern Standard Arabic is used (no regional dialect).
- Initial Arabic text may be drafted by AI and must be reviewed by a fluent speaker before release (FR-013); this review is the user's responsibility.
- Out of scope: the Django admin, the API documentation page (Swagger), developer logs, seed/demo data content, and email/SMS (not in the product).
- Existing English notification texts remain as stored; only notifications created after release are fully bilingual.
- Requirement originates from `docs/brand.md` (product targets Arabic-speaking organizations; IBM Plex Sans Arabic chosen) and the scope change recorded in constitution v1.1.0; `docs/discovery/mvp-scope.md` is updated to match.
