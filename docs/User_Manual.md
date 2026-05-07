# Tumaini Academy Learner Management System - User Manual

## 1. System Overview
This is an offline desktop application for managing learners, daily arrival reporting, and report generation.

## 2. Start the Application
1. Double-click `TumainiAcademyLMS.exe` (or run `python app.py` during development).
2. If an app password is configured, enter it at login.

## 3. Learners Tab
Use this tab to add and maintain learner records.

Fields:
- Admission Number (unique)
- Learner Name
- Parent Name
- Parent Phone
- Boarding Status (`Boarder` or `Day Scholar`)
- Transport Mode (`N/A`, `School Bus`, `Bicycle`, `Walking`)

Buttons:
- `Save`: create a new learner
- `Search`: load learner using admission number
- `Update`: update selected learner
- `Delete`: delete learner (with confirmation)
- `Clear`: clear form inputs
- `Import Excel List`: import learners from an `.xlsx` file (ADM, NAME, GRADE, parent, TELPHONE NO)

## 4. Reporting Tab
1. Search learner by name or admission number.
2. Optionally apply dropdown filters for class, boarding status, and transport.
3. Select a learner from the table.
4. Confirm date/time.
5. Choose transport if learner is a day scholar.
6. Select `Accompanied By`:
   - `Registered Parent`: auto-fills parent details.
   - `Other Person`: enter name and phone.
7. Click `Reported`.

Today's arrivals are shown in the lower table.

## 5. Reports Tab
Select:
- From date and To date (for boarder reporting range)
- Report Type:
  - Boarders List
  - School Bus Users
  - All Learners with Parent Details
  - Parents with Multiple Learners
- Output Format: `PDF` or `Word`

Click `Generate Report`.

Output files are saved using:
- `ReportName_YYYYMMDD_HHMMSS.pdf`
- `ReportName_YYYYMMDD_HHMMSS.docx`

## 6. Backup and Settings Tab
Backup/Restore:
- `Backup Database`: save a copy of the SQLite `.db` file
- `Restore from Backup`: replace current database with a backup

Settings:
- School name
- Default reports folder
- Logo image path (PNG)
- Optional application password

## 7. Data Validation
- Duplicate admission numbers are rejected.
- Parent phone requires 10-15 digits (optional leading `+`).
- Boarders automatically use transport mode `N/A`.

## 8. Troubleshooting
- If PDF export fails: install `reportlab`.
- If Word export fails: install `python-docx`.
- If executable build fails: install `pyinstaller`.

Install all required packages:

```bash
pip install -r requirements.txt
```
