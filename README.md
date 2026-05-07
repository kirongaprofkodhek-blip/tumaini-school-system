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

This repo is ready for Render deployment. Use the included `.render.yaml` manifest or configure the services manually in Render.

### Backend service
- Service type: Python web service
- Build command: `pip install -r backend/requirements.txt`
- Start command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
- Ensure `TUMAINI_DATABASE_URL` is set to `sqlite:///./tumaini_school.db`
- Set `TUMAINI_FRONTEND_URL` to the deployed frontend URL, for example `https://<frontend-service>.onrender.com`

### Frontend service
- Service type: Static Site
- Build command: `cd frontend && npm ci && npm run build`
- Publish directory: `frontend/dist`
- Set `VITE_API_BASE_URL` to the deployed backend URL, for example `https://<backend-service>.onrender.com`
- Replace the placeholder values in `.render.yaml` with your actual Render service URLs after deployment.

### Local development
- Use `frontend/.env.example` and `backend/.env.example` as templates for local environment configuration.

### Notes
- The frontend now uses `VITE_API_BASE_URL` at build time so the deployed app points to your cloud backend.
- The backend allows the frontend origin from `TUMAINI_FRONTEND_URL` for CORS.
