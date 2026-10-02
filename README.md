# SAWA — Employee Requests & Time Tracking

Django 5.2 + DRF + PostgreSQL backend · React 19 + TS + Vite + Tailwind v4 frontend.

## Dev quickstart

```bash
# 1. Database (Postgres 16 on host port 5434)
docker compose up -d db

# 2. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in SECRET_KEY, SEED_DEMO_PASSWORD, etc.
python manage.py migrate
python manage.py seed_demo  # 1 HR, 2 managers, 4 employees (2 per manager)
python manage.py runserver

# 3. Tests
pytest -q

# 4. Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

- API docs: http://localhost:8000/api/docs/ · OpenAPI: `/api/schema/`
- Admin: http://localhost:8000/admin/ (log in as seeded HR)
- Demo users: `hr@sawa.demo`, `manager.a@sawa.demo`, `manager.b@sawa.demo`, `sara|karim|mona|tarek@sawa.demo` — password = `SEED_DEMO_PASSWORD` from `.env`
- Specs: `specs/00x-*/` · API contract: `docs/api.md` · Data model: `docs/database.md`
