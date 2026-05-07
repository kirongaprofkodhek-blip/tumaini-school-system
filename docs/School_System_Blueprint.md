# Tumaini School System Blueprint

## Goal

Move from separate desktop utilities into one school platform with:

- Web backend and central database
- Web portals for admin, teachers, librarian, parents, and visitors
- SMS-driven communication workflows
- Downloadable operational and academic reports
- Desktop-friendly access for admin and librarian workstations

## Product Shape

### 1. Core Platform

- Central backend API
- Shared relational database
- Role-based authentication and permissions
- Audit logging for sensitive actions
- Module-based frontend portal

### 2. Main Roles

- `Admin`
- `Head Teacher`
- `Class Teacher`
- `Subject Teacher`
- `Librarian`
- `Parent`
- `Visitor`

## Modules

### Learner Reporting

- Register learner arrivals and departures
- Search learners by admission number, name, class, boarding status
- Notify parents by SMS when a learner is reported
- Keep reporting history and filter by class/date/boarding

### Academics / CBC Marks

- Admin manages learning areas per class
- Admin defines mark ranges and CBC level formulas
- Admin assigns teachers to classes and learning areas
- Teachers log in and enter marks only for their assigned classes/subjects
- Class teachers download full class merit lists
- Subject teachers download subject merit lists
- Parents later view approved academic summaries

### Lists and Operational Reports

- Class lists
- Boarding learners list
- Day scholars list
- Parent contact lists
- Learner reporting reports

### Messaging

- Teacher-to-class parent broadcasts
- Admin broadcast by filters such as class, boarding status, day scholars, full school
- Saved SMS templates
- Message logs with delivery status

### Library

- Book registry
- Copies and stock tracking
- Issue/return books to learners, teachers, or classes
- Overdue tracking
- Librarian workstation access

### Public Website + Parent Portal

- Public pages for visitors: about, admissions, notices, contacts, news
- Parent login for learner information, reporting summaries, and approved results
- Optional announcements and downloadable documents

## Architecture Direction

### Backend

- `FastAPI` service
- `SQLAlchemy` models
- Database designed for `PostgreSQL` in production
- SQLite can still be used for local development
- SMS provider abstraction so we can plug in a real gateway later

### Frontend

- `React` + `TypeScript`
- Role-based dashboards
- Public website and secure portal in one frontend codebase

### Desktop Workstations

- Admin and librarian can still use desktop shortcuts or packaged shells
- The real source of truth becomes the backend + database, not local app files

## Core Data Areas

- Users and roles
- Staff profiles
- Learners and parents
- Classes/streams
- Reporting records
- Learning areas
- Teacher assignments
- Exams, marks, grades, merit lists
- SMS templates and broadcasts
- Library books and loans
- Website content

## Delivery Strategy

### Phase 1

- Backend foundation
- Shared database models
- Authentication and roles
- Admin portal shell
- Reporting APIs
- Academics configuration APIs

### Phase 2

- Teacher marks entry portal
- Merit list downloads
- Class lists and boarding reports
- SMS template workflows

### Phase 3

- Library workflows
- Parent portal
- Public website pages
- Real SMS provider integration

## Migration Note

Current desktop apps remain useful as references, but this new system should become the primary product line. Existing logic from:

- `app.py`
- `exam_app.py`
- `exam_portal.py`
- `exam_shared.py`

should be migrated into the backend/web architecture module by module.
