# Feature Specification: Public Landing Page (`/welcome`)

**Feature Branch**: `007-public-landing-page`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Build a public marketing home page for SAWA" (full brief: navbar, hero, the pain, the shift, how it works, built for every role, trust strip, final CTA band, footer; brand rules from `docs/brand.md`; public route `/welcome`; all CTAs to `/login`; mobile-first, accessible, RTL-ready, subtle motion, no new dependencies). Decisions recorded 2026-10-17 after review of the brief:

1. **Copy lives in the translation catalogs** (`landing.*` keys in English and Arabic), not in a local constant — the constitution forbids hardcoded display text and feature 006 already provides the catalogs.
2. **Discoverability**: the root address `/` keeps sending signed-out visitors to the sign-in page. A redirect to `/welcome` was rejected because sign-out and session expiry also end on `/`, which would push returning employees to the marketing page every time. Instead, the sign-in page gets a small "What is SAWA?" link to `/welcome`.
3. **Every call to action reads "Sign in"** (not "Get started") — SAWA has no self sign-up; accounts are provisioned by HR.

Scope change: recorded as module 12 in `docs/discovery/mvp-scope.md`.

## Overview

SAWA has no public face: anyone opening the product sees a sign-in form with no explanation. This feature adds one public page that explains, in plain and warm language, what SAWA is, which problem it solves (requests lost across email, chat, paper and spreadsheets; no audit trail; time wasted chasing timesheets), how it works (submit → review → track), and what each role gets. Visuals are built from real product UI (request cards, status badges, a timesheet row, stat tiles), never stock photos. The page works in English and Arabic (right-to-left) and on phones, tablets, and desktops.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand SAWA and reach sign-in (Priority: P1) 🎯 MVP

A visitor who is not signed in (a new employee, a manager evaluating the tool, an HR lead) opens `/welcome`. Without signing in, they read what SAWA is, see the problem it solves, the three-step flow, the benefits for their role, and the trust points, and then click "Sign in" to reach the sign-in page.

**Why this priority**: This is the whole purpose of the page. Without it, nothing else matters.

**Independent Test**: In a fresh browser with no session, open `/welcome`; confirm the page renders fully without being redirected, every section is present in order, and every "Sign in" call to action leads to the sign-in page.

**Acceptance Scenarios**:

1. **Given** a visitor with no session, **When** they open `/welcome`, **Then** the page renders and they are not redirected to the sign-in page.
2. **Given** the page, **When** the visitor reads it top to bottom, **Then** they see, in order: navigation bar, hero, "Sound familiar?" problems, before/after strip, how it works, built for every role, trust strip, final call to action, footer.
3. **Given** any "Sign in" call to action on the page, **When** the visitor activates it, **Then** they arrive at the sign-in page.
4. **Given** a visitor who is already signed in, **When** they open `/welcome` and click "Sign in", **Then** they arrive at their dashboard (the sign-in page already forwards signed-in users).
5. **Given** a signed-out visitor on the sign-in page, **When** they click "What is SAWA?", **Then** they arrive at `/welcome`.
6. **Given** a signed-out visitor, **When** they open `/` or any other protected address, **Then** behaviour is unchanged: they are sent to the sign-in page.

---

### User Story 2 - Navigate the page comfortably on any device (Priority: P2)

On a phone the navigation collapses into a menu; on tablet and desktop the section links are visible. Section links jump to the right section without the sticky bar hiding its heading. Keyboard and screen-reader users can operate everything.

**Why this priority**: Most employees will first open the link on a phone (constitution II targets mobile). The page is still useful without polished navigation, so it ranks after P1.

**Independent Test**: At 360px, open the menu, pick "How it works", confirm the menu closes and the section heading is visible below the bar; repeat at 1280px with the inline links; repeat using only the keyboard.

**Acceptance Scenarios**:

1. **Given** a 360px-wide screen, **When** the visitor opens the menu button, **Then** the section links and "Sign in" appear, and the button reports its open state to assistive technology.
2. **Given** the menu is open, **When** the visitor picks a link, presses Escape, or taps the button again, **Then** the menu closes; after Escape, focus returns to the menu button.
3. **Given** any width, **When** the visitor follows a section link, **Then** the target section's heading is fully visible below the sticky bar.
4. **Given** keyboard-only use, **When** the visitor tabs through the page, **Then** every interactive element shows a visible focus ring, in a logical order.
5. **Given** widths 360, 375, 768, 1024, and 1280px, **When** the page is viewed, **Then** there is no horizontal page scroll and no overlapping or clipped content, and every tap target is at least 44×44px.

---

### User Story 3 - Read the page in Arabic (Priority: P3)

A visitor switches the language from the navigation bar. The whole page, including product mock text, reads in Arabic, right-to-left. The choice is the same one the rest of SAWA uses, so the sign-in page opens in Arabic too.

**Why this priority**: SAWA targets Arabic-speaking organizations (`docs/brand.md`), but the page can launch first in English if Arabic review lags.

**Independent Test**: On `/welcome`, switch to Arabic; confirm all page text is Arabic, the layout is mirrored, then click "Sign in" and confirm the sign-in page is Arabic.

**Acceptance Scenarios**:

1. **Given** the page in English, **When** the visitor uses the language switch, **Then** all fixed page text becomes Arabic and the layout mirrors right-to-left, without a reload.
2. **Given** Arabic is chosen, **When** the visitor reloads or navigates to sign-in, **Then** Arabic is kept.
3. **Given** Arabic, **When** viewed at 360/768/1280px, **Then** acceptance scenario US2-5 still holds.

---

### Edge Cases

- **Reduced motion**: with the operating system's "reduce motion" setting on, nothing animates (no fade/slide, no smooth scroll); all content is visible immediately.
- **No scroll-animation support / script failure**: content must never stay hidden waiting for an animation; it is visible by default and only enhanced.
- **Sticky bar over anchors**: headings must not be hidden under the bar after a jump.
- **Long Arabic strings**: Arabic text is often longer or shorter than English; cards, buttons, and the hero must wrap gracefully without overflow.
- **Product mocks in RTL**: the status timeline and arrows read in the correct direction; icons with no direction (check, clock, bell) are not mirrored.
- **Brand logo in RTL**: the logo is never mirrored.
- **Signed-in visitor**: the page still renders (it is public); it never makes calls that need a session and never shows personal data.
- **Very wide screens (≥1536px)**: content stays in a centered readable column; backgrounds may extend full width.
- **Zoom to 200%**: content reflows without loss (WCAG 1.4.4/1.4.10).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page MUST be reachable at `/welcome` without signing in, and MUST NOT change the behaviour of `/` or any other existing address.
- **FR-002**: Every call to action on the page MUST read "Sign in" (translated) and lead to the sign-in page. Each section MUST contain at most one primary call to action.
- **FR-003**: The sign-in page MUST offer a small, secondary "What is SAWA?" link to `/welcome`.
- **FR-004**: The page MUST contain, in order: (1) navigation bar with logo, links to Problem / How it works / Roles, language switch, and "Sign in"; (2) hero with headline built on "Every request. Every hour. Together.", the one-line subheadline, a primary "Sign in" and a secondary "See how it works" link, and a product mock (leave request card with a Submitted → Approved timeline, a "3 pending approvals" tile) over a soft shape echoing the logo's two overlapping circles; (3) "Sound familiar?" with three problem cards — no visibility, no accountability, wasted time; (4) before/after strip — scattered channels (email, chat, paper, spreadsheet) versus one SAWA card, with the line "Everything, together."; (5) how it works — Submit, Review, Track; (6) built for every role — Employee, Manager, HR, each with 2–3 concrete benefits from `docs/discovery/personas.md`; (7) trust strip — role-based access, full status history with timestamps, English + Arabic (RTL); (8) final call-to-action band "Bring your team together." with one "Sign in"; (9) footer with single-colour logo, tagline, and © current year.
- **FR-005**: All visual content MUST be built from product UI (cards, status badges, timeline, timesheet row, stat tiles) and icons; no photographs or large images. Status colours MUST follow the brand mapping: draft = neutral, submitted = info, approved = success, rejected = error, returned = warning.
- **FR-006**: The navigation bar MUST stay at the top while scrolling, with a light translucent blur, and MUST collapse into a menu button below tablet width. The menu MUST expose its open/closed state, close on link selection and Escape, and return focus to the button on Escape.
- **FR-007**: Section links MUST land with the section heading fully visible below the sticky bar.
- **FR-008**: All fixed text on the page (including mock UI text, alternative text, and accessible labels) MUST come from the English/Arabic translation catalogs; Arabic MUST cover every English entry. The browser tab title MUST be set for this page in the current language.
- **FR-009**: In Arabic the page MUST mirror right-to-left using direction-aware spacing and alignment; direction-implying icons MUST mirror; the logo MUST NOT.
- **FR-010**: The page MUST follow the brand: primary blue only for actions (hover darker), deep blue for accents, light blue fills; brand neutrals; the product typeface; button radius 8px, card radius 12px; only the existing shadow levels. The final call-to-action band is the single documented exception where primary blue is used as a background; its button is white with blue text.
- **FR-011**: The hero headline MUST use the display style (36px/800) and MAY scale up to about 56px on large screens via a new display token added to the design system (no one-off sizes).
- **FR-012**: The page MUST use landmark regions (header, main, footer), one level-1 heading (the hero headline), level-2 headings for each section, each section labelled by its heading, and MUST keep the visible focus ring. Text and interactive elements MUST meet WCAG 2.1 AA contrast.
- **FR-013**: Motion MUST be subtle (fade/slide on entering the viewport), MUST be disabled when the visitor prefers reduced motion, and content MUST be visible when animation is unavailable.
- **FR-014**: The page MUST NOT call any endpoint that requires a session and MUST NOT display any user or organisation data.
- **FR-015**: The feature MUST NOT add new third-party dependencies and MUST NOT change existing pages other than the "What is SAWA?" link on the sign-in page.

### Key Entities

- **Landing copy**: the set of English and Arabic texts for the page, grouped by section, in the shared translation catalogs.
- **Language preference** *(existing, feature 006)*: the per-browser language choice; the page reads and changes the same preference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-out visitor reaches the sign-in page from `/welcome` in one click from any section (navigation bar always visible).
- **SC-002**: At 360, 375, 768, 1024, and 1280px, in English and Arabic, the page has zero horizontal page scroll and zero clipped or overlapping elements.
- **SC-003**: Every text/background pair used on the page meets WCAG AA contrast (4.5:1 normal text, 3:1 large text), every interactive element has an accessible name, and every interactive element is reachable and operable by keyboard alone.
- **SC-004**: The main content is readable within 2 seconds on a mid-range phone over a typical 4G connection; the page adds no image files.
- **SC-005**: With Arabic selected, 100% of fixed page text is Arabic (brand name "SAWA" excepted), and the Arabic catalog has zero missing entries compared with English.
- **SC-006**: All existing automated tests still pass; new automated tests cover public access, calls to action, responsive layout in both directions, the mobile menu, reduced motion, and the "no session calls" rule.

## Assumptions

- Feature 006 (Arabic localization) Phase 1–3 is complete before this feature is implemented, so the catalogs, language switch, logical-direction utilities, and Arabic typeface already exist. The "English + Arabic (RTL)" trust line is only shown once 006 ships, which this sequencing guarantees.
- The page is purely informational: no contact form, pricing, sign-up, analytics, or cookie banner.
- Copy is plain and warm, drawn from `docs/discovery/problem-statement.md` and `docs/discovery/personas.md`; the "under 2 minutes" claim is backed by `docs/discovery/goals.md`.
- Arabic text may be machine-drafted and must be reviewed by a fluent speaker before release (same rule as feature 006, FR-013).
- The brand short tagline is "Work better together." (per `docs/brand.md`).
- Out of scope: SEO/server rendering, Open Graph images, a marketing domain, and changing what `/` shows.
