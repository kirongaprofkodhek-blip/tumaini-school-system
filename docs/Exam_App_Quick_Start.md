# Tumaini Exam App Quick Start

## 1) Install Dependencies
```bash
pip install -r requirements.txt
```

## 2) Start the Desktop Exam App
```bash
python exam_app.py
```

What you can do:
- Create class+subject mark-entry links for teachers.
- Load submitted marks.
- Update marks manually from office.
- Download marks reports as PDF/Word.

## 3) Start the Online Mark Entry Portal
```bash
python exam_portal.py
```

Default local URL:
- `http://127.0.0.1:5050`

Teacher form link format:
- `http://127.0.0.1:5050/fill/<token>`

## 4) Share Links with Teachers
- In `exam_app.py`, generate a link in **Online Forms**.
- Copy and send the generated link.
- Teachers submit marks online from phone/laptop browser.

## Notes
- Uses the same learner database in `%APPDATA%\\TumainiAcademyLMS\\tumaini_academy.db`.
- Learners are filtered by class from the existing learner list.
