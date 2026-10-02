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
