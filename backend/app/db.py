from pathlib import Path
import shutil

from sqlalchemy import create_engine, inspect, text
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
