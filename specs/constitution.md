# SAWA — Project Constitution

The canonical, versioned constitution lives at
[`.specify/memory/constitution.md`](../.specify/memory/constitution.md)
(Spec Kit location — all speckit commands read it there).

Ratified: 2026-09-21 · Version 1.0.0

## Principles at a glance

1. **Product Scope Discipline** — documented problems only, MVP scope only
2. **UX State Completeness** — loading / empty / error / success everywhere
3. **Design System First** — `frontend/src/components/` + tokens only
4. **Server-Side Authority** — permissions enforced in DRF, not the UI
5. **Migration-Only Schema Changes** — no destructive resets
6. **Security by Default** — 404 on out-of-scope objects, secrets in env
7. **Tested Critical Flows** — attack tests required per feature
