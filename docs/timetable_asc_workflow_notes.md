# Timetable Workflow Notes

Source material inspected:

- `C:\office.r\TimeTables\Tumaini Draft.roz`
- `C:\office.r\TimeTables\template\Import Samples\XML\*.xml`
- `C:\office.r\TimeTables\resources\tips\tips_en.txt`
- YouTube tutorial link supplied by the user: `https://www.youtube.com/watch?v=idSoZcEOwHo`

## aSc-Like Setup Flow

The timetable should not start with manual placement. It should start with structured data:

1. School days and periods, including breaks.
2. Classes or forms.
3. Subjects or learning areas.
4. Teachers.
5. Rooms and special spaces.
6. Teaching contracts: class + subject + teacher + periods per week.
7. Constraints and preferences.
8. Test/check timetable data.
9. Generate or manually place cards.
10. Lock important cards, adjust, print, publish, or export.

The aSc XML samples separate `teachers`, `classes`, `subjects`, `classrooms`, `groupsubjects`, and `cards`. In our system:

- `groupsubjects` maps to timetable lesson requirements.
- `cards` maps to placed timetable slots.
- Locked cards should remain fixed while generation fills the rest.

## Required App Behavior

- Show unplaced lesson requirements as cards with a remaining count.
- Let school leaders create weekly lesson requirements from existing class, learning area, and teacher assignments.
- Check that every requirement has the right number of weekly periods.
- Check class, teacher, and room clashes.
- Prevent lessons in break periods.
- Allow a preferred room on a requirement.
- Allow locking a placed lesson so future generation does not move it.
- Let users filter the board by class or teacher.
- Explain timetable issues in plain language before generation.

## Current First Implementation

The backend now supports:

- `GET /api/timetable/requirements`
- `POST /api/timetable/requirements`
- `DELETE /api/timetable/requirements/{id}`
- `GET /api/timetable/check`
- `POST /api/timetable/generate`

The generator is deliberately simple for the first pass: it fills missing cards into free teaching periods while avoiding class, teacher, and room clashes. Later work should add stronger constraints such as unavailable times, subject distribution rules, double lessons, room suitability, split groups, and manual drag/drop placement.
