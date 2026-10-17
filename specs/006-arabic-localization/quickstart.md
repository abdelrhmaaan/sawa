# Quickstart / Validation: Arabic Localization (006)

## Prerequisites

- Local stack running as in `README.md` (Postgres via compose, `backend/.venv`, `frontend/node_modules`).
- `python manage.py migrate` (applies `core/0002`), `python manage.py seed_demo`.
- For e2e runs, set high login throttle rates in your local `backend/.env` (the suite logs in about 30 times):
  `LOGIN_EMAIL_THROTTLE_RATE=1000/min`, `LOGIN_IP_THROTTLE_RATE=1000/min`.

## Automated gates

```bash
# backend
cd backend
.venv/bin/python manage.py compile_catalog          # .po → .mo (commit both)
.venv/bin/python manage.py makemigrations --check --dry-run   # only core/0002 exists, no new changes
.venv/bin/python -m pytest -q                       # all existing + new i18n tests green

# frontend
cd ../frontend
npm run typecheck
npm run i18n:check                                  # ar.json covers every en.json key
npm run build
npm run test:e2e                                    # incl. new e2e/i18n.spec.ts
```

## Manual walkthrough (maps to spec user stories)

| # | Steps | Expected |
|---|---|---|
| US1-a | Fresh browser profile → open app | English, `<html lang="en" dir="ltr">` |
| US1-b | On login page click language switch | Arabic text, `<html lang="ar" dir="rtl">`, Arabic font; typed email kept |
| US1-c | Sign in as `sara@sawa.demo`, submit a request, log time on a 375px viewport | All fixed text Arabic, layout mirrored, each flow < 2 min |
| US1-d | Reload | Still Arabic |
| US1-e | Visit every route + open each dialog/drawer at 375/768/1280 | No English fixed text, no horizontal scroll, chevrons point left |
| US2-a | Arabic: wrong password; then 6 quick wrong attempts | Arabic 401 message; Arabic 429 with seconds |
| US2-b | Arabic: overlapping / end-before-start / future time entry | Arabic field errors |
| US2-c | Arabic as manager: reject without comment | Arabic "comment required" |
| US2-d | `curl -H 'Accept-Language: fr' …` | English |
| US3-a | Sara (English) submits; `manager.a` opens bell in Arabic | Arabic sentence with "Sara Hassan" and the title intact |
| US3-b | `manager.a` switches to English, opens bell | Same notification in English |
| US3-c | Notifications created before the migration | Still listed, English text, no errors |

## Release gate (FR-013)

A fluent Arabic speaker reviews `frontend/src/i18n/locales/ar.json` and `backend/locale/ar/LC_MESSAGES/django.po` and signs off before deploy. The user owns this step.
