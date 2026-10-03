# Tasks: Brand & Product Foundation

**Input**: Design documents from `/specs/001-brand-product-foundation/` (spec.md, plan.md)

**Commit rule**: Every commit message must include the task ID(s) (e.g. `T-001-03`).

**Note**: Retrospective task list — most work already landed. Commit hash recorded per task.

## Phase 1: Setup

- [x] T-001-01 Create `sawa/` repo layout (`frontend/`, `backend/`, `docs/`, `specs/`), root `.gitignore`, `git init` + first commit — landed `2404723`
- [x] T-001-02 Move Figma Make export into `frontend/`, strip Figma-only code, confirm `npm install && npm run build` works — landed `2404723`
- [x] T-001-03 Move `docs/discovery/` (problem-statement, personas, goals, mvp-scope) into repo — landed `2404723`

## Phase 2: Brand & Design System

- [x] T-001-04 Write `docs/brand.md`: name meaning, tagline, palette (from `index.css`), typography EN+AR, personality, usage rules — landed `2404723`
- [x] T-001-05 Add logo assets `docs/brand/`: `icon.svg`, `logo.svg`, `logo-dark.svg`, `logo-mono.svg` — landed `2404723`
- [x] T-001-06 Confirm design system deliverables in `frontend/src/`: `components/ui.tsx`, `components/overlays.tsx`, `shell/Shell.tsx`, tokens in `index.css`, catalogue `pages/DesignSystem.tsx` — landed `2404723`

## Phase 3: Governance & Planning

- [x] T-001-07 Write constitution (7 principles) at `.specify/memory/constitution.md` + pointer `specs/constitution.md` — landed `27afcbe`
- [x] T-001-08 Write `docs/plan.md` stage plan — landed `2404723`; revised with §0 re-plan (reality check, 16 decisions, cut list, rescue schedule) — landed `27afcbe`
- [x] T-001-09 Align `docs/discovery/mvp-scope.md` with §0.2 decisions (no attachments, no priority field) — landed `27afcbe`
- [x] T-001-10 SpecKit scaffolding: `.specify/` (templates, memory, skills wiring), `.devin/skills/` — landed `27afcbe`
- [x] T-001-11 Write specs 002–004 (spec/plan/tasks/checklists, `T-00x-nn` IDs) — landed `7c0edde`
- [x] T-001-12 Write specs 001/005 + `docs/database.md` + `docs/api.md` + `docs/ai-usage.md` — this batch

## Phase 4: Open

- [x] T-001-13 Write `README.md` (setup, architecture, tests, deployment, demo credentials) — cross-ref T-002-36, due by Mon 5 Oct
- [x] T-001-14 Write `docs/architecture.md` (browser → React → REST → Django → PostgreSQL diagram, hosting plan, JWT-storage trade-off note) — target Mon 5 Oct per `docs/plan.md` §0.4

---

## Implementation Strategy

Foundation already delivered; the two open docs close during the Mon 5 Oct feature-freeze morning (`docs/plan.md` §0.4).
