# Tumaini School Backend

## Purpose

Backend API for the full school system:

- learner reporting
- academics and CBC marks
- teacher assignments
- SMS messaging
- library workflows
- public website content

## Run

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
```

Optional environment file:

- Copy `backend/.env.example` to `backend/.env`
- Set `TUMAINI_SMS_PROVIDER=twilio` or `TUMAINI_SMS_PROVIDER=africastalking`
- Fill in the matching credentials

## First Working Flows

- `POST /api/auth/bootstrap-admin`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/users`
- `GET /api/auth/users`
- `POST /api/reporting/learners`
- `GET /api/reporting/learners`
- `POST /api/reporting/arrivals`
- `GET /api/reporting/arrivals/recent`
- `GET /api/reporting/lists/class`
- `GET /api/reporting/lists/boarders`
- `POST /api/academics/classes`
- `GET /api/academics/classes`
- `POST /api/academics/learning-areas`
- `GET /api/academics/learning-areas`
- `POST /api/academics/assignments`
- `GET /api/academics/assignments/my`
- `POST /api/academics/exams`
- `POST /api/academics/marks`
- `POST /api/academics/merit-lists`
- `POST /api/messaging/templates`
- `GET /api/messaging/templates`
- `POST /api/messaging/broadcasts`
- `POST /api/messaging/class-teacher`
- `GET /api/messaging/delivery-logs`
- `POST /api/library/books`
- `GET /api/library/books`
- `POST /api/library/loans`
- `POST /api/library/loans/{loan_id}/return`
- `GET /api/library/loans`
- `GET /api/library/loans/overdue`
- `GET /api/website/public/home`
- `GET /api/website/public/pages`
- `POST /api/website/pages`
- `GET /api/website/pages`
- `GET /api/website/parent/learner-summary`

## Notes

- Default database is local SQLite for development.
- Production should move to PostgreSQL.
- SMS supports `console`, `twilio`, and `africastalking`.
- The Word file `TUMAINI ACADEMY.docx` confirms `Berlin Sans FB` for visible school-name branding.
