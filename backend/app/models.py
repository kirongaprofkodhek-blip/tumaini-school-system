from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    HEAD_TEACHER = "head_teacher"
    TEACHER = "teacher"
    CLASS_TEACHER = "class_teacher"
    SUBJECT_TEACHER = "subject_teacher"
    LIBRARIAN = "librarian"
    PARENT = "parent"
    VISITOR = "visitor"


TEACHER_ROLES = {
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.SUBJECT_TEACHER,
}


def is_teacher_role(role: UserRole | None) -> bool:
    return role in TEACHER_ROLES


def public_role_value(role: UserRole) -> str:
    return UserRole.TEACHER.value if is_teacher_role(role) else role.value


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(150), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class LoginSession(Base):
    __tablename__ = "login_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ClassRoom(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    stream: Mapped[str | None] = mapped_column(String(40), nullable=True)


class ParentContact(Base):
    __tablename__ = "parent_contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150))
    phone_number: Mapped[str] = mapped_column(String(30), index=True)
    relationship: Mapped[str] = mapped_column(String(60), default="Parent")


class Learner(Base):
    __tablename__ = "learners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    admission_no: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150))
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"))
    parent_contact_id: Mapped[int | None] = mapped_column(ForeignKey("parent_contacts.id"), nullable=True)
    boarding_status: Mapped[str] = mapped_column(String(40), default="Day Scholar")
    transport_mode: Mapped[str] = mapped_column(String(40), default="School Bus")

    class_room: Mapped[ClassRoom] = relationship()
    parent_contact: Mapped[ParentContact | None] = relationship()


class StaffProfile(Base):
    __tablename__ = "staff_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    employee_no: Mapped[str | None] = mapped_column(String(40), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)

    user: Mapped[User] = relationship()


class LearningArea(Base):
    __tablename__ = "learning_areas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"))
    name: Mapped[str] = mapped_column(String(120))
    min_marks: Mapped[float] = mapped_column(Float, default=0)
    max_marks: Mapped[float] = mapped_column(Float, default=100)
    cbc_formula: Mapped[str] = mapped_column(Text, default="")

    class_room: Mapped[ClassRoom] = relationship()


class TeachingAssignment(Base):
    __tablename__ = "teaching_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    teacher_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"))
    learning_area_id: Mapped[int] = mapped_column(ForeignKey("learning_areas.id"))
    is_class_teacher: Mapped[bool] = mapped_column(Boolean, default=False)


class ClassResponsibility(Base):
    __tablename__ = "class_responsibilities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    teacher_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), unique=True)


class ReportingRecord(Base):
    __tablename__ = "reporting_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id"))
    report_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    accompanied_source: Mapped[str] = mapped_column(String(40), default="parent")
    accompanied_by: Mapped[str] = mapped_column(String(150))
    accompanied_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    arrival_transport_mode: Mapped[str | None] = mapped_column(String(40), nullable=True)
    learner_boarding_status: Mapped[str] = mapped_column(String(40), default="Day Scholar")
    class_name_snapshot: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sms_status: Mapped[str] = mapped_column(String(30), default="pending")


class SmsDeliveryLog(Base):
    __tablename__ = "sms_delivery_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    phone_number: Mapped[str] = mapped_column(String(30), index=True)
    audience_type: Mapped[str] = mapped_column(String(60), default="parent")
    message_body: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(String(40), default="console")
    status: Mapped[str] = mapped_column(String(40), default="queued")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    exam_type: Mapped[str] = mapped_column(String(40), default="Midterm")
    exam_month: Mapped[str | None] = mapped_column(String(20), nullable=True)
    term: Mapped[str] = mapped_column(String(40))
    year: Mapped[int] = mapped_column(Integer)
    marks_deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"))
    learning_area_id: Mapped[int] = mapped_column(ForeignKey("learning_areas.id"))
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class MarkEntry(Base):
    __tablename__ = "mark_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id"))
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id"))
    marks: Mapped[float] = mapped_column(Float)
    level: Mapped[str | None] = mapped_column(String(60), nullable=True)
    entered_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    entered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SmsTemplate(Base):
    __tablename__ = "sms_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    scope: Mapped[str] = mapped_column(String(40), default="admin")
    message_body: Mapped[str] = mapped_column(Text)


class SmsBroadcast(Base):
    __tablename__ = "sms_broadcasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    audience_filter: Mapped[str] = mapped_column(String(120))
    message_body: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="queued")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    accession_no: Mapped[str] = mapped_column(String(80), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    author: Mapped[str | None] = mapped_column(String(120), nullable=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    total_copies: Mapped[int] = mapped_column(Integer, default=1)
    available_copies: Mapped[int] = mapped_column(Integer, default=1)


class BookLoan(Base):
    __tablename__ = "book_loans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    learner_id: Mapped[int | None] = mapped_column(ForeignKey("learners.id"), nullable=True)
    teacher_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    class_id: Mapped[int | None] = mapped_column(ForeignKey("classes.id"), nullable=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    returned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class WebsitePage(Base):
    __tablename__ = "website_pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
