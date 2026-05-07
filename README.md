# Tumaini School System

This repository is now moving from standalone desktop utilities into a full school platform.

## Product Direction

The new system is being structured around:

- backend API for all school operations
- shared database and role-based access
- web frontend for admin, teachers, librarian, parents, and visitors
- SMS communication workflows
- public website and parent portal
- desktop-friendly access for admin and librarian stations where needed

The blueprint for the new direction is in:

- `docs/School_System_Blueprint.md`

## New Structure

### Backend API

- Code: `backend/`
- Entry point: `backend/app/main.py`
- First real flows now implemented:
  - admin bootstrap and login
  - role-based user creation
  - learner creation and reporting
  - parent SMS logging on reporting
  - classes, learning areas, teacher assignments
  - exams, marks entry, and merit list generation
  - SMS templates, broadcasts, and class-teacher parent messaging
  - library registry, issue/return, and overdue tracking
  - public website pages and parent learner-summary lookup

Run locally:

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
```

Windows shortcut script:

```bash
scripts\start_school_api.bat
```

### Frontend Portal

- Code: `frontend/`
- Role-based portal shell for:
  - admin
  - teacher
  - librarian
  - parent
  - visitor
- Branding updated around the Tumaini identity:
  - `Berlin Sans FB` for visible `TUMAINI ACADEMY` branding
  - logo palette blended from green, white, charcoal, gold, blue, and red accents
  - school logo copied into `frontend/public/tumaini_logo.png`

Run locally:

```bash
cd frontend
npm install
npm run dev
```

Windows shortcut script:

```bash
scripts\start_school_portal.bat
```

### Existing Desktop Apps

These remain in the repo as the current-generation tools and migration references:

- `app.py` for learner reporting and operational desktop workflows
- `exam_app.py` for exam marks desktop workflows
- `exam_portal.py` for the early teacher marks web form
- `exam_shared.py` for shared exam data logic

## Recommended Build Order

1. Complete backend authentication, permissions, and real database migrations
2. Migrate learner reporting into the backend and connect SMS provider
3. Migrate academics and teacher assignment workflows into the web portal
4. Add library circulation and public website content management
5. Keep only thin desktop shells where workstation-specific access is needed

## Deployment on Render

This repo includes `render.yaml` for a Render Blueprint with:

- `tumaini-backend`: Python/FastAPI web service
- `tumaini-frontend`: static Vite/React site
- `tumaini-db`: free Render Postgres database

### Deploy with Blueprint

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Render, choose **New > Blueprint** and select the repository.
3. Confirm that Render detects `render.yaml`, then create/sync the Blueprint.
4. After both services deploy, open:
   - Backend health check: `https://tumaini-backend.onrender.com/health`
   - Frontend: `https://tumaini-frontend.onrender.com`

### Database behavior

The free deployment uses Render Postgres instead of SQLite, because Render persistent disks require a paid web service plan.

On first boot, the backend creates the Postgres tables and imports rows from the bundled `tumaini_school.db` if the cloud database is empty. After import, new cloud data is stored in Postgres.

Render's free Postgres tier is intended for trials and demos. It expires after 30 days and does not include backups. For permanent school records, upgrade the database before the free trial expires.

### If Render changes the URLs

If Render assigns different `onrender.com` URLs, update these environment variables in the Render Dashboard and redeploy:

- Backend service: `TUMAINI_FRONTEND_URL=https://your-frontend-url.onrender.com`
- Frontend static site: `VITE_API_BASE_URL=https://your-backend-url.onrender.com`

### Local development

Use `frontend/.env.example` and `backend/.env.example` as templates for local environment configuration.
