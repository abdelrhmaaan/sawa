# SAWA — Brand Package

**Date:** 21 September 2026 · **Status:** v1.0

---

## 1. Name & Meaning

**SAWA** (سوا) — Arabic for *"together"*.

### Naming rationale

The product replaces fragmented channels — email, WhatsApp, paper, scattered Excel files — with one shared workspace. Requests, timesheets, approvals, and oversight all happen *together*, in one place. The name is:

- **Short** — 4 letters, easy to say in English and Arabic.
- **Meaningful in both languages** — reads cleanly in English, carries real meaning in Arabic.
- **On-brand for the region** — the product targets teams in Arabic-speaking organizations, but ships English-first.

## 2. Tagline

> **"Every request. Every hour. Together."**

Short form (product UI, loading screens): **"Work, together."**

## 3. Logo

The mark is a rounded square in brand blue holding **two overlapping circles** — two people, two roles, two workflows meeting in one shared space. The overlap is the product.

| File | Use |
|---|---|
| `brand/icon.svg` | Product icon — app shell, favicon, avatars |
| `brand/logo.svg` | Primary logo — wordmark on light backgrounds |
| `brand/logo-dark.svg` | Wordmark on dark backgrounds |
| `brand/logo-mono.svg` | Single-color version — print, docs, stamps |

### Logo rules

- **Clear space:** keep empty space around the logo equal to the height of one circle in the mark.
- **Minimum size:** icon 24px, wordmark 90px wide.
- **Do not:** recolor the mark outside the brand palette, stretch it, place it on busy/low-contrast backgrounds, or separate the circles.

## 4. Color Palette

All colors are live tokens in `frontend/src/index.css` — the palette below is the source of truth for docs and marketing.

### Brand — Azure

| Token | Hex | Use |
|---|---|---|
| `brand-50` | `#EFF6FF` | Active/hover surfaces, selected rows |
| `brand-100` | `#DBEAFE` | Subtle brand fills |
| `brand-500` | `#3B82F6` | Secondary brand accents |
| `brand-600` | `#2563EB` | **Primary** — buttons, links, focus ring, logo |
| `brand-700` | `#1D4ED8` | Hover on primary |
| `brand-900` | `#1E3A8A` | Deep accents |

### Neutrals

| Token | Hex | Use |
|---|---|---|
| `page` | `#F8FAFC` | App background |
| `surface` | `#FFFFFF` | Cards, dialogs |
| `surface-alt` | `#F1F5F9` | Inset areas |
| `text-primary` | `#0F172A` | Headings, body |
| `text-secondary` | `#475569` | Supporting text |
| `text-muted` | `#64748B` | Captions, icons |
| `border` | `#E2E8F0` | Default borders |

### Semantic

| Meaning | Base | Subtle bg | Text on subtle |
|---|---|---|---|
| Success | `#16A34A` | `#F0FDF4` | `#166534` |
| Warning | `#D97706` | `#FFFBEB` | `#92400E` |
| Error | `#DC2626` | `#FEF2F2` | `#991B1B` |
| Info | `#0284C7` | `#F0F9FF` | `#0C4A6E` |
| Neutral/draft | `#64748B` | `#F8FAFC` | `#475569` |

Status mapping (requests & timesheets): draft → neutral, submitted → info, approved → success, rejected → error, returned → warning.

## 5. Typography

| Role | Font | Notes |
|---|---|---|
| English / UI | **Plus Jakarta Sans** | Loaded via Google Fonts in `index.css`. Weights 400–800. Geometric, modern, excellent at small sizes |
| Arabic (post-MVP) | **IBM Plex Sans Arabic** | Same geometric-humanist feel, full Arabic script support, pairs cleanly with Plus Jakarta Sans |

Type scale (implemented in `index.css`):

| Class | Size / Weight | Use |
|---|---|---|
| `text-display` | 36px / 800 | Marketing hero only |
| `text-h1` | 30px / 700 | Page titles |
| `text-h2` | 24px / 700 | Section titles |
| `text-h3` | 20px / 600 | Card titles |
| `text-body` | 15px / 400 | Default body |
| `text-body-sm` | 14px / 400 | Dense UI, table cells |
| `text-small` | 13px / 400 | Secondary info |
| `text-caption` | 12px / 400 | Captions, muted |
| `text-label` | 12px / 600 | Form labels |
| `text-overline` | 11px / 700 caps | Eyebrow labels |

## 6. Brand Personality

1. **Clear** — no ambiguity; every status, action, and label says exactly what it means.
2. **Trustworthy** — audit trails, honest states, no dark patterns. The product is a system of record.
3. **Calm** — quiet neutrals, restrained color; blue is used for action, not decoration.
4. **Efficient** — core flows under 2 minutes; nothing decorative slows the task.
5. **Human** — work happens *together*; copy is plain and warm, never bureaucratic.

## 7. Usage Rules

- **Spacing:** 4px base grid (`p-2` = 8px, `p-4` = 16px…). Use Tailwind scale only.
- **Corner radius:** `sm` 6px inputs · `md` 8px buttons · `lg` 12px cards · `xl` 16px modals · `full` badges/avatars.
- **Shadows:** `sm` resting cards · `md` hover/dropdowns · `lg` modals. Never invent new shadows.
- **Emphasis:** one primary action per view. Use `brand-600` for the action, `surface` + `border` for everything else.
- **Imagery:** no stock photos in the product UI. Empty states use the design-system `EmptyState` icon + copy, not illustrations.
- **Focus:** always visible — `brand-600` 2px outline (already global in `index.css`). Never remove it.
- **Contrast:** text on tinted backgrounds uses the paired `*-text` token, never the base color.
