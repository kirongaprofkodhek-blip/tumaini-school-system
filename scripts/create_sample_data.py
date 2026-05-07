from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
SAMPLE_DB = ROOT_DIR / "sample_data" / "tumaini_sample.db"


def create_schema(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS learners (
            admission_no TEXT PRIMARY KEY,
            learner_name TEXT NOT NULL,
            class_level TEXT NOT NULL DEFAULT 'GRADE 1',
            parent_name TEXT NOT NULL,
            parent_phone TEXT NOT NULL,
            boarding_status TEXT NOT NULL
                CHECK(boarding_status IN ('Boarder', 'Day Scholar')),
            transport_mode TEXT NOT NULL
                CHECK(transport_mode IN ('School Bus', 'Bicycle', 'Walking', 'N/A'))
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS reporting_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admission_no TEXT NOT NULL,
            learner_name TEXT NOT NULL,
            report_date TEXT NOT NULL,
            report_time TEXT NOT NULL,
            arrival_transport_mode TEXT NOT NULL DEFAULT 'N/A',
            accompanied_source TEXT NOT NULL DEFAULT 'Registered Parent',
            accompanied_by_name TEXT NOT NULL DEFAULT '',
            accompanied_by_phone TEXT NOT NULL DEFAULT '',
            company TEXT NOT NULL,
            FOREIGN KEY (admission_no) REFERENCES learners(admission_no) ON DELETE CASCADE
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
        "INSERT OR IGNORE INTO settings(setting_key, setting_value) VALUES(?, ?)",
        ("school_name", "Tumaini Academy"),
    )
    conn.execute(
        "INSERT OR IGNORE INTO settings(setting_key, setting_value) VALUES(?, ?)",
        ("default_report_dir", str(ROOT_DIR / "sample_data" / "Reports")),
    )
    conn.execute(
        "INSERT OR IGNORE INTO settings(setting_key, setting_value) VALUES(?, ?)",
        ("app_password", ""),
    )
    conn.execute(
        "INSERT OR IGNORE INTO settings(setting_key, setting_value) VALUES(?, ?)",
        ("logo_path", ""),
    )
    conn.commit()


def seed_learners(conn: sqlite3.Connection) -> None:
    learners = [
        ("ADM001", "Amina Otieno", "GRADE 6", "Grace Otieno", "+254712000001", "Boarder", "N/A"),
        ("ADM002", "Brian Mwangi", "GRADE 8", "John Mwangi", "+254712000002", "Boarder", "N/A"),
        ("ADM003", "Cynthia Njeri", "PRE PRIMARY TWO", "Mary Njeri", "+254712000003", "Day Scholar", "School Bus"),
        ("ADM004", "David Kiptoo", "GRADE 3", "Peter Kiptoo", "+254712000004", "Day Scholar", "Bicycle"),
        ("ADM005", "Eunice Achieng", "GRADE 2", "Grace Otieno", "+254712000001", "Day Scholar", "School Bus"),
        ("ADM006", "Faith Wanjiku", "GRADE 10", "Mary Njeri", "+254712000003", "Day Scholar", "Walking"),
        ("ADM007", "George Kamau", "GRADE 7", "Anne Kamau", "+254712000007", "Boarder", "N/A"),
        ("ADM008", "Hannah Kibet", "PRE PRIMARY ONE", "Samuel Kibet", "+254712000008", "Day Scholar", "School Bus"),
    ]
    conn.executemany(
        """
        INSERT INTO learners(
            admission_no, learner_name, class_level, parent_name, parent_phone, boarding_status, transport_mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        learners,
    )
    conn.commit()


def seed_reporting_records(conn: sqlite3.Connection) -> None:
    base_date = datetime.now().date()
    records = [
        ("ADM001", "Amina Otieno", str(base_date - timedelta(days=2)), "07:40", "N/A", "Registered Parent", "Grace Otieno", "+254712000001", "Mother"),
        ("ADM002", "Brian Mwangi", str(base_date - timedelta(days=1)), "08:10", "N/A", "Registered Parent", "John Mwangi", "+254712000002", "Father"),
        ("ADM007", "George Kamau", str(base_date), "07:55", "N/A", "Other Person", "David Kamau", "+254712222222", "Uncle"),
        ("ADM003", "Cynthia Njeri", str(base_date), "08:05", "School Bus", "Registered Parent", "Mary Njeri", "+254712000003", "Mother"),
        ("ADM005", "Eunice Achieng", str(base_date), "08:15", "School Bus", "Other Person", "John Odhiambo", "+254700111222", "Guardian"),
    ]
    conn.executemany(
        """
        INSERT INTO reporting_records(
            admission_no,
            learner_name,
            report_date,
            report_time,
            arrival_transport_mode,
            accompanied_source,
            accompanied_by_name,
            accompanied_by_phone,
            company
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        records,
    )
    conn.commit()


def create_sample_database() -> None:
    SAMPLE_DB.parent.mkdir(parents=True, exist_ok=True)
    if SAMPLE_DB.exists():
        SAMPLE_DB.unlink()

    with sqlite3.connect(SAMPLE_DB) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        create_schema(conn)
        seed_learners(conn)
        seed_reporting_records(conn)

    print(f"Sample database created: {SAMPLE_DB}")


if __name__ == "__main__":
    create_sample_database()
