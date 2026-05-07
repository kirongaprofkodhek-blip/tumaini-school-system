from __future__ import annotations

import os
import secrets
import sqlite3
from datetime import datetime
from pathlib import Path

APP_DIR = Path(os.getenv("APPDATA", str(Path.home()))) / "TumainiAcademyLMS"
DB_PATH = APP_DIR / "tumaini_academy.db"
DEFAULT_REPORT_DIR = APP_DIR / "ExamReports"

CLASS_LEVELS = (
    "PRE PRIMARY ONE",
    "PRE PRIMARY TWO",
    "GRADE 1",
    "GRADE 2",
    "GRADE 3",
    "GRADE 4",
    "GRADE 5",
    "GRADE 6",
    "GRADE 7",
    "GRADE 8",
    "GRADE 9",
    "GRADE 10",
)
DEFAULT_TERMS = ("Term 1", "Term 2", "Term 3")


def timestamp_now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def report_timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def compute_level(mark: float, max_marks: float, formula: str) -> str:
    """
    Formula format: "80:Exceeds,60:Meets,40:Approaching,0:Below"
    The first threshold whose cutoff is met by the percentage is returned.
    """
    if not formula:
        return ""
    try:
        percent = (mark / max_marks) * 100 if max_marks > 0 else 0
    except Exception:
        return ""
    pairs = [p.strip() for p in formula.split(",") if p.strip()]
    thresholds: list[tuple[float, str]] = []
    for pair in pairs:
        if ":" not in pair:
            continue
        num, label = pair.split(":", 1)
        try:
            thresholds.append((float(num.strip()), label.strip()))
        except ValueError:
            continue
    thresholds.sort(key=lambda x: x[0], reverse=True)
    for cutoff, label in thresholds:
        if percent >= cutoff:
            return label
    return thresholds[-1][1] if thresholds else ""


class ExamDatabase:
    def __init__(self, db_path: Path = DB_PATH) -> None:
        self.db_path = db_path

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def initialize(self) -> None:
        APP_DIR.mkdir(parents=True, exist_ok=True)
        DEFAULT_REPORT_DIR.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            # Keep this table creation so this app can run independently.
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS learners (
                    admission_no TEXT PRIMARY KEY,
                    learner_name TEXT NOT NULL,
                    class_level TEXT NOT NULL DEFAULT 'GRADE 1',
                    parent_name TEXT NOT NULL DEFAULT '',
                    parent_phone TEXT NOT NULL DEFAULT '',
                    boarding_status TEXT NOT NULL DEFAULT 'Day Scholar',
                    transport_mode TEXT NOT NULL DEFAULT 'School Bus'
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS settings (
                    setting_key TEXT PRIMARY KEY,
                    setting_value TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS learning_areas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    class_level TEXT NOT NULL,
                    name TEXT NOT NULL,
                    max_marks REAL NOT NULL DEFAULT 100,
                    min_marks REAL NOT NULL DEFAULT 0,
                    level_formula TEXT NOT NULL DEFAULT ''
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS exam_forms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    token TEXT NOT NULL UNIQUE,
                    exam_name TEXT NOT NULL,
                    term TEXT NOT NULL,
                    year INTEGER NOT NULL,
                    class_level TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    max_marks REAL NOT NULL DEFAULT 100,
                    learning_area_id INTEGER,
                    created_at TEXT NOT NULL,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    FOREIGN KEY (learning_area_id) REFERENCES learning_areas(id) ON DELETE SET NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS exam_marks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    exam_id INTEGER NOT NULL,
                    admission_no TEXT NOT NULL,
                    marks REAL NOT NULL,
                    teacher_name TEXT NOT NULL DEFAULT '',
                    submitted_at TEXT NOT NULL,
                    UNIQUE(exam_id, admission_no),
                    FOREIGN KEY (exam_id) REFERENCES exam_forms(id) ON DELETE CASCADE,
                    FOREIGN KEY (admission_no) REFERENCES learners(admission_no) ON DELETE CASCADE
                )
                """
            )
            conn.execute(
                "INSERT OR IGNORE INTO settings(setting_key, setting_value) VALUES(?, ?)",
                ("exam_base_url", "http://127.0.0.1:5050"),
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_exam_forms_lookup ON exam_forms(class_level, term, year, subject)"
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_exam_marks_exam_id ON exam_marks(exam_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_learning_areas_class ON learning_areas(class_level)")
            conn.commit()

    def get_setting(self, key: str, default: str = "") -> str:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT setting_value FROM settings WHERE setting_key = ?",
                (key,),
            ).fetchone()
            return row["setting_value"] if row else default

    def set_setting(self, key: str, value: str) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO settings(setting_key, setting_value)
                VALUES(?, ?)
                ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value
                """,
                (key, value),
            )
            conn.commit()

    def get_learners_by_class(self, class_level: str) -> list[sqlite3.Row]:
        with self._connect() as conn:
            return conn.execute(
                """
                SELECT admission_no, learner_name, class_level
                FROM learners
                WHERE class_level = ?
                ORDER BY learner_name ASC
                """,
                (class_level,),
            ).fetchall()

    def create_exam_form(
        self,
        exam_name: str,
        term: str,
        year: int,
        class_level: str,
        subject: str,
        max_marks: float,
        learning_area_id: int | None = None,
    ) -> str:
        if class_level not in CLASS_LEVELS:
            raise ValueError("Select a valid class.")
        if max_marks <= 0:
            raise ValueError("Max marks must be greater than zero.")
        token = secrets.token_urlsafe(12)
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO exam_forms (
                    token, exam_name, term, year, class_level, subject, max_marks, learning_area_id, created_at, is_active
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                """,
                (
                    token,
                    exam_name.strip(),
                    term.strip(),
                    int(year),
                    class_level.strip(),
                    subject.strip(),
                    float(max_marks),
                    learning_area_id,
                    timestamp_now(),
                ),
            )
            conn.commit()
        return token

    def list_exam_forms(self, active_only: bool = True) -> list[sqlite3.Row]:
        query = """
            SELECT id, token, exam_name, term, year, class_level, subject, max_marks, created_at, is_active
            FROM exam_forms
        """
        params: tuple[object, ...] = ()
        if active_only:
            query += " WHERE is_active = 1"
        query += " ORDER BY id DESC"
        with self._connect() as conn:
            return conn.execute(query, params).fetchall()

    def get_exam_form(self, exam_id: int) -> sqlite3.Row | None:
        with self._connect() as conn:
            return conn.execute(
                """
                SELECT id, token, exam_name, term, year, class_level, subject, max_marks, created_at, is_active
                FROM exam_forms
                WHERE id = ?
                """,
                (exam_id,),
            ).fetchone()

    def get_exam_form_by_token(self, token: str) -> sqlite3.Row | None:
        with self._connect() as conn:
            return conn.execute(
                """
                SELECT id, token, exam_name, term, year, class_level, subject, max_marks, learning_area_id, created_at, is_active
                FROM exam_forms
                WHERE token = ? AND is_active = 1
                """,
                (token,),
            ).fetchone()

    def save_submission(
        self,
        token: str,
        teacher_name: str,
        marks_by_admission: dict[str, str],
    ) -> int:
        form = self.get_exam_form_by_token(token)
        if not form:
            raise ValueError("Exam form link is invalid or inactive.")

        learners = self.get_learners_by_class(form["class_level"])
        allowed = {row["admission_no"] for row in learners}
        max_marks = float(form["max_marks"])
        cleaned_teacher = teacher_name.strip()

        saved = 0
        with self._connect() as conn:
            for admission_no, raw_marks in marks_by_admission.items():
                if admission_no not in allowed:
                    continue
                mark_text = (raw_marks or "").strip()
                if mark_text == "":
                    continue
                try:
                    mark_value = float(mark_text)
                except ValueError:
                    continue
                if mark_value < 0:
                    mark_value = 0
                if mark_value > max_marks:
                    mark_value = max_marks

                conn.execute(
                    """
                    INSERT INTO exam_marks(exam_id, admission_no, marks, teacher_name, submitted_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(exam_id, admission_no) DO UPDATE SET
                        marks = excluded.marks,
                        teacher_name = excluded.teacher_name,
                        submitted_at = excluded.submitted_at
                    """,
                    (
                        int(form["id"]),
                        admission_no,
                        mark_value,
                        cleaned_teacher,
                        timestamp_now(),
                    ),
                )
                saved += 1
            conn.commit()
        return saved

    def save_marks_for_exam(
        self,
        exam_id: int,
        marks_by_admission: dict[str, float],
        teacher_name: str = "Office Entry",
    ) -> int:
        form = self.get_exam_form(exam_id)
        if not form:
            raise ValueError("Selected exam form was not found.")
        normalized = {adm: str(marks) for adm, marks in marks_by_admission.items()}
        return self.save_submission(form["token"], teacher_name, normalized)

    def get_marks_for_exam(self, exam_id: int) -> list[sqlite3.Row]:
        with self._connect() as conn:
            return conn.execute(
                """
                SELECT
                    l.admission_no,
                    l.learner_name,
                    ef.class_level,
                    ef.subject,
                    ef.max_marks,
                    ef.learning_area_id,
                    la.level_formula,
                    em.marks,
                    em.teacher_name,
                    em.submitted_at
                FROM exam_forms ef
                INNER JOIN learners l ON l.class_level = ef.class_level
                LEFT JOIN exam_marks em
                    ON em.exam_id = ef.id
                   AND em.admission_no = l.admission_no
                LEFT JOIN learning_areas la
                    ON la.id = ef.learning_area_id
                WHERE ef.id = ?
                ORDER BY l.learner_name ASC
                """,
                (exam_id,),
            ).fetchall()

    def list_learning_areas(self, class_level: str | None = None) -> list[sqlite3.Row]:
        with self._connect() as conn:
            if class_level:
                return conn.execute(
                    """
                    SELECT id, class_level, name, max_marks, min_marks, level_formula
                    FROM learning_areas
                    WHERE class_level = ?
                    ORDER BY name ASC
                    """,
                    (class_level,),
                ).fetchall()
            return conn.execute(
                """
                SELECT id, class_level, name, max_marks, min_marks, level_formula
                FROM learning_areas
                ORDER BY class_level ASC, name ASC
                """
            ).fetchall()

    def get_learning_area(self, area_id: int) -> sqlite3.Row | None:
        with self._connect() as conn:
            return conn.execute(
                """
                SELECT id, class_level, name, max_marks, min_marks, level_formula
                FROM learning_areas
                WHERE id = ?
                """,
                (area_id,),
            ).fetchone()

    def upsert_learning_area(
        self,
        area_id: int | None,
        class_level: str,
        name: str,
        max_marks: float,
        min_marks: float,
        level_formula: str,
    ) -> int:
        if class_level not in CLASS_LEVELS:
            raise ValueError("Select a valid class level.")
        if max_marks <= 0:
            raise ValueError("Max marks must be greater than zero.")
        if min_marks < 0:
            min_marks = 0
        with self._connect() as conn:
            if area_id is None:
                cursor = conn.execute(
                    """
                    INSERT INTO learning_areas(class_level, name, max_marks, min_marks, level_formula)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (class_level, name.strip(), float(max_marks), float(min_marks), level_formula.strip()),
                )
                conn.commit()
                return int(cursor.lastrowid)
            conn.execute(
                """
                UPDATE learning_areas
                SET class_level = ?, name = ?, max_marks = ?, min_marks = ?, level_formula = ?
                WHERE id = ?
                """,
                (class_level, name.strip(), float(max_marks), float(min_marks), level_formula.strip(), int(area_id)),
            )
            conn.commit()
            return int(area_id)

    def delete_learning_area(self, area_id: int) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM learning_areas WHERE id = ?", (int(area_id),))
            conn.commit()
