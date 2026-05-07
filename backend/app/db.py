import sqlite3
from datetime import datetime
from pathlib import Path
import shutil

from sqlalchemy import Boolean, DateTime, create_engine, func, inspect, select, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    pass


def ensure_sqlite_database_file() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    database = make_url(settings.database_url).database
    if not database or database == ":memory:":
        return

    target_path = Path(database)
    if not target_path.is_absolute():
        target_path = Path.cwd() / target_path

    target_path.parent.mkdir(parents=True, exist_ok=True)
    if target_path.exists() and target_path.stat().st_size > 0:
        return

    repo_root = Path(__file__).resolve().parents[2]
    seed_path = repo_root / "tumaini_school.db"
    if seed_path.exists() and seed_path.stat().st_size > 0:
        shutil.copy2(seed_path, target_path)


ensure_sqlite_database_file()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def _convert_seed_value(column, value):
    if value is None:
        return None
    if isinstance(column.type, DateTime) and isinstance(value, str):
        return datetime.fromisoformat(value)
    if isinstance(column.type, Boolean):
        return bool(value)
    return value


def import_seed_sqlite_data() -> None:
    if settings.database_url.startswith("sqlite"):
        return

    repo_root = Path(__file__).resolve().parents[2]
    seed_path = repo_root / "tumaini_school.db"
    if not seed_path.exists() or seed_path.stat().st_size == 0:
        return

    table_order = [
        "users",
        "classes",
        "parent_contacts",
        "learners",
        "staff_profiles",
        "learning_areas",
        "teaching_assignments",
        "class_responsibilities",
        "reporting_records",
        "sms_delivery_logs",
        "exams",
        "mark_entries",
        "sms_templates",
        "sms_broadcasts",
        "books",
        "book_loans",
        "website_pages",
        "login_sessions",
    ]

    with engine.begin() as connection:
        users_table = Base.metadata.tables.get("users")
        if users_table is None:
            return

        existing_users = connection.execute(select(func.count()).select_from(users_table)).scalar_one()
        if existing_users:
            return

        sqlite_connection = sqlite3.connect(seed_path)
        sqlite_connection.row_factory = sqlite3.Row
        try:
            sqlite_tables = {
                row["name"]
                for row in sqlite_connection.execute(
                    "SELECT name FROM sqlite_master WHERE type = 'table'"
                )
            }

            for table_name in table_order:
                if table_name not in sqlite_tables or table_name not in Base.metadata.tables:
                    continue

                table = Base.metadata.tables[table_name]
                seed_rows = sqlite_connection.execute(f'SELECT * FROM "{table_name}"').fetchall()
                if not seed_rows:
                    continue

                records = []
                for seed_row in seed_rows:
                    record = {}
                    for column in table.columns:
                        if column.name in seed_row.keys():
                            record[column.name] = _convert_seed_value(column, seed_row[column.name])
                    records.append(record)

                if records:
                    connection.execute(table.insert(), records)

            if connection.dialect.name == "postgresql":
                for table_name in table_order:
                    if table_name not in Base.metadata.tables:
                        continue
                    table = Base.metadata.tables[table_name]
                    if "id" not in table.c:
                        continue
                    connection.execute(
                        text(
                            "SELECT setval("
                            "pg_get_serial_sequence(:table_name, 'id'), "
                            "COALESCE((SELECT MAX(id) FROM "
                            f"{table_name}"
                            "), 1), "
                            "true)"
                        ),
                        {"table_name": table_name},
                    )
        finally:
            sqlite_connection.close()


def run_migrations() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    with engine.begin() as connection:
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())

        if "users" in tables:
            connection.execute(
                text(
                    "UPDATE users SET role = 'TEACHER' "
                    "WHERE role IN ('CLASS_TEACHER', 'SUBJECT_TEACHER')"
                )
            )

        if "sms_templates" in tables:
            connection.execute(
                text(
                    "UPDATE sms_templates SET scope = 'teacher' "
                    "WHERE lower(scope) IN ('class_teacher', 'subject_teacher')"
                )
            )

        if "reporting_records" in tables:
            columns = {column["name"] for column in inspector.get_columns("reporting_records")}
            additions = [
                ("accompanied_source", "accompanied_source VARCHAR(40) DEFAULT 'parent'"),
                ("arrival_transport_mode", "arrival_transport_mode VARCHAR(40)"),
                ("learner_boarding_status", "learner_boarding_status VARCHAR(40) DEFAULT 'Day Scholar'"),
                ("class_name_snapshot", "class_name_snapshot VARCHAR(120)"),
            ]
            for column_name, column_sql in additions:
                if column_name not in columns:
                    connection.execute(text(f"ALTER TABLE reporting_records ADD COLUMN {column_sql}"))

        if "exams" in tables:
            columns = {column["name"] for column in inspector.get_columns("exams")}
            additions = [
                ("exam_type", "exam_type VARCHAR(40) DEFAULT 'Midterm'"),
                ("exam_month", "exam_month VARCHAR(20)"),
                ("marks_deadline", "marks_deadline DATETIME"),
                ("status", "status VARCHAR(20) DEFAULT 'active'"),
            ]
            for column_name, column_sql in additions:
                if column_name not in columns:
                    connection.execute(text(f"ALTER TABLE exams ADD COLUMN {column_sql}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
